package source

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
	"github.com/go-go-golems/rag-evaluation-system/internal/ingest"
)

// Service owns source creation and ingestion behavior shared by CLI, HTTP, and
// future workflow operations.
type Service struct {
	queries *db.Queries
}

func NewService(queries *db.Queries) *Service {
	return &Service{queries: queries}
}

type CreateRequest struct {
	ID     string
	Name   string
	Type   string
	Config map[string]interface{}
}

type CreateResult struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
	Status string `json:"status"`
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (*CreateResult, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	if req.ID == "" || req.Name == "" || req.Type == "" {
		return nil, fmt.Errorf("id, name, and type are required")
	}
	if req.Config == nil {
		req.Config = map[string]interface{}{}
	}
	configJSON, err := json.Marshal(req.Config)
	if err != nil {
		return nil, err
	}

	if err := s.queries.InsertSource(req.ID, req.Name, req.Type, string(configJSON)); err != nil {
		return nil, err
	}
	return &CreateResult{ID: req.ID, Name: req.Name, Type: req.Type, Status: "upserted"}, nil
}

type ScanRequest struct {
	SourceID string
	Dir      string
}

type ScanResult struct {
	SourceID      string   `json:"source_id"`
	Documents     []string `json:"documents"`
	DocumentCount int      `json:"document_count"`
}

func (s *Service) Scan(ctx context.Context, req ScanRequest) (*ScanResult, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	if req.SourceID == "" {
		return nil, fmt.Errorf("source id is required")
	}
	if req.Dir == "" {
		return nil, fmt.Errorf("dir is required")
	}

	scanner := ingest.NewScanner(s.queries)
	docIDs, err := scanner.ScanDir(req.SourceID, req.Dir)
	if err != nil {
		return nil, err
	}
	return &ScanResult{SourceID: req.SourceID, Documents: docIDs, DocumentCount: len(docIDs)}, nil
}

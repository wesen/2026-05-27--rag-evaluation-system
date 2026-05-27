package chunking

import (
	"context"
	"encoding/json"
	"fmt"

	chunkcore "github.com/go-go-golems/rag-evaluation-system/internal/chunking"
	"github.com/go-go-golems/rag-evaluation-system/internal/db"
)

// Service owns chunking behavior shared by CLI commands, HTTP handlers, and
// future scraper workflow operations.
type Service struct {
	queries *db.Queries
}

func NewService(queries *db.Queries) *Service {
	return &Service{queries: queries}
}

type ApplyRequest struct {
	DocumentID   string
	Strategy     string
	ChunkSize    int
	Overlap      int
	StrategyName string
	Description  string
}

type ApplyResult struct {
	DocumentID string            `json:"document_id"`
	StrategyID string            `json:"strategy_id"`
	ChunkCount int               `json:"chunk_count"`
	Chunks     []chunkcore.Chunk `json:"chunks,omitempty"`
}

func (s *Service) Apply(ctx context.Context, req ApplyRequest) (*ApplyResult, error) {
	if req.DocumentID == "" {
		return nil, fmt.Errorf("document id is required")
	}
	if req.Strategy == "" {
		req.Strategy = "fixed"
	}
	if req.ChunkSize == 0 {
		req.ChunkSize = 500
	}

	content, err := s.queries.GetDocumentContent(req.DocumentID)
	if err != nil {
		return nil, err
	}
	if content == "" {
		return nil, fmt.Errorf("document %s has no content", req.DocumentID)
	}

	strategyID := req.StrategyName
	if strategyID == "" {
		strategyID = fmt.Sprintf("%s-%d-%d", req.Strategy, req.ChunkSize, req.Overlap)
	}

	configJSON, _ := json.Marshal(map[string]interface{}{
		"type":       req.Strategy,
		"chunk_size": req.ChunkSize,
		"overlap":    req.Overlap,
	})
	description := req.Description
	if description == "" {
		description = fmt.Sprintf("Auto-created: %s with chunk_size=%d, overlap=%d", req.Strategy, req.ChunkSize, req.Overlap)
	}

	if err := s.queries.InsertChunkingStrategy(strategyID, strategyID, req.Strategy, string(configJSON), description); err != nil {
		return nil, err
	}

	chunker, err := chunkcore.NewChunkerFromType(req.Strategy, req.ChunkSize, req.Overlap, strategyID)
	if err != nil {
		return nil, err
	}

	chunks, err := chunker.Chunk(req.DocumentID, content)
	if err != nil {
		return nil, err
	}

	// Chunking is derived state. Rebuild this exact document/strategy pair so
	// retries and repeated operator runs are safe.
	if err := s.queries.DeleteChunksForDocumentStrategy(req.DocumentID, strategyID); err != nil {
		return nil, err
	}

	for _, ch := range chunks {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		boundariesJSON, _ := json.Marshal(map[string]interface{}{"strategy_id": strategyID})
		if err := s.queries.InsertChunk(
			ch.ID,
			ch.DocumentID,
			strategyID,
			ch.ChunkIndex,
			ch.Text,
			ch.TokenCount,
			ch.StartOffset,
			ch.EndOffset,
			string(boundariesJSON),
		); err != nil {
			return nil, err
		}
	}

	if err := s.queries.UpdateDocumentStatus(req.DocumentID, "chunked"); err != nil {
		return nil, err
	}

	return &ApplyResult{
		DocumentID: req.DocumentID,
		StrategyID: strategyID,
		ChunkCount: len(chunks),
		Chunks:     chunks,
	}, nil
}

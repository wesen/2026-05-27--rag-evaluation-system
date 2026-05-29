package documentprocessing

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
)

type Provider interface {
	ProcessDocument(ctx context.Context, req ProviderRequest) (*ProviderResult, error)
	Identity() ProviderIdentity
}

type ProviderIdentity struct {
	Provider string `json:"provider"`
	Model    string `json:"model"`
}

type ProviderRequest struct {
	DocumentID    string `json:"document_id"`
	Title         string `json:"title"`
	Content       string `json:"content"`
	ArtifactType  string `json:"artifact_type"`
	PromptVersion string `json:"prompt_version"`
}

type ProviderResult struct {
	OutputText string         `json:"output_text,omitempty"`
	OutputJSON map[string]any `json:"output_json,omitempty"`
}

type Service struct {
	queries *db.Queries
}

func NewService(queries *db.Queries) *Service {
	return &Service{queries: queries}
}

type ProcessRequest struct {
	DocumentID    string
	ArtifactType  string
	PromptVersion string
	Provider      Provider
	Force         bool
}

type ProcessResult struct {
	DocumentID    string `json:"document_id"`
	ArtifactType  string `json:"artifact_type"`
	PromptVersion string `json:"prompt_version"`
	Provider      string `json:"provider"`
	Model         string `json:"model"`
	InputHash     string `json:"input_hash"`
	Status        string `json:"status"`
	SkippedFresh  bool   `json:"skipped_fresh"`
	OutputText    string `json:"output_text,omitempty"`
	OutputJSON    string `json:"output_json,omitempty"`
}

type CoverageRequest struct {
	ArtifactType  string
	PromptVersion string
	Provider      string
	Model         string
}

type CoverageResult struct {
	ArtifactType  string                          `json:"artifact_type"`
	PromptVersion string                          `json:"prompt_version"`
	Provider      string                          `json:"provider"`
	Model         string                          `json:"model"`
	Items         []db.DocumentProcessingCoverage `json:"items"`
	Totals        DocumentProcessingTotals        `json:"totals"`
}

type DocumentProcessingTotals struct {
	DocumentCount int `json:"document_count"`
	ArtifactCount int `json:"artifact_count"`
	FreshCount    int `json:"fresh_count"`
	FailedCount   int `json:"failed_count"`
	MissingCount  int `json:"missing_count"`
}

func (s *Service) Process(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
	if req.DocumentID == "" {
		return nil, fmt.Errorf("document id is required")
	}
	if req.ArtifactType == "" {
		req.ArtifactType = "clean_text"
	}
	if req.PromptVersion == "" {
		req.PromptVersion = "v1"
	}
	if req.Provider == nil {
		return nil, fmt.Errorf("document processing provider is required")
	}
	identity := req.Provider.Identity()
	if identity.Provider == "" || identity.Model == "" {
		return nil, fmt.Errorf("document processing provider returned invalid identity: %#v", identity)
	}

	doc, err := s.queries.GetDocument(req.DocumentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, fmt.Errorf("document %s not found", req.DocumentID)
	}
	content, err := s.queries.GetDocumentContent(req.DocumentID)
	if err != nil {
		return nil, err
	}
	inputHash := TextHash(content)
	if !req.Force {
		fresh, err := s.queries.IsDocumentProcessingArtifactFresh(req.DocumentID, req.ArtifactType, req.PromptVersion, identity.Provider, identity.Model, inputHash)
		if err != nil {
			return nil, err
		}
		if fresh {
			artifact, _, err := s.queries.GetDocumentProcessingArtifact(req.DocumentID, req.ArtifactType, req.PromptVersion, identity.Provider, identity.Model)
			if err != nil {
				return nil, err
			}
			return &ProcessResult{
				DocumentID:    req.DocumentID,
				ArtifactType:  req.ArtifactType,
				PromptVersion: req.PromptVersion,
				Provider:      identity.Provider,
				Model:         identity.Model,
				InputHash:     inputHash,
				Status:        "succeeded",
				SkippedFresh:  true,
				OutputText:    artifact.OutputText,
				OutputJSON:    artifact.OutputJSON,
			}, nil
		}
	}

	processed, err := req.Provider.ProcessDocument(ctx, ProviderRequest{
		DocumentID:    req.DocumentID,
		Title:         doc.Title,
		Content:       content,
		ArtifactType:  req.ArtifactType,
		PromptVersion: req.PromptVersion,
	})
	if err != nil {
		_ = s.queries.UpsertDocumentProcessingArtifact(db.DocumentProcessingArtifact{
			DocumentID:    req.DocumentID,
			ArtifactType:  req.ArtifactType,
			PromptVersion: req.PromptVersion,
			Provider:      identity.Provider,
			Model:         identity.Model,
			InputHash:     inputHash,
			Status:        "failed",
			ErrorCode:     "provider_error",
			ErrorMessage:  err.Error(),
		})
		return nil, err
	}
	outputJSON := "{}"
	if processed.OutputJSON != nil {
		b, err := json.Marshal(processed.OutputJSON)
		if err != nil {
			return nil, fmt.Errorf("marshal provider output json: %w", err)
		}
		outputJSON = string(b)
	}
	if err := s.queries.UpsertDocumentProcessingArtifact(db.DocumentProcessingArtifact{
		DocumentID:    req.DocumentID,
		ArtifactType:  req.ArtifactType,
		PromptVersion: req.PromptVersion,
		Provider:      identity.Provider,
		Model:         identity.Model,
		InputHash:     inputHash,
		OutputText:    processed.OutputText,
		OutputJSON:    outputJSON,
		Status:        "succeeded",
	}); err != nil {
		return nil, err
	}
	return &ProcessResult{
		DocumentID:    req.DocumentID,
		ArtifactType:  req.ArtifactType,
		PromptVersion: req.PromptVersion,
		Provider:      identity.Provider,
		Model:         identity.Model,
		InputHash:     inputHash,
		Status:        "succeeded",
		OutputText:    processed.OutputText,
		OutputJSON:    outputJSON,
	}, nil
}

func (s *Service) Coverage(ctx context.Context, req CoverageRequest) (*CoverageResult, error) {
	if req.ArtifactType == "" || req.PromptVersion == "" || req.Provider == "" || req.Model == "" {
		return nil, fmt.Errorf("artifact type, prompt version, provider, and model are required")
	}
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	items, err := s.queries.ListDocumentProcessingCoverage(req.ArtifactType, req.PromptVersion, req.Provider, req.Model)
	if err != nil {
		return nil, err
	}
	result := &CoverageResult{ArtifactType: req.ArtifactType, PromptVersion: req.PromptVersion, Provider: req.Provider, Model: req.Model, Items: items}
	for _, item := range items {
		result.Totals.DocumentCount += item.DocumentCount
		result.Totals.ArtifactCount += item.ArtifactCount
		result.Totals.FreshCount += item.FreshCount
		result.Totals.FailedCount += item.FailedCount
		result.Totals.MissingCount += item.MissingCount
	}
	return result, nil
}

func TextHash(text string) string {
	sum := sha256.Sum256([]byte(text))
	return hex.EncodeToString(sum[:])
}

type FakeProvider struct {
	ProviderName string
	ModelName    string
}

func (p FakeProvider) Identity() ProviderIdentity {
	provider := p.ProviderName
	if provider == "" {
		provider = "fake"
	}
	model := p.ModelName
	if model == "" {
		model = "fake-document-processor"
	}
	return ProviderIdentity{Provider: provider, Model: model}
}

func (p FakeProvider) ProcessDocument(ctx context.Context, req ProviderRequest) (*ProviderResult, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	trimmed := strings.Join(strings.Fields(req.Content), " ")
	if len(trimmed) > 240 {
		trimmed = trimmed[:240]
	}
	return &ProviderResult{
		OutputText: fmt.Sprintf("[%s/%s] %s", req.ArtifactType, req.PromptVersion, trimmed),
		OutputJSON: map[string]any{
			"document_id":    req.DocumentID,
			"title":          req.Title,
			"artifact_type":  req.ArtifactType,
			"prompt_version": req.PromptVersion,
			"word_count":     len(strings.Fields(req.Content)),
		},
	}, nil
}

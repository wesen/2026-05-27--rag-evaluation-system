package chunkenrichment

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
	EnrichChunk(ctx context.Context, req ProviderRequest) (*ProviderResult, error)
	Identity() ProviderIdentity
}

type ProviderIdentity struct {
	Provider string `json:"provider"`
	Model    string `json:"model"`
}

type ProviderRequest struct {
	ChunkID       string `json:"chunk_id"`
	DocumentID    string `json:"document_id"`
	StrategyID    string `json:"strategy_id"`
	ChunkIndex    int    `json:"chunk_index"`
	Text          string `json:"text"`
	PromptVersion string `json:"prompt_version"`
}

type ProviderResult struct {
	ShortSummary          string   `json:"short_summary"`
	LongSummary           string   `json:"long_summary"`
	KeyTopics             []string `json:"key_topics"`
	Entities              []string `json:"entities"`
	HypotheticalQuestions []string `json:"hypothetical_questions"`
	QualityScore          float64  `json:"quality_score"`
}

type Service struct{ queries *db.Queries }

func NewService(queries *db.Queries) *Service { return &Service{queries: queries} }

type EnrichRequest struct {
	ChunkID       string
	StrategyID    string
	PromptVersion string
	Provider      Provider
	Force         bool
}

type EnrichResult struct {
	ChunkID       string  `json:"chunk_id"`
	DocumentID    string  `json:"document_id"`
	StrategyID    string  `json:"strategy_id"`
	PromptVersion string  `json:"prompt_version"`
	Provider      string  `json:"provider"`
	Model         string  `json:"model"`
	TextHash      string  `json:"text_hash"`
	SkippedFresh  bool    `json:"skipped_fresh"`
	ShortSummary  string  `json:"short_summary,omitempty"`
	QualityScore  float64 `json:"quality_score,omitempty"`
}

type CoverageRequest struct {
	StrategyID    string
	PromptVersion string
}

type CoverageResult struct {
	StrategyID    string                       `json:"strategy_id"`
	PromptVersion string                       `json:"prompt_version"`
	Items         []db.ChunkEnrichmentCoverage `json:"items"`
	Totals        ChunkEnrichmentTotals        `json:"totals"`
}

type ChunkEnrichmentTotals struct {
	ChunkCount    int `json:"chunk_count"`
	EnrichedCount int `json:"enriched_count"`
	FreshCount    int `json:"fresh_count"`
	MissingCount  int `json:"missing_count"`
}

func (s *Service) Enrich(ctx context.Context, req EnrichRequest) (*EnrichResult, error) {
	if req.ChunkID == "" {
		return nil, fmt.Errorf("chunk id is required")
	}
	if req.StrategyID == "" {
		return nil, fmt.Errorf("strategy id is required")
	}
	if req.PromptVersion == "" {
		req.PromptVersion = "v1"
	}
	if req.Provider == nil {
		return nil, fmt.Errorf("chunk enrichment provider is required")
	}
	identity := req.Provider.Identity()
	if identity.Provider == "" || identity.Model == "" {
		return nil, fmt.Errorf("chunk enrichment provider returned invalid identity: %#v", identity)
	}
	chunk, ok, err := s.queries.GetChunk(req.ChunkID, req.StrategyID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, fmt.Errorf("chunk %s for strategy %s not found", req.ChunkID, req.StrategyID)
	}
	textHash := TextHash(chunk.Text)
	if !req.Force {
		fresh, err := s.queries.IsChunkEnrichmentFresh(req.ChunkID, req.StrategyID, req.PromptVersion, textHash)
		if err != nil {
			return nil, err
		}
		if fresh {
			enrichment, _, err := s.queries.GetChunkEnrichment(req.ChunkID, req.StrategyID, req.PromptVersion)
			if err != nil {
				return nil, err
			}
			return &EnrichResult{ChunkID: req.ChunkID, DocumentID: chunk.DocumentID, StrategyID: req.StrategyID, PromptVersion: req.PromptVersion, Provider: enrichment.Provider, Model: enrichment.Model, TextHash: textHash, SkippedFresh: true, ShortSummary: enrichment.ShortSummary, QualityScore: enrichment.QualityScore}, nil
		}
	}
	providerResult, err := req.Provider.EnrichChunk(ctx, ProviderRequest{ChunkID: chunk.ID, DocumentID: chunk.DocumentID, StrategyID: chunk.StrategyID, ChunkIndex: chunk.ChunkIndex, Text: chunk.Text, PromptVersion: req.PromptVersion})
	if err != nil {
		return nil, err
	}
	if err := validateProviderResult(providerResult); err != nil {
		return nil, err
	}
	keyTopics, _ := json.Marshal(providerResult.KeyTopics)
	entities, _ := json.Marshal(providerResult.Entities)
	questions, _ := json.Marshal(providerResult.HypotheticalQuestions)
	if err := s.queries.UpsertChunkEnrichment(db.ChunkEnrichment{ChunkID: chunk.ID, DocumentID: chunk.DocumentID, StrategyID: chunk.StrategyID, PromptVersion: req.PromptVersion, Provider: identity.Provider, Model: identity.Model, ShortSummary: providerResult.ShortSummary, LongSummary: providerResult.LongSummary, KeyTopicsJSON: string(keyTopics), EntitiesJSON: string(entities), HypotheticalQuestionsJSON: string(questions), QualityScore: providerResult.QualityScore, TextHash: textHash}); err != nil {
		return nil, err
	}
	return &EnrichResult{ChunkID: chunk.ID, DocumentID: chunk.DocumentID, StrategyID: chunk.StrategyID, PromptVersion: req.PromptVersion, Provider: identity.Provider, Model: identity.Model, TextHash: textHash, ShortSummary: providerResult.ShortSummary, QualityScore: providerResult.QualityScore}, nil
}

func (s *Service) Coverage(ctx context.Context, req CoverageRequest) (*CoverageResult, error) {
	if req.StrategyID == "" || req.PromptVersion == "" {
		return nil, fmt.Errorf("strategy id and prompt version are required")
	}
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	items, err := s.queries.ListChunkEnrichmentCoverage(req.StrategyID, req.PromptVersion)
	if err != nil {
		return nil, err
	}
	result := &CoverageResult{StrategyID: req.StrategyID, PromptVersion: req.PromptVersion, Items: items}
	for _, item := range items {
		result.Totals.ChunkCount += item.ChunkCount
		result.Totals.EnrichedCount += item.EnrichedCount
		result.Totals.FreshCount += item.FreshCount
		result.Totals.MissingCount += item.MissingCount
	}
	return result, nil
}

func validateProviderResult(result *ProviderResult) error {
	if result == nil {
		return fmt.Errorf("provider returned nil result")
	}
	if strings.TrimSpace(result.ShortSummary) == "" {
		return fmt.Errorf("provider returned empty short summary")
	}
	if strings.TrimSpace(result.LongSummary) == "" {
		return fmt.Errorf("provider returned empty long summary")
	}
	if result.KeyTopics == nil {
		return fmt.Errorf("provider returned nil key topics")
	}
	if result.Entities == nil {
		return fmt.Errorf("provider returned nil entities")
	}
	if result.HypotheticalQuestions == nil {
		return fmt.Errorf("provider returned nil hypothetical questions")
	}
	if result.QualityScore < 0 || result.QualityScore > 1 {
		return fmt.Errorf("provider returned quality score outside [0,1]: %f", result.QualityScore)
	}
	return nil
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
		model = "fake-chunk-enricher"
	}
	return ProviderIdentity{Provider: provider, Model: model}
}

func (p FakeProvider) EnrichChunk(ctx context.Context, req ProviderRequest) (*ProviderResult, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	words := strings.Fields(req.Text)
	preview := strings.Join(words, " ")
	if len(preview) > 120 {
		preview = preview[:120]
	}
	return &ProviderResult{ShortSummary: "Summary: " + preview, LongSummary: fmt.Sprintf("Chunk %s from document %s contains %d words.", req.ChunkID, req.DocumentID, len(words)), KeyTopics: []string{"topic:fake", req.StrategyID}, Entities: []string{}, HypotheticalQuestions: []string{fmt.Sprintf("What is chunk %d about?", req.ChunkIndex)}, QualityScore: 0.9}, nil
}

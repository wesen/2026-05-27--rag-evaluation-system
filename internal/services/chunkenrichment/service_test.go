package chunkenrichment

import (
	"context"
	"testing"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
)

func TestServiceEnrichStoresAndSkipsFresh(t *testing.T) {
	ctx := context.Background()
	queries := newChunkTestQueries(t)
	seedChunk(t, queries)

	service := NewService(queries)
	first, err := service.Enrich(ctx, EnrichRequest{ChunkID: "chunk-1", StrategyID: "fixed-20-5", PromptVersion: "v1", Provider: FakeProvider{}})
	if err != nil {
		t.Fatalf("enrich chunk: %v", err)
	}
	if first.SkippedFresh || first.ShortSummary == "" || first.TextHash == "" {
		t.Fatalf("unexpected first result: %+v", first)
	}
	enrichment, ok, err := queries.GetChunkEnrichment("chunk-1", "fixed-20-5", "v1")
	if err != nil {
		t.Fatalf("get enrichment: %v", err)
	}
	if !ok || enrichment.ShortSummary != first.ShortSummary || enrichment.Provider != "fake" || enrichment.Model != "fake-chunk-enricher" {
		t.Fatalf("unexpected enrichment ok=%v enrichment=%+v", ok, enrichment)
	}

	second, err := service.Enrich(ctx, EnrichRequest{ChunkID: "chunk-1", StrategyID: "fixed-20-5", PromptVersion: "v1", Provider: FakeProvider{}})
	if err != nil {
		t.Fatalf("enrich fresh chunk: %v", err)
	}
	if !second.SkippedFresh || second.TextHash != first.TextHash {
		t.Fatalf("expected fresh skip, got %+v", second)
	}
}

func TestServiceRejectsInvalidProviderResult(t *testing.T) {
	ctx := context.Background()
	queries := newChunkTestQueries(t)
	seedChunk(t, queries)
	_, err := NewService(queries).Enrich(ctx, EnrichRequest{ChunkID: "chunk-1", StrategyID: "fixed-20-5", PromptVersion: "v1", Provider: invalidProvider{}})
	if err == nil {
		t.Fatalf("expected invalid provider error")
	}
}

func TestServiceCoverage(t *testing.T) {
	ctx := context.Background()
	queries := newChunkTestQueries(t)
	seedChunk(t, queries)
	if err := queries.DB().QueryRow(`INSERT INTO chunks (id, document_id, strategy_id, chunk_index, text, token_count) VALUES ('chunk-2', 'doc-1', 'fixed-20-5', 1, 'second chunk', 2) RETURNING id`).Scan(new(string)); err != nil {
		t.Fatalf("insert second chunk: %v", err)
	}
	if _, err := NewService(queries).Enrich(ctx, EnrichRequest{ChunkID: "chunk-1", StrategyID: "fixed-20-5", PromptVersion: "v1", Provider: FakeProvider{}}); err != nil {
		t.Fatalf("enrich chunk: %v", err)
	}
	coverage, err := NewService(queries).Coverage(ctx, CoverageRequest{StrategyID: "fixed-20-5", PromptVersion: "v1"})
	if err != nil {
		t.Fatalf("coverage: %v", err)
	}
	if coverage.Totals.ChunkCount != 2 || coverage.Totals.FreshCount != 1 || coverage.Totals.MissingCount != 1 {
		t.Fatalf("unexpected coverage: %+v", coverage.Totals)
	}
}

type invalidProvider struct{}

func (invalidProvider) Identity() ProviderIdentity {
	return ProviderIdentity{Provider: "fake", Model: "invalid"}
}
func (invalidProvider) EnrichChunk(ctx context.Context, req ProviderRequest) (*ProviderResult, error) {
	return &ProviderResult{}, nil
}

func newChunkTestQueries(t *testing.T) *db.Queries {
	t.Helper()
	database, err := db.OpenDB(t.TempDir() + "/test.db")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.Migrate(database); err != nil {
		_ = database.Close()
		t.Fatalf("migrate db: %v", err)
	}
	queries := db.NewQueries(database)
	t.Cleanup(func() { _ = queries.Close() })
	return queries
}

func seedChunk(t *testing.T, queries *db.Queries) {
	t.Helper()
	if err := queries.InsertSource("source-1", "Source", "test", "{}"); err != nil {
		t.Fatalf("insert source: %v", err)
	}
	if err := queries.InsertDocument("doc-1", "source-1", "doc-1", "Title", "", "", "text", "Raw", "Chunk enrichment content for testing.", "", 5, "en", "extracted"); err != nil {
		t.Fatalf("insert document: %v", err)
	}
	if err := queries.InsertChunkingStrategy("fixed-20-5", "fixed", "fixed", "{}", "test"); err != nil {
		t.Fatalf("insert strategy: %v", err)
	}
	if _, err := queries.DB().Exec(`INSERT INTO chunks (id, document_id, strategy_id, chunk_index, text, token_count) VALUES ('chunk-1', 'doc-1', 'fixed-20-5', 0, 'chunk enrichment content for testing', 5)`); err != nil {
		t.Fatalf("insert chunk: %v", err)
	}
}

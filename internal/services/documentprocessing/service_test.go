package documentprocessing

import (
	"context"
	"strings"
	"testing"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
)

func TestServiceProcessStoresArtifactAndSkipsFresh(t *testing.T) {
	ctx := context.Background()
	queries := newTestQueries(t)
	seedDocument(t, queries)

	service := NewService(queries)
	first, err := service.Process(ctx, ProcessRequest{
		DocumentID:    "doc-1",
		ArtifactType:  "clean_text",
		PromptVersion: "v1",
		Provider:      FakeProvider{},
	})
	if err != nil {
		t.Fatalf("process document: %v", err)
	}
	if first.SkippedFresh || first.Status != "succeeded" || first.OutputText == "" || first.InputHash == "" {
		t.Fatalf("unexpected first result: %+v", first)
	}

	artifact, ok, err := queries.GetDocumentProcessingArtifact("doc-1", "clean_text", "v1", "fake", "fake-document-processor")
	if err != nil {
		t.Fatalf("get artifact: %v", err)
	}
	if !ok || artifact.InputHash != first.InputHash || artifact.OutputText != first.OutputText {
		t.Fatalf("unexpected artifact ok=%v artifact=%+v", ok, artifact)
	}

	second, err := service.Process(ctx, ProcessRequest{
		DocumentID:    "doc-1",
		ArtifactType:  "clean_text",
		PromptVersion: "v1",
		Provider:      FakeProvider{},
	})
	if err != nil {
		t.Fatalf("process fresh document: %v", err)
	}
	if !second.SkippedFresh || second.InputHash != first.InputHash {
		t.Fatalf("expected fresh skip, got %+v", second)
	}

	content, err := queries.GetDocumentContent("doc-1")
	if err != nil {
		t.Fatalf("get document content: %v", err)
	}
	if !strings.Contains(content, "Original content") {
		t.Fatalf("document content was unexpectedly changed: %q", content)
	}
}

func TestServiceCoverage(t *testing.T) {
	ctx := context.Background()
	queries := newTestQueries(t)
	seedDocument(t, queries)
	if err := queries.InsertDocument("doc-2", "source-1", "doc-2", "Unprocessed", "", "", "text", "Other raw", "Other text", "", 2, "en", "extracted"); err != nil {
		t.Fatalf("insert second document: %v", err)
	}

	service := NewService(queries)
	if _, err := service.Process(ctx, ProcessRequest{DocumentID: "doc-1", ArtifactType: "clean_text", PromptVersion: "v1", Provider: FakeProvider{}}); err != nil {
		t.Fatalf("process document: %v", err)
	}
	coverage, err := service.Coverage(ctx, CoverageRequest{ArtifactType: "clean_text", PromptVersion: "v1", Provider: "fake", Model: "fake-document-processor"})
	if err != nil {
		t.Fatalf("coverage: %v", err)
	}
	if coverage.Totals.DocumentCount != 2 || coverage.Totals.FreshCount != 1 || coverage.Totals.MissingCount != 1 {
		t.Fatalf("unexpected coverage: %+v", coverage.Totals)
	}
}

func newTestQueries(t *testing.T) *db.Queries {
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

func seedDocument(t *testing.T, queries *db.Queries) {
	t.Helper()
	if err := queries.InsertSource("source-1", "Source", "test", "{}"); err != nil {
		t.Fatalf("insert source: %v", err)
	}
	if err := queries.InsertDocument("doc-1", "source-1", "doc-1", "Title", "", "", "text", "Original raw", "Original content for document processing tests.", "", 6, "en", "extracted"); err != nil {
		t.Fatalf("insert document: %v", err)
	}
}

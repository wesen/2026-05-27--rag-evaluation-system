package document

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
	chunkservice "github.com/go-go-golems/rag-evaluation-system/internal/services/chunking"
	sourceservice "github.com/go-go-golems/rag-evaluation-system/internal/services/source"
)

func openTestQueries(t *testing.T) *db.Queries {
	t.Helper()
	database, err := db.OpenDB(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.Migrate(database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })
	return db.NewQueries(database)
}

func seedDocuments(t *testing.T, queries *db.Queries) []db.Document {
	t.Helper()
	ctx := context.Background()
	sourceSvc := sourceservice.NewService(queries)
	if _, err := sourceSvc.Create(ctx, sourceservice.CreateRequest{ID: "docs", Name: "Docs", Type: "filesystem"}); err != nil {
		t.Fatalf("create source: %v", err)
	}
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "a.md"), []byte("# A\nhello world"), 0644); err != nil {
		t.Fatalf("write a.md: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dir, "b.md"), []byte("# B\nsecond document"), 0644); err != nil {
		t.Fatalf("write b.md: %v", err)
	}
	if _, err := sourceSvc.Scan(ctx, sourceservice.ScanRequest{SourceID: "docs", Dir: dir}); err != nil {
		t.Fatalf("scan source: %v", err)
	}
	docs, err := queries.ListDocuments(10, 0)
	if err != nil {
		t.Fatalf("list documents: %v", err)
	}
	return docs
}

func TestListDefaultsAndGetValidation(t *testing.T) {
	ctx := context.Background()
	queries := openTestQueries(t)
	seedDocuments(t, queries)
	service := NewService(queries)

	docs, err := service.List(ctx, ListRequest{})
	if err != nil {
		t.Fatalf("list docs: %v", err)
	}
	if len(docs) != 2 {
		t.Fatalf("expected 2 docs, got %d", len(docs))
	}

	got, err := service.Get(ctx, docs[0].ID)
	if err != nil {
		t.Fatalf("get doc: %v", err)
	}
	if got == nil || got.ID != docs[0].ID {
		t.Fatalf("expected doc %q, got %#v", docs[0].ID, got)
	}
	if _, err := service.Get(ctx, ""); err == nil {
		t.Fatal("expected empty document id to fail")
	}
}

func TestChunksReturnsStrategyAwareChunks(t *testing.T) {
	ctx := context.Background()
	queries := openTestQueries(t)
	docs := seedDocuments(t, queries)
	chunkSvc := chunkservice.NewService(queries)
	result, err := chunkSvc.Apply(ctx, chunkservice.ApplyRequest{DocumentID: docs[0].ID, Strategy: "fixed", ChunkSize: 20, Overlap: 5})
	if err != nil {
		t.Fatalf("apply chunks: %v", err)
	}

	service := NewService(queries)
	chunks, err := service.Chunks(ctx, ChunksRequest{DocumentID: docs[0].ID})
	if err != nil {
		t.Fatalf("list chunks: %v", err)
	}
	if len(chunks) != result.ChunkCount {
		t.Fatalf("expected %d chunks, got %d", result.ChunkCount, len(chunks))
	}
	for _, ch := range chunks {
		if ch.StrategyID != result.StrategyID {
			t.Fatalf("expected strategy %q, got chunk %#v", result.StrategyID, ch)
		}
	}
}

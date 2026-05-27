package source

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
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

func TestCreateIsIdempotentUpsert(t *testing.T) {
	ctx := context.Background()
	queries := openTestQueries(t)
	service := NewService(queries)

	_, err := service.Create(ctx, CreateRequest{ID: "docs", Name: "Docs", Type: "filesystem"})
	if err != nil {
		t.Fatalf("create source: %v", err)
	}
	result, err := service.Create(ctx, CreateRequest{ID: "docs", Name: "Docs Renamed", Type: "filesystem"})
	if err != nil {
		t.Fatalf("recreate source: %v", err)
	}
	if result.Status != "upserted" {
		t.Fatalf("expected upserted status, got %q", result.Status)
	}

	sources, err := queries.ListSources()
	if err != nil {
		t.Fatalf("list sources: %v", err)
	}
	if len(sources) != 1 {
		t.Fatalf("expected 1 source after idempotent create, got %d", len(sources))
	}
	if sources[0].Name != "Docs Renamed" {
		t.Fatalf("expected updated source name, got %q", sources[0].Name)
	}
}

func TestScanIsIdempotentByRelativePath(t *testing.T) {
	ctx := context.Background()
	queries := openTestQueries(t)
	service := NewService(queries)

	if _, err := service.Create(ctx, CreateRequest{ID: "docs", Name: "Docs", Type: "filesystem"}); err != nil {
		t.Fatalf("create source: %v", err)
	}

	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "a.md"), []byte("# A\nhello world"), 0644); err != nil {
		t.Fatalf("write a.md: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dir, "b.txt"), []byte("plain text document"), 0644); err != nil {
		t.Fatalf("write b.txt: %v", err)
	}

	first, err := service.Scan(ctx, ScanRequest{SourceID: "docs", Dir: dir})
	if err != nil {
		t.Fatalf("first scan: %v", err)
	}
	second, err := service.Scan(ctx, ScanRequest{SourceID: "docs", Dir: dir})
	if err != nil {
		t.Fatalf("second scan: %v", err)
	}
	if first.DocumentCount != 2 || second.DocumentCount != 2 {
		t.Fatalf("expected both scans to return 2 docs, got %d and %d", first.DocumentCount, second.DocumentCount)
	}

	docs, err := queries.ListDocuments(10, 0)
	if err != nil {
		t.Fatalf("list documents: %v", err)
	}
	if len(docs) != 2 {
		t.Fatalf("expected 2 stored documents after repeated scans, got %d", len(docs))
	}
	seenExternalID := map[string]bool{}
	for _, doc := range docs {
		seenExternalID[doc.ExternalID] = true
	}
	if !seenExternalID["a.md"] || !seenExternalID["b.txt"] {
		t.Fatalf("expected relative external IDs a.md and b.txt, got %#v", seenExternalID)
	}
}

package search

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
	_ "github.com/mattn/go-sqlite3"
)

func setupSearchTestDB(t *testing.T) (*sql.DB, *db.Queries) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "search-test.db")
	database, err := sql.Open("sqlite3", path+"?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { database.Close() })
	if err := db.Migrate(database); err != nil {
		t.Fatal(err)
	}
	queries := db.NewQueries(database)
	seedSearchTestData(t, queries)
	return database, queries
}

func seedSearchTestData(t *testing.T, queries *db.Queries) {
	t.Helper()
	must := func(err error) {
		if err != nil {
			t.Fatal(err)
		}
	}
	must(queries.InsertSource("src-guides", "Guides", "test", "{}"))
	must(queries.InsertSource("src-products", "Products", "test", "{}"))
	must(queries.InsertDocument("doc-arb", "src-guides", "", "How to Plant Arborvitae", "", "https://example.com/arborvitae", "text", "", "", "", 100, "en", "chunked"))
	must(queries.InsertDocument("doc-hyd", "src-guides", "", "Hydrangea Pruning Guide", "", "", "text", "", "", "", 80, "en", "chunked"))
	must(queries.InsertDocument("doc-prod", "src-products", "", "Emerald Green Arborvitae", "", "", "text", "", "", "", 50, "en", "chunked"))
	must(queries.InsertChunkingStrategy("fixed-100-20", "Fixed 100/20", "fixed", `{}`, "test"))
	must(queries.InsertChunk("chk-arb-1", "doc-arb", "fixed-100-20", 0, "Plant arborvitae in a hole twice as wide as the root ball and water deeply after planting.", 20, 0, 100, "{}"))
	must(queries.InsertChunk("chk-hyd-1", "doc-hyd", "fixed-100-20", 0, "Prune hydrangea after flowering depending on whether it blooms on old wood or new wood.", 20, 0, 100, "{}"))
	must(queries.InsertChunk("chk-prod-1", "doc-prod", "fixed-100-20", 0, "Emerald Green Arborvitae is a compact evergreen privacy screen tree.", 20, 0, 100, "{}"))
}

func TestBuildBM25AndQuery(t *testing.T) {
	_, queries := setupSearchTestDB(t)
	svc := NewService(queries, t.TempDir())

	build, err := svc.BuildBM25(context.Background(), BuildIndexRequest{
		IndexID:    "test-index",
		StrategyID: "fixed-100-20",
		SourceIDs:  []string{"src-guides"},
		Force:      true,
	})
	if err != nil {
		t.Fatalf("BuildBM25: %v", err)
	}
	if build.ChunkCount != 2 {
		t.Fatalf("expected 2 indexed guide chunks, got %d", build.ChunkCount)
	}
	if _, err := os.Stat(build.IndexPath); err != nil {
		t.Fatalf("expected index path to exist: %v", err)
	}

	result, err := svc.QueryBM25(context.Background(), QueryRequest{
		IndexID: "test-index",
		Query:   "plant arborvitae",
		Limit:   5,
	})
	if err != nil {
		t.Fatalf("QueryBM25: %v", err)
	}
	if len(result.Items) == 0 {
		t.Fatal("expected search results")
	}
	if result.Items[0].ChunkID != "chk-arb-1" {
		t.Fatalf("expected arborvitae chunk first, got %#v", result.Items[0])
	}
	if result.Items[0].SourceID != "src-guides" {
		t.Fatalf("expected source metadata, got %#v", result.Items[0])
	}
	if result.Items[0].Preview == "" {
		t.Fatal("expected preview text")
	}
}

func TestBuildBM25RejectsExistingWithoutForce(t *testing.T) {
	_, queries := setupSearchTestDB(t)
	svc := NewService(queries, t.TempDir())
	req := BuildIndexRequest{IndexID: "test-index", StrategyID: "fixed-100-20", Force: true}
	if _, err := svc.BuildBM25(context.Background(), req); err != nil {
		t.Fatalf("initial BuildBM25: %v", err)
	}
	req.Force = false
	if _, err := svc.BuildBM25(context.Background(), req); err == nil {
		t.Fatal("expected existing index error without force")
	}
}

func TestBuildBM25SourceFilter(t *testing.T) {
	_, queries := setupSearchTestDB(t)
	svc := NewService(queries, t.TempDir())
	build, err := svc.BuildBM25(context.Background(), BuildIndexRequest{
		IndexID:    "products-index",
		StrategyID: "fixed-100-20",
		SourceIDs:  []string{"src-products"},
		Force:      true,
	})
	if err != nil {
		t.Fatalf("BuildBM25: %v", err)
	}
	if build.ChunkCount != 1 {
		t.Fatalf("expected 1 product chunk, got %d", build.ChunkCount)
	}
	result, err := svc.QueryBM25(context.Background(), QueryRequest{IndexID: "products-index", Query: "hydrangea", Limit: 5})
	if err != nil {
		t.Fatalf("QueryBM25: %v", err)
	}
	if len(result.Items) != 0 {
		t.Fatalf("expected no hydrangea results in products-only index, got %#v", result.Items)
	}
}

func TestQueryBM25MissingIndexReturnsError(t *testing.T) {
	_, queries := setupSearchTestDB(t)
	svc := NewService(queries, t.TempDir())
	_, err := svc.QueryBM25(context.Background(), QueryRequest{IndexID: "missing", Query: "plant"})
	if err == nil {
		t.Fatal("expected missing index error")
	}
}

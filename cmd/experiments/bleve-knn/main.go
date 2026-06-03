//go:build vectors

package main

import (
	"context"
	"encoding/binary"
	"fmt"
	"math"
	"math/rand"
	"os"
	"path/filepath"

	"github.com/blevesearch/bleve/v2"
	index "github.com/blevesearch/bleve_index_api"
)

// EncodeFloat32Vector encodes a []float32 to a byte slice (little-endian).
func EncodeFloat32Vector(vector []float32) []byte {
	buf := make([]byte, len(vector)*4)
	for i, v := range vector {
		binary.LittleEndian.PutUint32(buf[i*4:(i+1)*4], math.Float32bits(v))
	}
	return buf
}

// indexedChunk is the document type we store in the bleve index.
type indexedChunk struct {
	ChunkID    string    `json:"chunk_id"`
	DocumentID string    `json:"document_id"`
	Text       string    `json:"text"`
	Embedding  []float32 `json:"embedding"`
}

func main() {
	ctx := context.Background()

	// ── Configuration ────────────────────────────────────────────
	dims := 64     // small dims for fast experiment (use 1536 for real work)
	numDocs := 100 // number of test documents
	k := 5         // top-k neighbors to find
	indexPath := filepath.Join(os.TempDir(), "bleve-knn-experiment")

	// Clean up any previous run
	_ = os.RemoveAll(indexPath)

	// ── Step 1: Create mapping with vector field ─────────────────
	fmt.Println("=== Step 1: Create index with vector field ===")

	embeddingFieldMapping := bleve.NewVectorFieldMapping()
	embeddingFieldMapping.Dims = dims
	embeddingFieldMapping.Similarity = index.CosineSimilarity
	embeddingFieldMapping.VectorIndexOptimizedFor = index.IndexOptimizedForRecall

	textFieldMapping := bleve.NewTextFieldMapping()
	keywordFieldMapping := bleve.NewKeywordFieldMapping()

	chunkMapping := bleve.NewDocumentMapping()
	chunkMapping.AddFieldMappingsAt("text", textFieldMapping)
	chunkMapping.AddFieldMappingsAt("chunk_id", keywordFieldMapping)
	chunkMapping.AddFieldMappingsAt("document_id", keywordFieldMapping)
	chunkMapping.AddFieldMappingsAt("embedding", embeddingFieldMapping)

	idxMapping := bleve.NewIndexMapping()
	idxMapping.DefaultMapping = chunkMapping

	idx, err := bleve.New(indexPath, idxMapping)
	if err != nil {
		panic(fmt.Errorf("create index: %w", err))
	}
	fmt.Printf("Created bleve index at %s (dims=%d, similarity=cosine, optimizedFor=recall)\n", indexPath, dims)

	// ── Step 2: Index documents with random embeddings ───────────
	fmt.Println("\n=== Step 2: Index documents ===")

	batch := idx.NewBatch()
	vectorsByChunkID := map[string][]float32{}
	for i := 0; i < numDocs; i++ {
		// Generate a random unit vector (cosine similarity will be meaningful)
		vec := make([]float32, dims)
		var norm float64
		for j := range vec {
			v := rand.NormFloat64()
			vec[j] = float32(v)
			norm += v * v
		}
		norm = math.Sqrt(norm)
		for j := range vec {
			vec[j] /= float32(norm)
		}

		doc := indexedChunk{
			ChunkID:    fmt.Sprintf("chunk-%03d", i),
			DocumentID: fmt.Sprintf("doc-%03d", i/10),
			Text:       fmt.Sprintf("This is chunk number %d about topic %d.", i, i%5),
			Embedding:  vec,
		}
		vectorsByChunkID[doc.ChunkID] = vec
		if err := batch.Index(doc.ChunkID, doc); err != nil {
			panic(fmt.Errorf("batch index doc %d: %w", i, err))
		}
	}
	if err := idx.Batch(batch); err != nil {
		panic(fmt.Errorf("execute batch: %w", err))
	}

	docCount, err := idx.DocCount()
	if err != nil {
		panic(err)
	}
	fmt.Printf("Indexed %d documents (DocCount reports %d)\n", numDocs, docCount)

	// ── Step 3: KNN search ────────────────────────────────────────
	fmt.Println("\n=== Step 3: Pure KNN search (no text query) ===")

	// Use chunk-042's original embedding as the query vector (should find itself + neighbors).
	// We keep the vector in memory because bleve's Document API exposes fields through
	// visitors and the indexed vector is not meant to be treated as application storage.
	queryDocID := "chunk-042"
	queryVector, ok := vectorsByChunkID[queryDocID]
	if !ok {
		panic(fmt.Sprintf("document %s not found in original vector map", queryDocID))
	}
	fmt.Printf("Using embedding from %s as query vector\n", queryDocID)

	// Build a pure KNN search request
	searchRequest := bleve.NewSearchRequest(bleve.NewMatchNoneQuery())
	searchRequest.AddKNN("embedding", queryVector, int64(k), 1.0)
	searchRequest.Fields = []string{"chunk_id", "document_id", "text"}

	searchResult, err := idx.SearchInContext(ctx, searchRequest)
	if err != nil {
		panic(fmt.Errorf("KNN search: %w", err))
	}

	fmt.Printf("KNN search returned %d hits (total=%d, maxScore=%.4f, took=%v)\n",
		len(searchResult.Hits), searchResult.Total, searchResult.MaxScore, searchResult.Took)
	for i, hit := range searchResult.Hits {
		chunkID, _ := hit.Fields["chunk_id"].(string)
		text, _ := hit.Fields["text"].(string)
		fmt.Printf("  %d. id=%s score=%.6f chunk_id=%s text=%q\n",
			i+1, hit.ID, hit.Score, chunkID, text)
	}

	// ── Step 4: Hybrid search (BM25 + KNN with RRF fusion) ──────
	fmt.Println("\n=== Step 4: Hybrid search (BM25 + KNN with RRF fusion) ===")

	// Use a text query that partially overlaps with chunk content
	textQuery := "topic 2"
	fmt.Printf("Text query: %q\n", textQuery)

	searchRequest2 := bleve.NewSearchRequest(bleve.NewMatchQuery(textQuery))
	searchRequest2.AddKNN("embedding", queryVector, int64(k*2), 1.0)
	searchRequest2.Score = "rrf" // Enable RRF score fusion
	searchRequest2.Fields = []string{"chunk_id", "document_id", "text"}
	searchRequest2.Size = k

	searchResult2, err := idx.SearchInContext(ctx, searchRequest2)
	if err != nil {
		panic(fmt.Errorf("hybrid search: %w", err))
	}

	fmt.Printf("Hybrid search returned %d hits (total=%d, maxScore=%.4f, took=%v)\n",
		len(searchResult2.Hits), searchResult2.Total, searchResult2.MaxScore, searchResult2.Took)
	for i, hit := range searchResult2.Hits {
		chunkID, _ := hit.Fields["chunk_id"].(string)
		text, _ := hit.Fields["text"].(string)
		fmt.Printf("  %d. id=%s score=%.6f chunk_id=%s text=%q scoreBreakdown=%v\n",
			i+1, hit.ID, hit.Score, chunkID, text, hit.ScoreBreakdown)
	}

	// ── Step 5: BM25-only search for comparison ──────────────────
	fmt.Println("\n=== Step 5: BM25-only search (for comparison) ===")

	searchRequest3 := bleve.NewSearchRequest(bleve.NewMatchQuery(textQuery))
	searchRequest3.Fields = []string{"chunk_id", "document_id", "text"}
	searchRequest3.Size = k

	searchResult3, err := idx.SearchInContext(ctx, searchRequest3)
	if err != nil {
		panic(fmt.Errorf("BM25 search: %w", err))
	}

	fmt.Printf("BM25 search returned %d hits (total=%d, maxScore=%.4f, took=%v)\n",
		len(searchResult3.Hits), searchResult3.Total, searchResult3.MaxScore, searchResult3.Took)
	for i, hit := range searchResult3.Hits {
		chunkID, _ := hit.Fields["chunk_id"].(string)
		text, _ := hit.Fields["text"].(string)
		fmt.Printf("  %d. id=%s score=%.6f chunk_id=%s text=%q\n",
			i+1, hit.ID, hit.Score, chunkID, text)
	}

	// ── Cleanup ──────────────────────────────────────────────────
	if err := idx.Close(); err != nil {
		panic(fmt.Errorf("close index: %w", err))
	}
	_ = os.RemoveAll(indexPath)

	fmt.Println("\n=== Experiment complete ===")
	fmt.Println("Summary: bleve KNN vector search works with the 'vectors' build tag.")
	fmt.Println("Next step: wire this into goja-bleve module for JS RAG pipelines.")
}

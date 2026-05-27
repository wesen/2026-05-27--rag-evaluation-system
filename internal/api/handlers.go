package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-go-golems/rag-evaluation-system/internal/db"
	"github.com/go-go-golems/rag-evaluation-system/internal/ingest"
)

// RegisterHandlers wires all API routes into the given mux
func RegisterHandlers(mux *http.ServeMux, database *sql.DB) {
	queries := db.NewQueries(database)
	h := &handler{queries: queries}

	// Health check
	mux.HandleFunc("GET /api/v1/health", h.handleHealth)

	// Sources
	mux.HandleFunc("GET /api/v1/sources", h.handleListSources)
	mux.HandleFunc("POST /api/v1/sources", h.handleCreateSource)

	// Documents
	mux.HandleFunc("GET /api/v1/documents", h.handleListDocuments)
	mux.HandleFunc("GET /api/v1/documents/{id}", h.handleGetDocument)
	mux.HandleFunc("GET /api/v1/documents/{id}/chunks", h.handleListChunks)

	// Source scan (ingest files from a directory)
	mux.HandleFunc("POST /api/v1/sources/{id}/scan", h.handleScanSource)
}

type handler struct {
	queries *db.Queries
}

func (h *handler) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"service": "rag-evaluation-system",
	})
}

// --- Sources ---

func (h *handler) handleListSources(w http.ResponseWriter, r *http.Request) {
	sources, err := h.queries.ListSources()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items": sources,
	})
}

func (h *handler) handleCreateSource(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID     string                 `json:"id"`
		Name   string                 `json:"name"`
		Type   string                 `json:"type"`
		Config map[string]interface{} `json:"config"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}

	if req.ID == "" || req.Name == "" || req.Type == "" {
		writeError(w, http.StatusBadRequest, "missing_fields", "id, name, and type are required")
		return
	}

	configJSON, _ := json.Marshal(req.Config)

	if err := h.queries.InsertSource(req.ID, req.Name, req.Type, string(configJSON)); err != nil {
		writeError(w, http.StatusInternalServerError, "insert_failed", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"id":   req.ID,
		"name": req.Name,
	})
}

func (h *handler) handleScanSource(w http.ResponseWriter, r *http.Request) {
	sourceID := r.PathValue("id")

	var req struct {
		Dir string `json:"dir"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return
	}
	if req.Dir == "" {
		writeError(w, http.StatusBadRequest, "missing_dir", "dir is required")
		return
	}

	scanner := ingest.NewScanner(h.queries)
	docIDs, err := scanner.ScanDir(sourceID, req.Dir)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "scan_failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"source_id":     sourceID,
		"documents":     docIDs,
		"document_count": len(docIDs),
	})
}

// --- Documents ---

func (h *handler) handleListDocuments(w http.ResponseWriter, r *http.Request) {
	docs, err := h.queries.ListDocuments(50, 0)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items": docs,
		"page":  map[string]interface{}{"limit": 50, "offset": 0},
	})
}

func (h *handler) handleGetDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	doc, err := h.queries.GetDocument(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}
	if doc == nil {
		writeError(w, http.StatusNotFound, "not_found", "document not found")
		return
	}

	result := map[string]interface{}{
		"id":           doc.ID,
		"source_id":    doc.SourceID,
		"external_id":  doc.ExternalID,
		"title":        doc.Title,
		"author":       doc.Author,
		"url":          doc.URL,
		"content_type": doc.ContentType,
		"word_count":   doc.WordCount,
		"language":     doc.Language,
		"status":       doc.Status,
		"created_at":   doc.CreatedAt,
		"updated_at":   doc.UpdatedAt,
	}

	writeJSON(w, http.StatusOK, result)
}

// --- Chunks ---

func (h *handler) handleListChunks(w http.ResponseWriter, r *http.Request) {
	docID := r.PathValue("id")

	chunks, err := h.queries.ListChunks(docID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items":        chunks,
		"document_id":  docID,
		"chunk_count":  len(chunks),
	})
}

// --- Helpers ---

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":  code,
		"message": message,
	})
}

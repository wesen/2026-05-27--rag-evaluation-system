package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

// RegisterHandlers wires all API routes into the given mux
func RegisterHandlers(mux *http.ServeMux, db *sql.DB) {
	h := &handler{db: db}

	// Health check
	mux.HandleFunc("GET /api/v1/health", h.handleHealth)

	// Sources
	mux.HandleFunc("GET /api/v1/sources", h.handleListSources)
	mux.HandleFunc("POST /api/v1/sources", h.handleCreateSource)

	// Documents
	mux.HandleFunc("GET /api/v1/documents", h.handleListDocuments)
	mux.HandleFunc("GET /api/v1/documents/{id}", h.handleGetDocument)
	mux.HandleFunc("GET /api/v1/documents/{id}/chunks", h.handleListChunks)
}

type handler struct {
	db *sql.DB
}

func (h *handler) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"service": "rag-evaluation-system",
	})
}

// --- Sources ---

type Source struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	ConfigJSON string `json:"config_json,omitempty"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func (h *handler) handleListSources(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(), `
		SELECT id, name, type, config_json, created_at, updated_at
		FROM sources ORDER BY created_at DESC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}
	defer rows.Close()

	sources := []Source{}
	for rows.Next() {
		var s Source
		if err := rows.Scan(&s.ID, &s.Name, &s.Type, &s.ConfigJSON, &s.CreatedAt, &s.UpdatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "scan_failed", err.Error())
			return
		}
		sources = append(sources, s)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items": sources,
	})
}

func (h *handler) handleCreateSource(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID        string                 `json:"id"`
		Name      string                 `json:"name"`
		Type      string                 `json:"type"`
		Config    map[string]interface{} `json:"config"`
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

	_, err := h.db.ExecContext(r.Context(), `
		INSERT INTO sources (id, name, type, config_json)
		VALUES (?, ?, ?, ?)
	`, req.ID, req.Name, req.Type, string(configJSON))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "insert_failed", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"id":   req.ID,
		"name": req.Name,
	})
}

// --- Documents ---

type Document struct {
	ID           string `json:"id"`
	SourceID     string `json:"source_id"`
	ExternalID   string `json:"external_id,omitempty"`
	Title        string `json:"title"`
	Author       string `json:"author"`
	URL          string `json:"url,omitempty"`
	ContentType  string `json:"content_type"`
	WordCount    int    `json:"word_count"`
	Language     string `json:"language"`
	Status       string `json:"status"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

func (h *handler) handleListDocuments(w http.ResponseWriter, r *http.Request) {
	limit := 50
	offset := 0

	rows, err := h.db.QueryContext(r.Context(), `
		SELECT id, source_id, COALESCE(external_id, ''), title, COALESCE(author, ''),
		       COALESCE(url, ''), content_type, word_count, language, status,
		       created_at, updated_at
		FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}
	defer rows.Close()

	docs := []Document{}
	for rows.Next() {
		var d Document
		if err := rows.Scan(&d.ID, &d.SourceID, &d.ExternalID, &d.Title, &d.Author,
			&d.URL, &d.ContentType, &d.WordCount, &d.Language, &d.Status,
			&d.CreatedAt, &d.UpdatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "scan_failed", err.Error())
			return
		}
		docs = append(docs, d)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items": docs,
		"page":  map[string]interface{}{"limit": limit, "offset": offset},
	})
}

func (h *handler) handleGetDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var d Document
	var rawContent, contentText, contentHTML, metadataJSON sql.NullString

	err := h.db.QueryRowContext(r.Context(), `
		SELECT id, source_id, COALESCE(external_id, ''), title, COALESCE(author, ''),
		       COALESCE(url, ''), content_type, word_count, language, status,
		       created_at, updated_at,
		       raw_content, content_text, content_html, metadata_json
		FROM documents WHERE id = ?
	`, id).Scan(&d.ID, &d.SourceID, &d.ExternalID, &d.Title, &d.Author,
		&d.URL, &d.ContentType, &d.WordCount, &d.Language, &d.Status,
		&d.CreatedAt, &d.UpdatedAt,
		&rawContent, &contentText, &contentHTML, &metadataJSON)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not_found", "document not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}

	result := map[string]interface{}{
		"id":           d.ID,
		"source_id":    d.SourceID,
		"external_id":  d.ExternalID,
		"title":        d.Title,
		"author":       d.Author,
		"url":          d.URL,
		"content_type": d.ContentType,
		"word_count":   d.WordCount,
		"language":     d.Language,
		"status":       d.Status,
		"created_at":   d.CreatedAt,
		"updated_at":   d.UpdatedAt,
		"has_content":  contentText.Valid && contentText.String != "",
	}

	writeJSON(w, http.StatusOK, result)
}

// --- Chunks ---

type Chunk struct {
	ID           string `json:"id"`
	DocumentID   string `json:"document_id"`
	ChunkIndex   int    `json:"chunk_index"`
	Text         string `json:"text"`
	TokenCount   int    `json:"token_count"`
	StartOffset  int    `json:"start_offset"`
	EndOffset    int    `json:"end_offset"`
	CreatedAt    string `json:"created_at"`
}

func (h *handler) handleListChunks(w http.ResponseWriter, r *http.Request) {
	docID := r.PathValue("id")

	rows, err := h.db.QueryContext(r.Context(), `
		SELECT id, document_id, chunk_index, text, token_count,
		       COALESCE(start_offset, 0), COALESCE(end_offset, 0), created_at
		FROM chunks WHERE document_id = ? ORDER BY chunk_index
	`, docID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}
	defer rows.Close()

	chunks := []Chunk{}
	for rows.Next() {
		var c Chunk
		if err := rows.Scan(&c.ID, &c.DocumentID, &c.ChunkIndex, &c.Text,
			&c.TokenCount, &c.StartOffset, &c.EndOffset, &c.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "scan_failed", err.Error())
			return
		}
		chunks = append(chunks, c)
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

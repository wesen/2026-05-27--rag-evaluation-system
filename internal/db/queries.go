package db

import (
	"database/sql"
	"fmt"
)

// Queries provides typed database operations
type Queries struct {
	db *sql.DB
}

// NewQueries creates a new Queries instance
func NewQueries(db *sql.DB) *Queries {
	return &Queries{db: db}
}

// DB returns the underlying sql.DB for direct queries
func (q *Queries) DB() *sql.DB {
	return q.db
}

// Close closes the underlying database connection
func (q *Queries) Close() error {
	return q.db.Close()
}

// InsertDocument inserts a new document
func (q *Queries) InsertDocument(
	id, sourceID, externalID, title, author, url,
	contentType, rawContent, contentText, contentHTML string,
	wordCount int, language, status string,
) error {
	_, err := q.db.Exec(`
		INSERT INTO documents (id, source_id, external_id, title, author, url,
		    content_type, raw_content, content_text, content_html,
		    word_count, language, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
		    source_id = excluded.source_id,
		    external_id = excluded.external_id,
		    title = excluded.title,
		    author = excluded.author,
		    url = excluded.url,
		    content_type = excluded.content_type,
		    raw_content = excluded.raw_content,
		    content_text = excluded.content_text,
		    content_html = excluded.content_html,
		    word_count = excluded.word_count,
		    language = excluded.language,
		    status = excluded.status,
		    updated_at = datetime('now')
	`, id, sourceID, externalID, title, author, url,
		contentType, rawContent, contentText, contentHTML,
		wordCount, language, status)
	if err != nil {
		return fmt.Errorf("insert document: %w", err)
	}
	return nil
}

// InsertChunk inserts a new chunk for a document/strategy pair.
func (q *Queries) InsertChunk(
	id, documentID, strategyID string, chunkIndex int, text string,
	tokenCount, startOffset, endOffset int, boundariesJSON string,
) error {
	_, err := q.db.Exec(`
		INSERT INTO chunks (id, document_id, strategy_id, chunk_index, text, token_count,
		    start_offset, end_offset, boundaries_json)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, id, documentID, strategyID, chunkIndex, text, tokenCount,
		startOffset, endOffset, boundariesJSON)
	if err != nil {
		return fmt.Errorf("insert chunk: %w", err)
	}
	return nil
}

// DeleteChunksForDocumentStrategy deletes derived chunks for a strategy so chunking is rerun-safe.
func (q *Queries) DeleteChunksForDocumentStrategy(documentID, strategyID string) error {
	_, err := q.db.Exec(`
		DELETE FROM chunks WHERE document_id = ? AND strategy_id = ?
	`, documentID, strategyID)
	if err != nil {
		return fmt.Errorf("delete chunks for document strategy: %w", err)
	}
	return nil
}

// UpdateDocumentStatus updates a document's status
func (q *Queries) UpdateDocumentStatus(id, status string) error {
	_, err := q.db.Exec(`
		UPDATE documents SET status = ?, updated_at = datetime('now') WHERE id = ?
	`, status, id)
	if err != nil {
		return fmt.Errorf("update document status: %w", err)
	}
	return nil
}

// InsertChunkingStrategy inserts or updates a chunking strategy.
func (q *Queries) InsertChunkingStrategy(id, name, strategyType, configJSON, description string) error {
	_, err := q.db.Exec(`
		INSERT INTO chunking_strategies (id, name, type, config_json, description)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
		    name = excluded.name,
		    type = excluded.type,
		    config_json = excluded.config_json,
		    description = excluded.description
	`, id, name, strategyType, configJSON, description)
	if err != nil {
		return fmt.Errorf("insert chunking strategy: %w", err)
	}
	return nil
}

// GetDocumentContent returns the content text for a document
func (q *Queries) GetDocumentContent(documentID string) (string, error) {
	var content sql.NullString
	err := q.db.QueryRow(`
		SELECT content_text FROM documents WHERE id = ?
	`, documentID).Scan(&content)
	if err != nil {
		return "", fmt.Errorf("get document content: %w", err)
	}
	if !content.Valid {
		return "", nil
	}
	return content.String, nil
}

// CountDocumentChunks returns the number of chunks for a document
func (q *Queries) CountDocumentChunks(documentID string) (int, error) {
	var count int
	err := q.db.QueryRow(`
		SELECT COUNT(*) FROM chunks WHERE document_id = ?
	`, documentID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count document chunks: %w", err)
	}
	return count, nil
}

// InsertSource inserts or updates a source.
func (q *Queries) InsertSource(id, name, sourceType, configJSON string) error {
	_, err := q.db.Exec(`
		INSERT INTO sources (id, name, type, config_json)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
		    name = excluded.name,
		    type = excluded.type,
		    config_json = excluded.config_json,
		    updated_at = datetime('now')
	`, id, name, sourceType, configJSON)
	if err != nil {
		return fmt.Errorf("insert source: %w", err)
	}
	return nil
}

// ListSources returns all sources
func (q *Queries) ListSources() ([]Source, error) {
	rows, err := q.db.Query(`
		SELECT id, name, type, COALESCE(config_json, ''), created_at, updated_at
		FROM sources ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sources []Source
	for rows.Next() {
		var s Source
		if err := rows.Scan(&s.ID, &s.Name, &s.Type, &s.ConfigJSON, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sources = append(sources, s)
	}
	return sources, rows.Err()
}

// ListDocuments returns documents with optional limit/offset
func (q *Queries) ListDocuments(limit, offset int) ([]Document, error) {
	rows, err := q.db.Query(`
		SELECT id, source_id, COALESCE(external_id, ''), title, COALESCE(author, ''),
		       COALESCE(url, ''), content_type, word_count, language, status,
		       created_at, updated_at
		FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []Document
	for rows.Next() {
		var d Document
		if err := rows.Scan(&d.ID, &d.SourceID, &d.ExternalID, &d.Title, &d.Author,
			&d.URL, &d.ContentType, &d.WordCount, &d.Language, &d.Status,
			&d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		docs = append(docs, d)
	}
	return docs, rows.Err()
}

// GetDocument returns a single document by ID
func (q *Queries) GetDocument(id string) (*Document, error) {
	var d Document
	err := q.db.QueryRow(`
		SELECT id, source_id, COALESCE(external_id, ''), title, COALESCE(author, ''),
		       COALESCE(url, ''), content_type, word_count, language, status,
		       created_at, updated_at
		FROM documents WHERE id = ?
	`, id).Scan(&d.ID, &d.SourceID, &d.ExternalID, &d.Title, &d.Author,
		&d.URL, &d.ContentType, &d.WordCount, &d.Language, &d.Status,
		&d.CreatedAt, &d.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// ListChunks returns all chunks for a document, across all strategies.
func (q *Queries) ListChunks(documentID string) ([]Chunk, error) {
	rows, err := q.db.Query(`
		SELECT id, document_id, strategy_id, chunk_index, text, token_count,
		       COALESCE(start_offset, 0), COALESCE(end_offset, 0), created_at
		FROM chunks WHERE document_id = ? ORDER BY strategy_id, chunk_index
	`, documentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chunks []Chunk
	for rows.Next() {
		var c Chunk
		if err := rows.Scan(&c.ID, &c.DocumentID, &c.StrategyID, &c.ChunkIndex, &c.Text,
			&c.TokenCount, &c.StartOffset, &c.EndOffset, &c.CreatedAt); err != nil {
			return nil, err
		}
		chunks = append(chunks, c)
	}
	return chunks, rows.Err()
}

// Source is a data source record
type Source struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	ConfigJSON string `json:"config_json,omitempty"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

// Document is a document record
type Document struct {
	ID          string `json:"id"`
	SourceID    string `json:"source_id"`
	ExternalID  string `json:"external_id,omitempty"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	URL         string `json:"url,omitempty"`
	ContentType string `json:"content_type"`
	WordCount   int    `json:"word_count"`
	Language    string `json:"language"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// Chunk is a chunk record
type Chunk struct {
	ID          string `json:"id"`
	DocumentID  string `json:"document_id"`
	StrategyID  string `json:"strategy_id"`
	ChunkIndex  int    `json:"chunk_index"`
	Text        string `json:"text"`
	TokenCount  int    `json:"token_count"`
	StartOffset int    `json:"start_offset"`
	EndOffset   int    `json:"end_offset"`
	CreatedAt   string `json:"created_at"`
}

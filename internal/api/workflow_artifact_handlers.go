package api

import (
	"github.com/go-go-golems/rag-evaluation-system/internal/services/chunkenrichment"
	"github.com/go-go-golems/rag-evaluation-system/internal/services/documentprocessing"
	"github.com/go-go-golems/scraper/pkg/engine/model"
	"github.com/go-go-golems/scraper/pkg/services/engineview"
	"net/http"
)

func (h *handler) handleListWorkflows(w http.ResponseWriter, r *http.Request) {
	service := engineview.NewService(h.engineDB)
	result, err := service.ListWorkflows(r.Context(), engineview.ListWorkflowsOptions{
		Site:   "rag-eval",
		Status: model.WorkflowStatus(r.URL.Query().Get("status")),
		Limit:  intQueryDefault(r, "limit", 50),
		Offset: intQueryDefault(r, "offset", 0),
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "workflow_query_failed", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *handler) handleGetWorkflow(w http.ResponseWriter, r *http.Request) {
	service := engineview.NewService(h.engineDB)
	result, err := service.Workflow(r.Context(), model.WorkflowID(r.PathValue("id")))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "workflow_query_failed", err.Error())
		return
	}
	if result == nil {
		writeError(w, http.StatusNotFound, "not_found", "workflow not found")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *handler) handleWorkflowOps(w http.ResponseWriter, r *http.Request) {
	service := engineview.NewService(h.engineDB)
	result, err := service.WorkflowOps(r.Context(), model.WorkflowID(r.PathValue("id")))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "workflow_ops_query_failed", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": result, "workflow_id": r.PathValue("id")})
}

func (h *handler) handleDocumentProcessingCoverage(w http.ResponseWriter, r *http.Request) {
	service := documentprocessing.NewService(h.queries)
	result, err := service.Coverage(r.Context(), documentprocessing.CoverageRequest{
		ArtifactType:  r.URL.Query().Get("artifact_type"),
		PromptVersion: r.URL.Query().Get("prompt_version"),
		Provider:      r.URL.Query().Get("provider"),
		Model:         r.URL.Query().Get("model"),
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, "coverage_failed", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *handler) handleChunkEnrichmentCoverage(w http.ResponseWriter, r *http.Request) {
	service := chunkenrichment.NewService(h.queries)
	result, err := service.Coverage(r.Context(), chunkenrichment.CoverageRequest{
		StrategyID:    r.URL.Query().Get("strategy_id"),
		PromptVersion: r.URL.Query().Get("prompt_version"),
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, "coverage_failed", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *handler) handleDocumentProcessingArtifacts(w http.ResponseWriter, r *http.Request) {
	items, err := h.queries.ListDocumentProcessingArtifacts(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"document_id": r.PathValue("id"), "items": items})
}

func (h *handler) handleChunkEnrichments(w http.ResponseWriter, r *http.Request) {
	items, err := h.queries.ListChunkEnrichments(r.PathValue("id"), r.URL.Query().Get("strategy_id"), r.URL.Query().Get("prompt_version"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query_failed", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"chunk_id": r.PathValue("id"), "items": items})
}

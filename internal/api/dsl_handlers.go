package api

import "net/http"

func (h *handler) handleDslDemoPage(w http.ResponseWriter, r *http.Request) {
	pageID := r.PathValue("id")
	if pageID != "demo" {
		writeError(w, http.StatusNotFound, "not_found", "DSL page not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"id":    pageID,
		"title": "Widget IR Demo",
		"root": map[string]any{
			"kind": "component",
			"type": "AppShell",
			"props": map[string]any{
				"header": component("AppNav", map[string]any{
					"brand":        "◉ RAG Eval",
					"activeItemId": "dsl",
					"items": []any{
						map[string]any{"id": "search", "label": "Search"},
						map[string]any{"id": "corpus", "label": "Corpus"},
						map[string]any{"id": "workflows", "label": "Workflows"},
						map[string]any{"id": "dsl", "label": "DSL"},
					},
				}, nil),
			},
			"children": []any{
				component("Stack", map[string]any{"gap": "md"}, []any{
					component("Panel", map[string]any{
						"title":   "Widget IR Demo",
						"density": "condensed",
						"actions": component("StatusText", map[string]any{"status": "running", "icon": true}, []any{text("static backend IR")}),
					}, []any{
						component("MetadataGrid", map[string]any{
							"density": "compact",
							"items": []any{
								map[string]any{"key": "Source", "value": "GET /api/v1/dsl/pages/demo"},
								map[string]any{"key": "Renderer", "value": component("Caption", map[string]any{"tone": "success"}, []any{text("React WidgetRenderer")})},
								map[string]any{"key": "Purpose", "value": "Validate IR without Goja"},
							},
						}, nil),
					}),
					component("DashboardGrid", map[string]any{"recipe": "twoColumn"}, []any{
						component("Panel", map[string]any{"title": "Controls", "density": "condensed"}, []any{
							component("Stack", map[string]any{"gap": "sm"}, []any{
								component("FormRow", map[string]any{
									"label":   "Query",
									"control": component("TextInput", map[string]any{"value": "how fast do crape myrtles grow?", "placeholder": "Enter query…"}, nil),
								}, nil),
								component("Inline", map[string]any{"gap": "sm"}, []any{
									component("Button", map[string]any{"variant": "primary"}, []any{text("▶ Search")}),
									component("Button", map[string]any{"selected": true}, []any{text("hybrid")}),
									component("Button", nil, []any{text("bm25")}),
									component("Button", nil, []any{text("vector")}),
								}),
								component("FormRow", map[string]any{
									"label":   "Strategy",
									"control": component("SelectInput", map[string]any{"value": "fixed-500", "options": []any{map[string]any{"value": "fixed-500", "label": "fixed-500"}, map[string]any{"value": "semantic-512", "label": "semantic-512"}}}, nil),
								}, nil),
							}),
						}),
						component("Panel", map[string]any{"title": "Results", "fill": true}, []any{
							component("DataTable", map[string]any{
								"rows": []any{
									map[string]any{"id": "chunk_001", "rank": 1, "title": "Fast Growing Trees", "score": 0.8421, "status": "done", "preview": "Crape myrtle grows quickly in warm climates and benefits from full sun."},
									map[string]any{"id": "chunk_002", "rank": 2, "title": "Arborvitae Spacing", "score": 0.713, "status": "partial", "preview": "Spacing depends on cultivar and desired hedge density."},
									map[string]any{"id": "chunk_003", "rank": 3, "title": "Broken Import Example", "score": 0.11, "status": "failed", "preview": "This row demonstrates status rendering for failed states."},
								},
								"getRowKey":   map[string]any{"field": "id"},
								"selectedKey": "chunk_001",
								"columns": []any{
									map[string]any{"id": "rank", "header": "#", "align": "end", "cell": map[string]any{"kind": "number", "field": "rank"}},
									map[string]any{"id": "title", "header": "Title", "maxWidth": 180, "cell": map[string]any{"kind": "field", "field": "title"}},
									map[string]any{"id": "score", "header": "Score", "align": "end", "cell": map[string]any{"kind": "number", "field": "score", "format": "fixed", "digits": 4}},
									map[string]any{"id": "status", "header": "Status", "cell": map[string]any{"kind": "status", "field": "status", "icon": true}},
									map[string]any{"id": "preview", "header": "Preview", "maxWidth": 320, "cell": map[string]any{"kind": "field", "field": "preview"}},
								},
							}, nil),
						}),
					}),
				}),
			},
		},
	})
}

func text(value string) map[string]any {
	return map[string]any{"kind": "text", "text": value}
}

func component(componentType string, props map[string]any, children []any) map[string]any {
	out := map[string]any{"kind": "component", "type": componentType}
	if props != nil {
		out["props"] = props
	}
	if children != nil {
		out["children"] = children
	}
	return out
}

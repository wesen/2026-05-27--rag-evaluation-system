.DEFAULT_GOAL := smoke

REPO_ROOT := $(abspath ../../..)
XGOJA_ROOT := $(abspath ../../../../go-go-goja)
XGOJA := cd $(XGOJA_ROOT) && GOWORK=off go run ./cmd/xgoja
BIN := $(CURDIR)/dist/rag-widget-xgoja-site
HTTP_ADDR := 127.0.0.1:18791

.PHONY: smoke sync-app doctor list-modules build serve-smoke clean

smoke: doctor list-modules build serve-smoke

sync-app:
	rm -rf $(CURDIR)/assets/public
	mkdir -p $(CURDIR)/assets/public
	cp -R $(REPO_ROOT)/packages/rag-evaluation-site/app-dist/index.html $(REPO_ROOT)/packages/rag-evaluation-site/app-dist/assets $(CURDIR)/assets/public/
	find $(CURDIR)/assets/public -name '*.map' -delete
	python3 -c 'from pathlib import Path; root=Path("$(CURDIR)/assets/public/assets"); [p.write_text(p.read_text().replace("\\n//# sourceMappingURL=" + p.name + ".map", "").replace("//# sourceMappingURL=" + p.name + ".map", "")) for p in root.glob("*.js")]'

doctor:
	$(XGOJA) doctor -f $(CURDIR)/xgoja.yaml

list-modules:
	$(XGOJA) list-modules -f $(CURDIR)/xgoja.yaml

build:
	$(XGOJA) build -f $(CURDIR)/xgoja.yaml --output $(BIN) --xgoja-replace $(XGOJA_ROOT) --keep-work

serve-smoke: build
	@set -eu; \
	log=$$(mktemp); \
	$(BIN) serve sites demo --http-listen $(HTTP_ADDR) >$$log 2>&1 & \
	pid=$$!; \
	trap 'kill $$pid >/dev/null 2>&1 || true; wait $$pid >/dev/null 2>&1 || true; rm -f $$log /tmp/rag-widget-xgoja-page.json /tmp/rag-widget-xgoja-semantic.json /tmp/rag-widget-xgoja-transcripts.json /tmp/rag-widget-xgoja-slides.json /tmp/rag-widget-xgoja-handouts.json /tmp/rag-widget-xgoja-course.json /tmp/rag-widget-xgoja-page-after-actions.json /tmp/rag-widget-xgoja-action-add.json /tmp/rag-widget-xgoja-action-cycle.json /tmp/rag-widget-xgoja-action-retry.json /tmp/rag-widget-xgoja-spa.html /tmp/rag-widget-xgoja-health.json /tmp/rag-widget-xgoja-root.html /tmp/rag-widget-xgoja-asset.js' EXIT; \
	for i in $$(seq 1 100); do \
		if curl -fsS http://$(HTTP_ADDR)/healthz >/tmp/rag-widget-xgoja-health.json 2>/dev/null; then break; fi; \
		if ! kill -0 $$pid >/dev/null 2>&1; then cat $$log; exit 1; fi; \
		sleep 0.1; \
	done; \
	grep -q '"ok":true' /tmp/rag-widget-xgoja-health.json; \
	grep -q '"site":"rag-widget-xgoja-site"' /tmp/rag-widget-xgoja-health.json; \
	curl -fsS -o /dev/null http://$(HTTP_ADDR)/favicon.ico; \
	curl -fsS http://$(HTTP_ADDR)/api/widget/pages/demo >/tmp/rag-widget-xgoja-page.json; \
	grep -q '"schemaVersion":"0.1.0"' /tmp/rag-widget-xgoja-page.json; \
	grep -q '"type":"DataTable"' /tmp/rag-widget-xgoja-page.json; \
	grep -q 'Fast Growing Trees' /tmp/rag-widget-xgoja-page.json; \
	grep -q 'Queue controls' /tmp/rag-widget-xgoja-page.json; \
	curl -fsS http://$(HTTP_ADDR)/api/widget/pages/semantic >/tmp/rag-widget-xgoja-semantic.json; \
	grep -q 'ContextDiagramPanel' /tmp/rag-widget-xgoja-semantic.json; \
	grep -q 'CourseStudioShell' /tmp/rag-widget-xgoja-semantic.json; \
	grep -q 'HandoutDocumentShell' /tmp/rag-widget-xgoja-semantic.json; \
	curl -fsS http://$(HTTP_ADDR)/api/widget/pages/transcripts >/tmp/rag-widget-xgoja-transcripts.json; \
	grep -q 'TranscriptWorkspacePanel' /tmp/rag-widget-xgoja-transcripts.json; \
	grep -q 'AnchoredCommentRail' /tmp/rag-widget-xgoja-transcripts.json; \
	curl -fsS http://$(HTTP_ADDR)/api/widget/pages/slides >/tmp/rag-widget-xgoja-slides.json; \
	grep -q 'CourseSlidePanel' /tmp/rag-widget-xgoja-slides.json; \
	grep -q 'SlideShell' /tmp/rag-widget-xgoja-slides.json; \
	curl -fsS http://$(HTTP_ADDR)/api/widget/pages/handouts >/tmp/rag-widget-xgoja-handouts.json; \
	grep -q 'DocumentListPanel' /tmp/rag-widget-xgoja-handouts.json; \
	grep -q 'MarkdownArticle' /tmp/rag-widget-xgoja-handouts.json; \
	curl -fsS http://$(HTTP_ADDR)/api/widget/pages/course-examples >/tmp/rag-widget-xgoja-course.json; \
	grep -q 'CourseLessonPanel' /tmp/rag-widget-xgoja-course.json; \
	grep -q 'CourseStudioShell' /tmp/rag-widget-xgoja-course.json; \
	curl -fsS -X POST http://$(HTTP_ADDR)/api/widget/actions/add-query -H 'Content-Type: application/json' -d '{"payload":{"owner":"qa"},"context":{"componentType":"Button"}}' >/tmp/rag-widget-xgoja-action-add.json; \
	grep -q '"refresh":true' /tmp/rag-widget-xgoja-action-add.json; \
	grep -q 'Added query' /tmp/rag-widget-xgoja-action-add.json; \
	curl -fsS -X POST http://$(HTTP_ADDR)/api/widget/actions/cycle-status -H 'Content-Type: application/json' -d '{"payload":{"id":2},"context":{"componentType":"Button"}}' >/tmp/rag-widget-xgoja-action-cycle.json; \
	grep -q 'status' /tmp/rag-widget-xgoja-action-cycle.json; \
	grep -q 'succeeded' /tmp/rag-widget-xgoja-action-cycle.json; \
	curl -fsS -X POST http://$(HTTP_ADDR)/api/widget/actions/bulk-retry-failed -H 'Content-Type: application/json' -d '{"payload":{},"context":{"componentType":"Button"}}' >/tmp/rag-widget-xgoja-action-retry.json; \
	grep -q 'Retried failed queries' /tmp/rag-widget-xgoja-action-retry.json; \
	curl -fsS http://$(HTTP_ADDR)/api/widget/pages/demo >/tmp/rag-widget-xgoja-page-after-actions.json; \
	grep -q 'Follow-up Query' /tmp/rag-widget-xgoja-page-after-actions.json; \
	grep -q 'Bulk retry requested from Widget IR action' /tmp/rag-widget-xgoja-page-after-actions.json; \
	curl -fsS http://$(HTTP_ADDR)/ >/tmp/rag-widget-xgoja-root.html; \
	grep -q 'RAG Evaluation Site' /tmp/rag-widget-xgoja-root.html; \
	grep -q '/assets/index-' /tmp/rag-widget-xgoja-root.html; \
	curl -fsS http://$(HTTP_ADDR)/pages/demo >/tmp/rag-widget-xgoja-spa.html; \
	grep -q 'RAG Evaluation Site' /tmp/rag-widget-xgoja-spa.html; \
	curl -fsS http://$(HTTP_ADDR)/assets/$$(basename $$(find $(CURDIR)/assets/public/assets -name 'index-*.js' | head -1)) >/tmp/rag-widget-xgoja-asset.js; \
	grep -q 'RagEvaluationSiteApp' /tmp/rag-widget-xgoja-asset.js; \
	kill $$pid >/dev/null 2>&1 || true; \
	wait $$pid >/dev/null 2>&1 || true

clean:
	rm -rf $(CURDIR)/dist

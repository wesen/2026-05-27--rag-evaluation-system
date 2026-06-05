package widgetrunner

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestRenderNamedPageFromExportsPages(t *testing.T) {
	dir := writeScript(t, `
		const rag = require("widget.dsl");
		exports.pages = {
			demo(ctx) {
				return {
					id: ctx.pageId,
					title: "Demo " + ctx.query.q,
					root: rag.panel({ title: "Demo" },
						rag.caption({ tone: "success" }, "Hello " + ctx.query.q)
					),
					meta: { source: "test" },
				};
			}
		};
	`)

	runner := newTestRunner(t, dir)
	page, err := runner.RenderPage(context.Background(), "demo", PageContext{Query: map[string]string{"q": "World"}})
	if err != nil {
		t.Fatalf("render page: %v", err)
	}
	if page.SchemaVersion != "0.1.0" {
		t.Fatalf("schemaVersion = %q", page.SchemaVersion)
	}
	if page.ID != "demo" || page.Title != "Demo World" {
		t.Fatalf("page identity = (%q, %q)", page.ID, page.Title)
	}
	assertString(t, page.Root, "kind", "component")
	assertString(t, page.Root, "type", "Panel")
	if page.Meta["source"] != "test" {
		t.Fatalf("meta = %#v", page.Meta)
	}
}

func TestRenderFallbackExportsPageWrapsBareWidgetNode(t *testing.T) {
	dir := writeScript(t, `
		const rag = require("widget.dsl");
		exports.page = function(ctx) {
			return rag.statusText({ status: "running", icon: true }, "Page " + ctx.pageId);
		};
	`)

	runner := newTestRunner(t, dir)
	page, err := runner.RenderPage(context.Background(), "index", PageContext{})
	if err != nil {
		t.Fatalf("render fallback page: %v", err)
	}
	if page.ID != "index" || page.Title != "index" {
		t.Fatalf("wrapped page identity = (%q, %q)", page.ID, page.Title)
	}
	assertString(t, page.Root, "kind", "component")
	assertString(t, page.Root, "type", "StatusText")
}

func TestRenderMissingPageReturnsPageNotFound(t *testing.T) {
	dir := writeScript(t, `
		const rag = require("widget.dsl");
		exports.pages = { demo() { return rag.text("demo"); } };
	`)

	runner := newTestRunner(t, dir)
	_, err := runner.RenderPage(context.Background(), "missing", PageContext{})
	if !errors.Is(err, ErrPageNotFound) {
		t.Fatalf("error = %v, want ErrPageNotFound", err)
	}
}

func TestInvalidWidgetIRIsRejected(t *testing.T) {
	dir := writeScript(t, `
		exports.pages = {
			bad() { return { id: "bad", title: "Bad", root: { kind: "component" } }; }
		};
	`)

	runner := newTestRunner(t, dir)
	_, err := runner.RenderPage(context.Background(), "bad", PageContext{})
	if !errors.Is(err, ErrInvalidWidgetIR) {
		t.Fatalf("error = %v, want ErrInvalidWidgetIR", err)
	}
}

func TestInvokeActionFromExportsActions(t *testing.T) {
	dir := writeScript(t, `
		exports.actions = {
			save(ctx, payload) {
				return { ok: true, refresh: true, toast: "saved " + payload.id, data: { action: ctx.action, rowKey: ctx.rowKey } };
			}
		};
	`)

	runner := newTestRunner(t, dir)
	result, err := runner.InvokeAction(context.Background(), "save", ActionRequest{
		Payload: map[string]any{"id": "42"},
		Context: map[string]any{"rowKey": "row-42"},
	})
	if err != nil {
		t.Fatalf("invoke action: %v", err)
	}
	if !result.OK || !result.Refresh || result.Toast != "saved 42" {
		t.Fatalf("result = %#v", result)
	}
	if result.Data["action"] != "save" || result.Data["rowKey"] != "row-42" {
		t.Fatalf("data = %#v", result.Data)
	}
}

func TestInvokeMissingActionReturnsActionNotFound(t *testing.T) {
	dir := writeScript(t, `exports.actions = {};`)
	runner := newTestRunner(t, dir)
	_, err := runner.InvokeAction(context.Background(), "missing", ActionRequest{})
	if !errors.Is(err, ErrActionNotFound) {
		t.Fatalf("error = %v, want ErrActionNotFound", err)
	}
}

func TestScriptsLoadInLexicalOrderAndShareExports(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, "01-base.js"), `
		const rag = require("widget.dsl");
		exports.pages = {};
		exports.makePanel = function(title) { return rag.panel({ title }, "ok"); };
	`)
	writeFile(t, filepath.Join(dir, "02-page.js"), `
		exports.pages.later = function() {
			return { id: "later", title: "Later", root: exports.makePanel("Later") };
		};
	`)

	runner := newTestRunner(t, dir)
	if got := len(runner.Scripts()); got != 2 {
		t.Fatalf("loaded scripts = %d, want 2", got)
	}
	page, err := runner.RenderPage(context.Background(), "later", PageContext{})
	if err != nil {
		t.Fatalf("render later page: %v", err)
	}
	assertString(t, page.Root, "type", "Panel")
}

func newTestRunner(t *testing.T, dir string) *Runner {
	t.Helper()
	runner, err := New(context.Background(), Config{ScriptDirs: []string{dir}})
	if err != nil {
		t.Fatalf("new runner: %v", err)
	}
	t.Cleanup(func() { _ = runner.Close(context.Background()) })
	return runner
}

func writeScript(t *testing.T, source string) string {
	t.Helper()
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, "page.js"), source)
	return dir
}

func writeFile(t *testing.T, path, source string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(source), 0o644); err != nil {
		t.Fatalf("write script %s: %v", path, err)
	}
}

func assertString(t *testing.T, m map[string]any, key, want string) {
	t.Helper()
	if got, _ := m[key].(string); got != want {
		t.Fatalf("%s = %#v, want %q (map=%#v)", key, m[key], want, m)
	}
}

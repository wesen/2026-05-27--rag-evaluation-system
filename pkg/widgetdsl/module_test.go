package widgetdsl

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/require"
	"github.com/go-go-golems/go-go-goja/modules"
	"github.com/go-go-golems/go-go-goja/pkg/engine"
)

func TestRequireWidgetDSLExportsHelpers(t *testing.T) {
	vm := goja.New()
	reg := require.NewRegistry()
	modules.DefaultRegistry.Enable(reg)
	reg.Enable(vm)

	value, err := vm.RunString(`
		const rag = require("widget.dsl");
		({
			text: typeof rag.text,
			component: typeof rag.component,
			element: typeof rag.element,
			panel: typeof rag.panel,
			dataTable: typeof rag.dataTable,
			cellField: typeof rag.cell.field,
			cellStatus: typeof rag.cell.status,
		});
	`)
	if err != nil {
		t.Fatalf("require widget.dsl: %v", err)
	}
	got := value.Export().(map[string]any)
	for _, name := range []string{"text", "component", "element", "panel", "dataTable", "cellField", "cellStatus"} {
		if got[name] != "function" {
			t.Fatalf("%s export = %#v, want function (all: %#v)", name, got[name], got)
		}
	}
}

func TestRagAliasRegistration(t *testing.T) {
	vm := goja.New()
	reg := require.NewRegistry()
	Register(reg)
	reg.Enable(vm)

	value, err := vm.RunString(`
		const rag = require("rag.dsl");
		typeof rag.panel;
	`)
	if err != nil {
		t.Fatalf("require rag.dsl: %v", err)
	}
	if got := value.String(); got != "function" {
		t.Fatalf("typeof rag.panel = %s, want function", got)
	}
}

func TestBuildsNestedWidgetIR(t *testing.T) {
	vm := goja.New()
	reg := require.NewRegistry()
	Register(reg)
	reg.Enable(vm)

	value, err := vm.RunString(`
		const rag = require("widget.dsl");
		rag.panel({ title: "Demo", density: "condensed" },
			rag.stack({ gap: "sm" }, [
				rag.caption({ tone: "success" }, "Ready"),
				rag.button({ variant: "primary" }, "Run"),
			])
		);
	`)
	if err != nil {
		t.Fatalf("build widget IR: %v", err)
	}
	got := value.Export().(map[string]any)
	assertString(t, got, "kind", "component")
	assertString(t, got, "type", "Panel")
	props := got["props"].(map[string]any)
	if props["title"] != "Demo" || props["density"] != "condensed" {
		t.Fatalf("props = %#v", props)
	}
	children := got["children"].([]any)
	if len(children) != 1 {
		t.Fatalf("children len = %d, want 1: %#v", len(children), children)
	}
	stack := children[0].(map[string]any)
	assertString(t, stack, "type", "Stack")
	stackChildren := stack["children"].([]any)
	if len(stackChildren) != 2 {
		t.Fatalf("stack children len = %d, want 2: %#v", len(stackChildren), stackChildren)
	}
}

func TestEngineRegistrarRegistersWidgetAndRagAliases(t *testing.T) {
	factory, err := engine.NewRuntimeFactoryBuilder().WithModules(NewRegistrar()).Build()
	if err != nil {
		t.Fatalf("build runtime factory: %v", err)
	}
	rt, err := factory.NewRuntime()
	if err != nil {
		t.Fatalf("create runtime: %v", err)
	}
	defer func() { _ = rt.Close(context.Background()) }()

	value, err := rt.VM.RunString(`
		const widget = require("widget.dsl");
		const rag = require("rag.dsl");
		({ widgetPanel: typeof widget.panel, ragPanel: typeof rag.panel });
	`)
	if err != nil {
		t.Fatalf("require modules through engine registrar: %v", err)
	}
	got := value.Export().(map[string]any)
	if got["widgetPanel"] != "function" || got["ragPanel"] != "function" {
		t.Fatalf("registrar exports = %#v, want both aliases to expose panel()", got)
	}
}

func TestDataTableAndCellHelpersAreJSONSerializable(t *testing.T) {
	vm := goja.New()
	reg := require.NewRegistry()
	Register(reg)
	reg.Enable(vm)

	value, err := vm.RunString(`
		const rag = require("widget.dsl");
		const table = rag.dataTable({
			rows: [{ id: "a", title: "Alpha", status: "done", score: 0.42 }],
			getRowKey: { field: "id" },
			columns: [
				{ id: "title", header: "Title", cell: rag.cell.field("title") },
				{ id: "score", header: "Score", align: "end", cell: rag.cell.number("score", { format: "fixed", digits: 2 }) },
				{ id: "status", header: "Status", cell: rag.cell.status("status", { icon: true }) },
			]
		});
		JSON.stringify(table);
	`)
	if err != nil {
		t.Fatalf("build table IR: %v", err)
	}
	var decoded map[string]any
	if err := json.Unmarshal([]byte(value.String()), &decoded); err != nil {
		t.Fatalf("IR is not JSON: %v\n%s", err, value.String())
	}
	assertString(t, decoded, "kind", "component")
	assertString(t, decoded, "type", "DataTable")
}

func assertString(t *testing.T, m map[string]any, key, want string) {
	t.Helper()
	if got, _ := m[key].(string); got != want {
		t.Fatalf("%s = %#v, want %q (map=%#v)", key, m[key], want, m)
	}
}

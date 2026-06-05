package widgetsite

import (
	"context"
	"strings"
	"testing"

	"github.com/dop251/goja"
	"github.com/go-go-golems/go-go-goja/pkg/xgoja/app"
	"github.com/go-go-golems/go-go-goja/pkg/xgoja/providerapi"
)

func TestRegisterExposesWidgetModules(t *testing.T) {
	registry := providerapi.NewProviderRegistry()
	if err := Register(registry); err != nil {
		t.Fatalf("register provider: %v", err)
	}
	for _, name := range []string{"widget.dsl", "rag.dsl"} {
		mod, ok := registry.ResolveModule(PackageID, name)
		if !ok {
			t.Fatalf("expected module %q", name)
		}
		loader, err := mod.NewModuleFactory(providerapi.ModuleSetupContext{Context: context.Background(), Name: name, As: name})
		if err != nil {
			t.Fatalf("new loader for %s: %v", name, err)
		}
		vm := goja.New()
		moduleObj := vm.NewObject()
		exports := vm.NewObject()
		if err := moduleObj.Set("exports", exports); err != nil {
			t.Fatalf("set exports: %v", err)
		}
		loader(vm, moduleObj)
		if got := exports.Get("panel"); got == nil || got.String() == "undefined" {
			t.Fatalf("module %s did not expose panel(): %#v", name, got)
		}
	}
}

func TestGeneratedRuntimeCanRequireWidgetDSL(t *testing.T) {
	registry := providerapi.NewProviderRegistry()
	if err := Register(registry); err != nil {
		t.Fatalf("register provider: %v", err)
	}
	runtimeSpec := &app.RuntimeSpec{
		Name: "widgetsite-provider-test",
		Modules: []app.ModuleInstanceSpec{{
			Package: PackageID,
			Name:    "widget.dsl",
			As:      "widget.dsl",
		}},
	}
	host := app.NewHost(registry, runtimeSpec)
	rt, err := host.Factory.NewRuntime(context.Background())
	if err != nil {
		t.Fatalf("new runtime: %v", err)
	}
	defer func() { _ = rt.Close(context.Background()) }()

	ret, err := rt.Owner.Call(context.Background(), "widgetsite-provider.require-widget-dsl", func(_ context.Context, vm *goja.Runtime) (any, error) {
		value, runErr := vm.RunString(`
			const rag = require("widget.dsl");
			const node = rag.panel({ title: "Demo" }, "ok");
			JSON.stringify(node);
		`)
		if runErr != nil {
			return nil, runErr
		}
		return value.String(), nil
	})
	if err != nil {
		t.Fatalf("run script: %v", err)
	}
	json := ret.(string)
	for _, want := range []string{`"kind":"component"`, `"type":"Panel"`, `"title":"Demo"`} {
		if !strings.Contains(json, want) {
			t.Fatalf("result missing %s: %s", want, json)
		}
	}
}

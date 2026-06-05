package widgetdsl

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/require"
	"github.com/go-go-golems/go-go-goja/modules"
)

const ModuleName = "widget.dsl"

var componentNames = []string{
	"appShell",
	"appNav",
	"button",
	"caption",
	"dashboardGrid",
	"dataTable",
	"formRow",
	"inline",
	"metadataGrid",
	"panel",
	"scrollRegion",
	"selectInput",
	"stack",
	"statusText",
	"tabList",
	"textInput",
}

var componentTypes = map[string]string{
	"appShell":      "AppShell",
	"appNav":        "AppNav",
	"button":        "Button",
	"caption":       "Caption",
	"dashboardGrid": "DashboardGrid",
	"dataTable":     "DataTable",
	"formRow":       "FormRow",
	"inline":        "Inline",
	"metadataGrid":  "MetadataGrid",
	"panel":         "Panel",
	"scrollRegion":  "ScrollRegion",
	"selectInput":   "SelectInput",
	"stack":         "Stack",
	"statusText":    "StatusText",
	"tabList":       "TabList",
	"textInput":     "TextInput",
}

type module struct{}

var _ modules.NativeModule = (*module)(nil)

func NewLoader() require.ModuleLoader {
	mod := &module{}
	return mod.Loader
}

func Register(reg *require.Registry) {
	if reg == nil {
		return
	}
	loader := NewLoader()
	reg.RegisterNativeModule(ModuleName, loader)
	reg.RegisterNativeModule("rag.dsl", loader)
}

func (module) Name() string { return ModuleName }

func (module) Doc() string {
	return `
widget.dsl is a RAG Evaluation System authoring DSL for producing JSON-compatible
Widget IR. The returned IR is intended to be rendered by the React WidgetRenderer,
not by Go-side HTML generation.

Example:

  const rag = require("widget.dsl");
  exports.page = () => rag.panel({title: "Demo"},
    rag.caption({tone: "success"}, "Rendered by React")
  );
`
}

func (m *module) Loader(vm *goja.Runtime, moduleObj *goja.Object) {
	rt := &runtime{vm: vm}
	exports := moduleObj.Get("exports").(*goja.Object)
	rt.install(exports)
}

func init() {
	modules.Register(&module{})
}

type runtime struct {
	vm *goja.Runtime
}

func (r *runtime) install(exports *goja.Object) {
	setExport(exports, "text", r.text)
	setExport(exports, "element", r.element)
	setExport(exports, "component", r.component)
	setExport(exports, "fragment", r.fragment)

	for _, name := range componentNames {
		componentType := componentTypes[name]
		setExport(exports, name, r.componentFactory(componentType))
	}

	cell := r.vm.NewObject()
	setExport(cell, "field", func(field string, options ...goja.Value) map[string]any {
		out := map[string]any{"kind": "field", "field": field}
		mergeOptions(out, exportOptions(options))
		return out
	})
	setExport(cell, "number", func(field string, options ...goja.Value) map[string]any {
		out := map[string]any{"kind": "number", "field": field}
		mergeOptions(out, exportOptions(options))
		return out
	})
	setExport(cell, "status", func(field string, options ...goja.Value) map[string]any {
		out := map[string]any{"kind": "status", "field": field}
		mergeOptions(out, exportOptions(options))
		return out
	})
	setExport(cell, "caption", func(field string, options ...goja.Value) map[string]any {
		out := map[string]any{"kind": "caption", "field": field}
		mergeOptions(out, exportOptions(options))
		return out
	})
	setExport(cell, "template", func(template string) map[string]any {
		return map[string]any{"kind": "template", "template": template}
	})
	setExport(cell, "link", func(hrefField string, labelField string, options ...goja.Value) map[string]any {
		out := map[string]any{"kind": "link", "hrefField": hrefField, "labelField": labelField}
		mergeOptions(out, exportOptions(options))
		return out
	})
	setExport(cell, "constant", func(value goja.Value) any {
		return map[string]any{"kind": "constant", "value": r.exportRenderable(value)}
	})
	setExport(exports, "cell", cell)
}

func (r *runtime) text(value goja.Value) map[string]any {
	return map[string]any{"kind": "text", "text": stringifyValue(value)}
}

func (r *runtime) element(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) == 0 {
		panic(r.vm.NewGoError(fmt.Errorf("widget.dsl element(tag, attrs?, ...children) requires a tag")))
	}
	tag := strings.TrimSpace(call.Arguments[0].String())
	if tag == "" {
		panic(r.vm.NewGoError(fmt.Errorf("widget.dsl element tag must not be empty")))
	}
	attrs := map[string]any{}
	childStart := 1
	if len(call.Arguments) > 1 && isPlainObject(call.Arguments[1]) && !looksLikeWidgetNodeExport(call.Arguments[1]) {
		attrs = exportObject(call.Arguments[1])
		childStart = 2
	}
	out := map[string]any{"kind": "element", "tag": tag}
	if len(attrs) > 0 {
		out["attrs"] = attrs
	}
	children := r.exportChildren(call.Arguments[childStart:])
	if len(children) > 0 {
		out["children"] = children
	}
	return r.vm.ToValue(out)
}

func (r *runtime) component(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) == 0 {
		panic(r.vm.NewGoError(fmt.Errorf("widget.dsl component(type, props?, ...children) requires a type")))
	}
	componentType := strings.TrimSpace(call.Arguments[0].String())
	if componentType == "" {
		panic(r.vm.NewGoError(fmt.Errorf("widget.dsl component type must not be empty")))
	}
	props, childStart := propsAndChildStart(call.Arguments, 1)
	return r.vm.ToValue(r.buildComponent(componentType, props, call.Arguments[childStart:]))
}

func (r *runtime) componentFactory(componentType string) func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		props, childStart := propsAndChildStart(call.Arguments, 0)
		return r.vm.ToValue(r.buildComponent(componentType, props, call.Arguments[childStart:]))
	}
}

func (r *runtime) fragment(call goja.FunctionCall) []any {
	return r.exportChildren(call.Arguments)
}

func (r *runtime) buildComponent(componentType string, props map[string]any, childValues []goja.Value) map[string]any {
	out := map[string]any{"kind": "component", "type": componentType}
	if len(props) > 0 {
		out["props"] = props
	}
	children := r.exportChildren(childValues)
	if len(children) > 0 {
		out["children"] = children
	}
	return out
}

func (r *runtime) exportChildren(values []goja.Value) []any {
	out := []any{}
	for _, value := range values {
		out = append(out, r.exportChild(value)...)
	}
	return out
}

func (r *runtime) exportChild(value goja.Value) []any {
	if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
		return nil
	}
	if isArrayLike(value) {
		obj := value.ToObject(r.vm)
		length := int(obj.Get("length").ToInteger())
		out := []any{}
		for i := 0; i < length; i++ {
			out = append(out, r.exportChild(obj.Get(fmt.Sprintf("%d", i)))...)
		}
		return out
	}
	if isWidgetNode(r.vm, value) {
		return []any{value.Export()}
	}
	return []any{map[string]any{"kind": "text", "text": stringifyValue(value)}}
}

func (r *runtime) exportRenderable(value goja.Value) any {
	children := r.exportChild(value)
	if len(children) == 0 {
		return nil
	}
	if len(children) == 1 {
		return children[0]
	}
	return children
}

func propsAndChildStart(args []goja.Value, index int) (map[string]any, int) {
	if len(args) > index && isPlainObject(args[index]) && !looksLikeWidgetNodeExport(args[index]) {
		return exportObject(args[index]), index + 1
	}
	return map[string]any{}, index
}

func isPlainObject(value goja.Value) bool {
	if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
		return false
	}
	exported := value.Export()
	_, ok := exported.(map[string]any)
	return ok
}

func isWidgetNode(vm *goja.Runtime, value goja.Value) bool {
	if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
		return false
	}
	obj := value.ToObject(vm)
	kind := obj.Get("kind")
	if kind == nil || goja.IsUndefined(kind) || goja.IsNull(kind) {
		return false
	}
	s := kind.String()
	return s == "text" || s == "element" || s == "component"
}

func looksLikeWidgetNodeExport(value goja.Value) bool {
	exported, ok := value.Export().(map[string]any)
	if !ok {
		return false
	}
	kind, _ := exported["kind"].(string)
	return kind == "text" || kind == "element" || kind == "component"
}

func isArrayLike(value goja.Value) bool {
	if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
		return false
	}
	t := value.ExportType()
	if t == nil {
		return false
	}
	k := t.Kind()
	return k == reflect.Slice || k == reflect.Array
}

func exportObject(value goja.Value) map[string]any {
	if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
		return map[string]any{}
	}
	if exported, ok := value.Export().(map[string]any); ok {
		return exported
	}
	return map[string]any{}
}

func exportOptions(options []goja.Value) map[string]any {
	if len(options) == 0 {
		return map[string]any{}
	}
	return exportObject(options[0])
}

func mergeOptions(out map[string]any, options map[string]any) {
	for k, v := range options {
		out[k] = v
	}
}

func stringifyValue(value goja.Value) string {
	if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
		return ""
	}
	return value.String()
}

func setExport(obj *goja.Object, name string, value any) {
	if err := obj.Set(name, value); err != nil {
		panic(err)
	}
}

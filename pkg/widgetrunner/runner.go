package widgetrunner

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/dop251/goja"
	"github.com/go-go-golems/go-go-goja/pkg/engine"
	"github.com/go-go-golems/rag-evaluation-system/pkg/widgetdsl"
	"github.com/go-go-golems/rag-evaluation-system/pkg/widgetschema"
)

var (
	ErrPageNotFound    = errors.New("widgetrunner: page not found")
	ErrActionNotFound  = errors.New("widgetrunner: action not found")
	ErrInvalidPage     = errors.New("widgetrunner: invalid page")
	ErrInvalidAction   = errors.New("widgetrunner: invalid action result")
	ErrInvalidWidgetIR = errors.New("widgetrunner: invalid widget IR")
)

type Config struct {
	ScriptDirs []string
	Dev        bool
	Modules    []engine.RuntimeModuleRegistrar
}

type Runner struct {
	cfg     Config
	factory *engine.RuntimeFactory
	runtime *engine.Runtime
	scripts []ScriptInfo
}

type ScriptInfo struct {
	Path string `json:"path"`
}

type PageContext struct {
	PageID string            `json:"pageId"`
	Query  map[string]string `json:"query,omitempty"`
	User   map[string]any    `json:"user,omitempty"`
	Data   map[string]any    `json:"data,omitempty"`
}

type PageResult struct {
	SchemaVersion string         `json:"schemaVersion"`
	ID            string         `json:"id"`
	Title         string         `json:"title"`
	Root          map[string]any `json:"root"`
	Meta          map[string]any `json:"meta,omitempty"`
}

type ActionRequest struct {
	Payload map[string]any `json:"payload,omitempty"`
	Context map[string]any `json:"context,omitempty"`
}

type ActionResult struct {
	OK      bool           `json:"ok"`
	Refresh bool           `json:"refresh,omitempty"`
	Toast   string         `json:"toast,omitempty"`
	Patch   map[string]any `json:"patch,omitempty"`
	Data    map[string]any `json:"data,omitempty"`
}

func New(ctx context.Context, cfg Config) (*Runner, error) {
	if len(cfg.ScriptDirs) == 0 {
		cfg.ScriptDirs = []string{"./scripts"}
	}

	mods := make([]engine.RuntimeModuleRegistrar, 0, len(cfg.Modules)+1)
	mods = append(mods, widgetdsl.NewRegistrar())
	mods = append(mods, cfg.Modules...)

	factory, err := engine.NewRuntimeFactoryBuilder().WithModules(mods...).Build()
	if err != nil {
		return nil, fmt.Errorf("build widget runner factory: %w", err)
	}
	rt, err := factory.NewRuntime()
	if err != nil {
		return nil, fmt.Errorf("create widget runner runtime: %w", err)
	}

	r := &Runner{cfg: cfg, factory: factory, runtime: rt}
	if err := r.installGlobals(ctx); err != nil {
		_ = r.Close(context.Background())
		return nil, err
	}
	if err := r.LoadScripts(ctx); err != nil {
		_ = r.Close(context.Background())
		return nil, err
	}
	return r, nil
}

func (r *Runner) Scripts() []ScriptInfo {
	if r == nil || len(r.scripts) == 0 {
		return nil
	}
	out := make([]ScriptInfo, len(r.scripts))
	copy(out, r.scripts)
	return out
}

func (r *Runner) Close(ctx context.Context) error {
	if r == nil || r.runtime == nil {
		return nil
	}
	return r.runtime.Close(ctx)
}

func (r *Runner) installGlobals(ctx context.Context) error {
	if r == nil || r.runtime == nil {
		return fmt.Errorf("widgetrunner: runtime is not initialized")
	}
	_, err := r.runtime.Owner.Call(ctx, "widgetrunner.install-globals", func(_ context.Context, vm *goja.Runtime) (any, error) {
		exports := vm.NewObject()
		if err := vm.Set("exports", exports); err != nil {
			return nil, err
		}
		return nil, nil
	})
	if err != nil {
		return fmt.Errorf("install widget runner globals: %w", err)
	}
	return nil
}

func (r *Runner) LoadScripts(ctx context.Context) error {
	if r == nil || r.runtime == nil {
		return fmt.Errorf("widgetrunner: runtime is not initialized")
	}
	files, err := scriptFiles(r.cfg.ScriptDirs)
	if err != nil {
		return err
	}
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("read script %s: %w", file, err)
		}
		file := file
		dataString := string(data)
		_, err = r.runtime.Owner.Call(ctx, "widgetrunner.load-script", func(_ context.Context, vm *goja.Runtime) (any, error) {
			_, err := vm.RunScript(file, dataString)
			return nil, err
		})
		if err != nil {
			return fmt.Errorf("execute script %s: %w", file, err)
		}
		r.scripts = append(r.scripts, ScriptInfo{Path: file})
	}
	return nil
}

func (r *Runner) RenderPage(ctx context.Context, id string, pageCtx PageContext) (*PageResult, error) {
	if r == nil || r.runtime == nil {
		return nil, fmt.Errorf("widgetrunner: runtime is not initialized")
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, fmt.Errorf("%w: empty page id", ErrPageNotFound)
	}
	pageCtx.PageID = id

	ret, err := r.runtime.Owner.Call(ctx, "widgetrunner.render-page", func(_ context.Context, vm *goja.Runtime) (any, error) {
		fn, err := lookupPageFunction(vm, id)
		if err != nil {
			return nil, err
		}
		value, err := fn(goja.Undefined(), vm.ToValue(pageContextMap(pageCtx)))
		if err != nil {
			return nil, err
		}
		return value.Export(), nil
	})
	if err != nil {
		return nil, err
	}

	page, err := NormalizePageResult(id, ret)
	if err != nil {
		return nil, err
	}
	if err := ValidatePage(page); err != nil {
		return nil, err
	}
	return page, nil
}

func (r *Runner) InvokeAction(ctx context.Context, name string, req ActionRequest) (*ActionResult, error) {
	if r == nil || r.runtime == nil {
		return nil, fmt.Errorf("widgetrunner: runtime is not initialized")
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("%w: empty action name", ErrActionNotFound)
	}

	ret, err := r.runtime.Owner.Call(ctx, "widgetrunner.invoke-action", func(_ context.Context, vm *goja.Runtime) (any, error) {
		fn, err := lookupActionFunction(vm, name)
		if err != nil {
			return nil, err
		}
		value, err := fn(goja.Undefined(), vm.ToValue(actionContextMap(name, req)), vm.ToValue(req.Payload))
		if err != nil {
			return nil, err
		}
		return value.Export(), nil
	})
	if err != nil {
		return nil, err
	}
	return NormalizeActionResult(ret)
}

func lookupPageFunction(vm *goja.Runtime, id string) (goja.Callable, error) {
	exportsValue := vm.Get("exports")
	if exportsValue == nil || goja.IsUndefined(exportsValue) || goja.IsNull(exportsValue) {
		return nil, fmt.Errorf("%w: exports is not defined", ErrPageNotFound)
	}
	exports := exportsValue.ToObject(vm)

	pagesValue := exports.Get("pages")
	if pagesValue != nil && !goja.IsUndefined(pagesValue) && !goja.IsNull(pagesValue) {
		pageValue := pagesValue.ToObject(vm).Get(id)
		if fn, ok := goja.AssertFunction(pageValue); ok {
			return fn, nil
		}
	}

	pageValue := exports.Get("page")
	if fn, ok := goja.AssertFunction(pageValue); ok {
		return fn, nil
	}

	return nil, fmt.Errorf("%w: %s", ErrPageNotFound, id)
}

func lookupActionFunction(vm *goja.Runtime, name string) (goja.Callable, error) {
	exportsValue := vm.Get("exports")
	if exportsValue == nil || goja.IsUndefined(exportsValue) || goja.IsNull(exportsValue) {
		return nil, fmt.Errorf("%w: exports is not defined", ErrActionNotFound)
	}
	exports := exportsValue.ToObject(vm)
	actionsValue := exports.Get("actions")
	if actionsValue == nil || goja.IsUndefined(actionsValue) || goja.IsNull(actionsValue) {
		return nil, fmt.Errorf("%w: exports.actions is not defined", ErrActionNotFound)
	}
	actionValue := actionsValue.ToObject(vm).Get(name)
	if fn, ok := goja.AssertFunction(actionValue); ok {
		return fn, nil
	}
	return nil, fmt.Errorf("%w: %s", ErrActionNotFound, name)
}

func NormalizeActionResult(value any) (*ActionResult, error) {
	if value == nil {
		return &ActionResult{OK: true}, nil
	}
	if b, ok := value.(bool); ok {
		return &ActionResult{OK: b}, nil
	}
	m, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%w: action returned %T", ErrInvalidAction, value)
	}
	result := &ActionResult{OK: boolFromMap(m, "ok", true)}
	result.Refresh = boolFromMap(m, "refresh", false)
	result.Toast = stringFromMap(m, "toast", "")
	result.Patch = mapFromMap(m, "patch")
	result.Data = mapFromMap(m, "data")
	if _, err := json.Marshal(result); err != nil {
		return nil, fmt.Errorf("%w: action result is not JSON serializable: %v", ErrInvalidAction, err)
	}
	return result, nil
}

func NormalizePageResult(defaultID string, value any) (*PageResult, error) {
	m, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%w: page function returned %T", ErrInvalidPage, value)
	}

	if rootValue, ok := m["root"]; ok {
		root, ok := rootValue.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%w: root must be a widget node object", ErrInvalidPage)
		}
		id := stringFromMap(m, "id", defaultID)
		title := stringFromMap(m, "title", id)
		schemaVersion := stringFromMap(m, "schemaVersion", widgetschema.Version)
		return &PageResult{SchemaVersion: schemaVersion, ID: id, Title: title, Root: root, Meta: mapFromMap(m, "meta")}, nil
	}

	if looksLikeWidgetNode(m) {
		return &PageResult{SchemaVersion: widgetschema.Version, ID: defaultID, Title: defaultID, Root: m}, nil
	}

	return nil, fmt.Errorf("%w: page result must contain root or be a widget node", ErrInvalidPage)
}

func ValidatePage(page *PageResult) error {
	if page == nil {
		return fmt.Errorf("%w: nil page", ErrInvalidPage)
	}
	if strings.TrimSpace(page.ID) == "" {
		return fmt.Errorf("%w: id is required", ErrInvalidPage)
	}
	if page.SchemaVersion == "" {
		page.SchemaVersion = widgetschema.Version
	}
	if page.SchemaVersion != widgetschema.Version {
		return fmt.Errorf("%w: unsupported schemaVersion %q", ErrInvalidPage, page.SchemaVersion)
	}
	if page.Root == nil {
		return fmt.Errorf("%w: root is required", ErrInvalidPage)
	}
	if err := ValidateWidgetNode(page.Root); err != nil {
		return err
	}
	if _, err := json.Marshal(page); err != nil {
		return fmt.Errorf("%w: page is not JSON serializable: %v", ErrInvalidPage, err)
	}
	return nil
}

func ValidateWidgetNode(node any) error {
	m, ok := node.(map[string]any)
	if !ok {
		return fmt.Errorf("%w: node must be an object, got %T", ErrInvalidWidgetIR, node)
	}
	kind, ok := m["kind"].(string)
	if !ok || kind == "" {
		return fmt.Errorf("%w: node kind is required", ErrInvalidWidgetIR)
	}
	switch kind {
	case "text":
		if _, ok := m["text"].(string); !ok {
			return fmt.Errorf("%w: text node requires string text", ErrInvalidWidgetIR)
		}
	case "element":
		if tag, ok := m["tag"].(string); !ok || strings.TrimSpace(tag) == "" {
			return fmt.Errorf("%w: element node requires tag", ErrInvalidWidgetIR)
		}
		if err := validateChildren(m["children"]); err != nil {
			return err
		}
	case "component":
		if typ, ok := m["type"].(string); !ok || strings.TrimSpace(typ) == "" {
			return fmt.Errorf("%w: component node requires type", ErrInvalidWidgetIR)
		}
		if err := validateChildren(m["children"]); err != nil {
			return err
		}
	default:
		return fmt.Errorf("%w: unsupported node kind %q", ErrInvalidWidgetIR, kind)
	}
	return nil
}

func validateChildren(value any) error {
	if value == nil {
		return nil
	}
	children, ok := value.([]any)
	if !ok {
		return fmt.Errorf("%w: children must be an array", ErrInvalidWidgetIR)
	}
	for i, child := range children {
		if err := ValidateWidgetNode(child); err != nil {
			return fmt.Errorf("child %d: %w", i, err)
		}
	}
	return nil
}

func actionContextMap(name string, req ActionRequest) map[string]any {
	m := map[string]any{"action": name}
	if req.Context != nil {
		for key, value := range req.Context {
			m[key] = value
		}
	}
	return m
}

func pageContextMap(ctx PageContext) map[string]any {
	m := map[string]any{"pageId": ctx.PageID}
	if ctx.Query != nil {
		m["query"] = ctx.Query
	}
	if ctx.User != nil {
		m["user"] = ctx.User
	}
	if ctx.Data != nil {
		m["data"] = ctx.Data
	}
	return m
}

func scriptFiles(dirs []string) ([]string, error) {
	var files []string
	for _, dir := range dirs {
		dir = strings.TrimSpace(dir)
		if dir == "" {
			continue
		}
		if err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() {
				return nil
			}
			if strings.EqualFold(filepath.Ext(path), ".js") {
				files = append(files, path)
			}
			return nil
		}); err != nil {
			return nil, fmt.Errorf("scan scripts dir %s: %w", dir, err)
		}
	}
	sort.Strings(files)
	return files, nil
}

func stringFromMap(m map[string]any, key, fallback string) string {
	value, ok := m[key]
	if !ok || value == nil {
		return fallback
	}
	s := strings.TrimSpace(fmt.Sprint(value))
	if s == "" {
		return fallback
	}
	return s
}

func boolFromMap(m map[string]any, key string, fallback bool) bool {
	value, ok := m[key]
	if !ok || value == nil {
		return fallback
	}
	b, ok := value.(bool)
	if !ok {
		return fallback
	}
	return b
}

func mapFromMap(m map[string]any, key string) map[string]any {
	value, ok := m[key]
	if !ok || value == nil {
		return nil
	}
	out, _ := value.(map[string]any)
	return out
}

func looksLikeWidgetNode(m map[string]any) bool {
	kind, _ := m["kind"].(string)
	return kind == "text" || kind == "element" || kind == "component"
}

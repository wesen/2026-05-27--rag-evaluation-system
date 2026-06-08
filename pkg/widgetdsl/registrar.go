package widgetdsl

import (
	"github.com/dop251/goja_nodejs/require"
	"github.com/go-go-golems/go-go-goja/pkg/engine"
)

// Registrar registers widget.dsl with a go-go-goja engine runtime.
//
// Use this when composing a runtime through engine.NewRuntimeFactoryBuilder(). It registers
// both the canonical module name, require("widget.dsl"), and the shorter
// domain-friendly alias, require("rag.dsl").
type Registrar struct{}

var _ engine.RuntimeModuleRegistrar = (*Registrar)(nil)

func NewRegistrar() *Registrar { return &Registrar{} }

func (r *Registrar) ID() string { return "widget-dsl" }

func (r *Registrar) RegisterRuntimeModule(_ *engine.RuntimeModuleRegistrationContext, reg *require.Registry) error {
	Register(reg)
	return nil
}

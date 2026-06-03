# Changelog

## 2026-06-02

- Initial workspace created


## 2026-06-02

Made Geppetto usable from the generic xgoja RAG experiment binary by passing RuntimeOwner through go-go-goja ModuleContext and making Geppetto HostServices optional; validated module-probe, top-docs, doc-title, and chunk-preview.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/provider/provider.go — Host-optional provider logic
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/pkg/xgoja/providerapi/module.go — RuntimeOwner field


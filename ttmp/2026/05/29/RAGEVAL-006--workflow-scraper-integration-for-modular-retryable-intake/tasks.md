# Tasks

## Done

- [x] Create RAGEVAL-006 ticket workspace.
- [x] Map current rag-eval intake services and scraper workflow architecture.
- [x] Write intern-ready workflow/scraper integration design guide.
- [x] Record investigation diary.

## TODO

- [x] Relate key rag-eval and scraper files to the design document.
- [x] Validate ticket docs with `docmgr doctor`.
- [x] Upload design package to reMarkable.

## Future implementation phases

- [ ] Phase 0: Validate scraper dependency/version compatibility and custom runner spike.
- [ ] Phase 1: Implement Go-native `rag-eval/intake` runner over existing services.
- [ ] Phase 2: Add `rag-eval workflow submit-intake`, worker, status, and ops CLI commands.
- [ ] Phase 3: Add `document_processing_artifacts` schema and document preprocessing service.
- [ ] Phase 4: Add chunk enrichment service over `chunk_enrichments`.
- [ ] Phase 5: Run bounded fake-provider workflow smoke, then explicit live-provider smoke.
- [ ] Phase 6: Add workflow artifact/coverage visibility to API or Corpus Explorer.

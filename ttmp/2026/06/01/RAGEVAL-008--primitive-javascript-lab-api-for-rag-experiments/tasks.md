# Tasks

## Phase 0 — Ticket setup and source capture

- [x] Create RAGEVAL-008 ticket workspace.
- [x] Add design guide document.
- [x] Add implementation diary document.
- [x] Capture `goja-repl help --all` output.
- [x] Capture relevant goja-repl topic pages into `sources/`.
- [x] Inspect go-go-goja native module and async documentation.
- [x] Inspect Geppetto's existing JavaScript module and embeddings package.

## Phase 1 — Design the primitive API

- [x] Define ownership split between Geppetto primitives and rag-eval lab/storage primitives.
- [x] Propose `gp.llm`, `gp.embeddings`, and `gp.rerank` namespaces.
- [x] Propose rag-eval `require("raglab")` workspace/document/store/query/experiment namespaces.
- [x] Document Promise/runtime-owner safety requirements.
- [x] Document TypeScript declaration and example requirements.
- [x] Record risks, open questions, and implementation phases.

## Phase 2 — Geppetto implementation follow-up

- [ ] Verify and fix the documented Geppetto JS harness command.
- [ ] Add or normalize pure Go LLM convenience facade if needed.
- [ ] Add embeddings provider construction from profile/config for JS use.
- [ ] Add `pkg/rerank` with provider interface and deterministic fake provider.
- [ ] Add Geppetto JS adapters for `llm`, `embeddings`, and `rerank`.
- [ ] Add Promise-safe async helper around runtimebridge.
- [ ] Add runtime integration tests for all new Geppetto JS primitives.
- [ ] Add TypeScript declarations and drift checks.
- [ ] Add runnable JS examples.

## Phase 3 — rag-eval lab module follow-up

- [ ] Add pure Go workspace/document/store/query/experiment services for JS lab usage.
- [ ] Add `require("raglab")` native module adapter.
- [ ] Add runtime integration test combining `require("geppetto")` and `require("raglab")`.
- [ ] Add `rag-eval lab run` CLI with scoped workspace/profile/network options.
- [ ] Add fake-provider CI smoke script.
- [ ] Add opt-in bounded live-provider smoke script.

## Phase 4 — Documentation and delivery

- [x] Write intern-friendly design and implementation guide.
- [x] Update implementation diary for source capture and design work.
- [x] Run `docmgr doctor` and fix hygiene issues.
- [x] Upload the guide bundle to reMarkable.
- [x] Commit ticket documentation.

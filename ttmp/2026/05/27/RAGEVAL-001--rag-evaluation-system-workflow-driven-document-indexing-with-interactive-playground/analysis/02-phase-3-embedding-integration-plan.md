---
Title: Phase 3 Embedding Integration Plan
Ticket: RAGEVAL-001
Status: active
Topics:
    - rag
    - embeddings
    - evaluation
    - workflow
    - playground
    - search
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../geppetto/cmd/examples/embedding-profile-smoke/main.go
      Note: Reference implementation for Pinocchio/profile-backed embeddings
    - Path: ../../../../../../../geppetto/pkg/embeddings/embeddings.go
      Note: Provider interface to depend on
    - Path: ../../../../../../../geppetto/pkg/embeddings/settings_factory.go
      Note: Factory for direct/profile-backed provider construction
    - Path: ../../../../../../../geppetto/pkg/embeddings/settings_validation.go
      Note: Embedding profile validation behavior
    - Path: ../../../../../../../geppetto/pkg/steps/ai/settings/settings-inference.go
      Note: InferenceSettings and API key/base URL shape
ExternalSources: []
Summary: Phase 3 plan for integrating Geppetto embeddings and Pinocchio/profile-backed configuration into the RAG Evaluation System.
LastUpdated: 2026-05-27T16:35:00-04:00
WhatFor: Use before implementing embedding provider factory, embedding service, CLI commands, HTTP endpoints, and frontend Embedding Inspector slices.
WhenToUse: At the start of Phase 3 or when reviewing embedding/profile configuration decisions.
---


# Phase 3 Embedding Integration Plan

## Executive summary

Phase 3 should add embeddings without reintroducing the earlier instability. The correct order is:

1. provider/profile resolution with Geppetto and Pinocchio-style profile registries,
2. a testable embedding service that accepts a provider interface,
3. SQLite persistence with `text_hash` staleness checks,
4. bounded batch computation over chunks,
5. Glazed commands and HTTP handlers as thin adapters,
6. frontend inspector only after backend contracts settle.

Do not call live providers in core unit tests. Use fake providers for service tests and keep live OpenAI/Ollama checks as explicit smoke commands.

## Evidence from Geppetto

### Provider interface

`geppetto/pkg/embeddings/embeddings.go` defines the provider contract:

```go
type Provider interface {
    GenerateEmbedding(ctx context.Context, text string) ([]float32, error)
    GenerateBatchEmbeddings(ctx context.Context, texts []string) ([][]float32, error)
    GetModel() EmbeddingModel
}
```

This is a good seam for the RAG system. The service should depend on this interface, not directly on OpenAI/Ollama clients.

### Factory from direct config

`geppetto/pkg/embeddings/settings_factory.go` exposes:

```go
embeddings.NewSettingsFactory(config *config.EmbeddingsConfig).NewProvider(...)
embeddings.NewSettingsFactoryFromInferenceSettings(s *settings.InferenceSettings).NewProvider()
```

The factory supports:

- `openai`, requiring `openai-api-key`,
- `ollama`, using `ollama-base-url` or `http://localhost:11434`,
- cache types `none`, `memory`, `file`.

### Profile-backed settings

`geppetto/cmd/examples/embedding-profile-smoke/main.go` is the best current reference. It:

1. uses `geppetto/pkg/sections.NewProfileSettingsSection`,
2. defaults registry path to `~/.config/pinocchio/profiles.yaml`,
3. resolves `profile` directly when set,
4. otherwise resolves a `base-profile` and overlays embedding config,
5. validates with `embeddings.ValidateInferenceSettingsForEmbeddings`,
6. constructs the provider with `embeddings.NewSettingsFactoryFromInferenceSettings(resolved).NewProvider()`.

### Validation behavior

`geppetto/pkg/embeddings/settings_validation.go` gives user-oriented validation:

- missing inference settings,
- missing `inference_settings.embeddings`,
- missing type/engine,
- missing OpenAI key,
- missing Ollama dimensions,
- unsupported provider types.

The RAG system should call this before provider construction so CLI/API errors are actionable.

## RAG system target design

## New package layout

```text
internal/services/embedding/
  provider.go       # resolves Geppetto providers from direct flags or profile registries
  service.go        # compute/store embeddings for chunks
  service_test.go   # fake-provider SQLite tests
cmd/rag-eval/cmds/embedding/
  root.go
  compute.go
  similarity.go
```

## Provider resolution API

```go
type ProviderConfig struct {
    ProfileRegistries []string
    Profile           string
    BaseProfile       string

    Type       string
    Engine     string
    Dimensions int
    APIKey     string
    BaseURL    string

    CacheType       string
    CacheDirectory  string
    CacheMaxEntries int
    CacheMaxSize    int64
}

func ResolveProvider(ctx context.Context, cfg ProviderConfig) (*ResolvedProvider, error)

type ResolvedProvider struct {
    Provider         embeddings.Provider
    EffectiveProfile string
    ProviderType     string
    Model            embeddings.EmbeddingModel
    Close            func() error
}
```

Resolution rules:

1. If `Profile` is set, resolve it from registries and validate it.
2. Else if `BaseProfile` is set, resolve base profile and overlay embedding flags.
3. Else build direct `settings.InferenceSettings` from flags/env/config.
4. Validate via `embeddings.ValidateInferenceSettingsForEmbeddings`.
5. Construct via `embeddings.NewSettingsFactoryFromInferenceSettings(...).NewProvider()`.

## Embedding service API

```go
type ComputeRequest struct {
    StrategyID string
    Provider   embeddings.Provider
    ProviderType string
    ModelName string
    Dimensions int
    BatchSize int
    Limit int
    Force bool
}

type ComputeResult struct {
    StrategyID string
    ProviderType string
    Model string
    Dimensions int
    Considered int
    Computed int
    SkippedFresh int
}
```

The service should:

1. query chunks by `strategy_id`, ordered by document/chunk index,
2. compute `text_hash` for each chunk text,
3. skip rows whose existing embedding has the same hash unless `Force` is true,
4. batch texts using `BatchSize` with a hard default such as 16 or 32,
5. verify returned vector count and vector dimension,
6. serialize vectors into BLOBs in a deterministic format,
7. upsert into `chunk_embeddings`.

## SQLite requirements

The current `chunk_embeddings` table is close:

```sql
PRIMARY KEY (chunk_id, strategy_id, provider, model, dimensions)
```

But service code should add query helpers:

```go
ListChunksForStrategy(strategyID string, limit int) ([]Chunk, error)
GetChunkEmbeddingHash(chunkID, strategyID, provider, model string, dimensions int) (string, bool, error)
UpsertChunkEmbedding(...)
```

If vectors are stored as raw little-endian float32 BLOBs, add helpers:

```go
EncodeFloat32Vector([]float32) ([]byte, error)
DecodeFloat32Vector([]byte) ([]float32, error)
```

## CLI commands

Start with two Glazed commands:

```text
rag-eval embedding compute \
  --strategy-id fixed-300-50 \
  --embeddings-type ollama \
  --embeddings-engine nomic-embed-text \
  --embeddings-dimensions 768 \
  --batch-size 16 \
  --limit 100 \
  --emit summary

rag-eval embedding similarity \
  --chunk-id A \
  --chunk-id B \
  --strategy-id fixed-300-50 \
  --provider ollama \
  --model nomic-embed-text
```

Output must be bounded by default. Do not print vectors unless explicitly requested with a preview limit.

## HTTP endpoints

Start with:

```http
POST /api/v1/embeddings/compute
POST /api/v1/embeddings/similarity
GET  /api/v1/embeddings/strategies
```

The HTTP compute endpoint should also default to summary output.

## Testing strategy

### Unit/service tests

Use a fake provider:

```go
type fakeProvider struct { dimensions int }
func (f fakeProvider) GenerateBatchEmbeddings(ctx context.Context, texts []string) ([][]float32, error)
```

Test:

1. computes embeddings for chunks,
2. skips fresh embeddings by `text_hash`,
3. recomputes when `Force` is true,
4. rejects dimension mismatch,
5. respects `BatchSize` and `Limit`,
6. upserts without duplicate rows,
7. handles context cancellation.

### Live smoke tests

Live provider checks should be opt-in:

```bash
rag-eval embedding compute --strategy-id fixed-300-50 --embeddings-type ollama --embeddings-engine nomic-embed-text --embeddings-dimensions 768 --limit 5
```

Do not run live OpenAI/Ollama tests in normal CI.

## Frontend first slice

Only after backend contracts exist:

1. show available embedding strategies/models,
2. show embedding coverage per chunking strategy,
3. allow computing embeddings for a limited number of chunks,
4. show vector preview dimensions and text hash freshness,
5. show pairwise similarity for selected chunks.

## Immediate implementation sequence

1. Add provider resolution package with direct config and profile-backed config.
2. Add vector encode/decode helpers and tests.
3. Add DB query helpers for embedding persistence.
4. Add embedding service with fake-provider tests.
5. Add Glazed `embedding compute` command.
6. Add HTTP compute endpoint.
7. Add frontend inspector slice.

## Guardrails

- Never print full vectors by default.
- Always bound batch size and row count.
- Always verify vector dimensions.
- Always use `text_hash` to avoid recomputation.
- Do not make network calls in unit tests.
- Keep CLI and HTTP as adapters over one service.

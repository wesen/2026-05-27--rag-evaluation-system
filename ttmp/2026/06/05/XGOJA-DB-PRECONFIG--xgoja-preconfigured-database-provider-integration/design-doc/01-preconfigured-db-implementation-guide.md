---
Title: Preconfigured DB Implementation Guide
Ticket: ""
Status: active
Topics:
    - xgoja
    - database
    - goja
    - sqlite
    - scripting
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../go-go-goja/modules/database/database.go
      Note: Existing preconfigured DB module primitives and configure disable behavior
    - Path: ../../../../../../../go-go-goja/modules/database/database_test.go
      Note: Existing direct database module tests for preconfigured DB behavior
    - Path: ../../../../../../../go-go-goja/pkg/xgoja/providers/host/host.go
      Note: Host provider config surface for db modules
    - Path: examples/xgoja/widget-site/verbs/sites.js
      Note: RAG generated example JavaScript configure call to remove
    - Path: examples/xgoja/widget-site/xgoja.yaml
      Note: RAG generated example module config to update
ExternalSources: []
Summary: ""
LastUpdated: 2026-06-05T16:47:00-04:00
WhatFor: ""
WhenToUse: ""
---


# Preconfigured DB Implementation Guide

## Executive summary

The xgoja widget-site demo currently configures its SQLite database from JavaScript with `db.configure("sqlite3", ":memory:")`. That is useful for demos, but the production-oriented xgoja host-provider model should let the generated binary configure the database before JavaScript starts. JavaScript should then receive a ready-to-use `db` module and should not be able to reconfigure it at runtime.

The current go-go-goja checkout already contains most of the required lower-level database module support: `modules/database` has `WithPreconfiguredDB`, `WithConfigureEnabled`, `WithCloseFn`, and tests proving a preconfigured module rejects `configure()`. The host provider also already exposes `driverName` and `dataSourceName` fields in `DatabaseConfig`. This ticket turns that partial/current state into a documented, tested, integrated workflow for the RAG xgoja widget-site example.

## Problem statement

A generated xgoja binary should own host capabilities. Database connection setup is a host capability because it controls file paths, driver choice, credentials, lifecycle, and operational policy. If JavaScript calls `db.configure(driverName, dataSourceName)`, every script that can require `db` can also decide which database to open.

The desired shape is:

```yaml
modules:
  - package: go-go-goja-host
    name: db
    as: db
    config:
      driverName: sqlite3
      dataSourceName: ':memory:'
```

The JavaScript then uses the module directly:

```js
const db = require("db")
db.exec("CREATE TABLE queries (...)")
const rows = db.query("SELECT * FROM queries")
```

It should not call:

```js
db.configure("sqlite3", ":memory:")
```

and, when preconfigured, that call should fail with an explicit error.

## Current-state evidence

### `modules/database` already supports preconfigured DBs

Relevant path:

```text
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/database/database.go
```

Important API:

```go
func WithPreconfiguredDB(db QueryExecer) Option {
    return func(m *DBModule) {
        if m == nil || db == nil {
            return
        }
        m.queryExecer = db
        m.allowConfigure = false
    }
}

func WithConfigureEnabled(enabled bool) Option {
    return func(m *DBModule) {
        if m == nil {
            return
        }
        m.allowConfigure = enabled
    }
}
```

Existing tests in `modules/database/database_test.go` already cover direct module behavior:

- `TestPreconfiguredModuleRequireByName`
- `TestPreconfiguredModuleRejectsConfigure`
- context propagation tests for preconfigured DBs

### Host provider config already contains preconfigured fields

Relevant path:

```text
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/pkg/xgoja/providers/host/host.go
```

Current shape:

```go
type DatabaseConfig struct {
    AllowConfigure bool   `json:"allowConfigure"`
    DriverName     string `json:"driverName,omitempty"`
    DataSourceName string `json:"dataSourceName,omitempty"`
}
```

The provider's `databaseModuleFromConfig` currently maps config to a DB module:

```go
if driverName == "" && dataSourceName == "" {
    return dbm.New(dbm.WithName(name), dbm.WithConfigureEnabled(cfg.AllowConfigure)), nil
}
if driverName == "" || dataSourceName == "" {
    return nil, fmt.Errorf("database config requires both driverName and dataSourceName for preconfigured modules")
}
db, err := sql.Open(driverName, dataSourceName)
return dbm.New(dbm.WithName(name), dbm.WithPreconfiguredDB(db), dbm.WithCloseFn(db.Close)), nil
```

This means the likely implementation work is not to invent the API from scratch, but to harden host-provider tests, docs, and the RAG example integration.

### RAG xgoja example still uses JavaScript-side configure

Relevant path:

```text
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/examples/xgoja/widget-site
```

Current `xgoja.yaml`:

```yaml
  - package: go-go-goja-host
    name: db
    as: db
    config:
      allowConfigure: true
```

Current `verbs/sites.js`:

```js
const db = require("db")
db.configure("sqlite3", ":memory:")
```

## Proposed solution

1. Add host-provider-level tests in go-go-goja proving that xgoja module config with `driverName` and `dataSourceName` produces a require-able DB module.
2. Add a host-provider-level test proving that `db.configure()` fails when preconfigured.
3. Add host-provider-level validation tests for partial preconfiguration, e.g. `driverName` without `dataSourceName`.
4. Update host provider documentation to describe:
   - `allowConfigure: true` for script-owned demo setup,
   - `driverName` + `dataSourceName` for preconfigured DBs,
   - that preconfigured DBs disable JavaScript `configure()` even if `allowConfigure` is also true.
5. Update RAG `examples/xgoja/widget-site/xgoja.yaml` to preconfigure SQLite.
6. Remove `db.configure("sqlite3", ":memory:")` from `verbs/sites.js`.
7. Run focused go-go-goja tests, RAG xgoja generated-site smoke, devctl smoke, and a browser action smoke.

## Design decisions

### Decision: host config owns production DB setup

- **Context:** JavaScript-side `db.configure` is convenient but gives scripts control over host DB connection setup.
- **Options:** Keep JS configure; hide configure entirely; allow config-driven preconfiguration with explicit demo escape hatch.
- **Decision:** Use config-driven preconfiguration for the xgoja widget-site example while preserving `allowConfigure: true` for scripts that intentionally own demo DB setup.
- **Rationale:** This keeps xgoja's host-capability model explicit without removing useful prototyping behavior.
- **Consequences:** Production examples become safer. Tests must cover both modes.
- **Status:** Accepted for this ticket.

### Decision: do not add a JavaScript compatibility shim

- **Context:** The current demo calls `db.configure` in JS.
- **Decision:** Remove the JS call rather than no-oping it.
- **Rationale:** If the DB is preconfigured, script authors should learn the production pattern: require and use the module, do not configure it.
- **Consequences:** A script that calls `configure()` in preconfigured mode fails early.
- **Status:** Accepted.

### Decision: use SQLite `:memory:` for the example preconfigured DSN

- **Context:** The current demo is intentionally in-memory and self-contained.
- **Decision:** Keep `sqlite3` + `:memory:` in `xgoja.yaml`.
- **Rationale:** This preserves demo behavior while moving ownership into generated-binary config.
- **Consequences:** Every process run gets a fresh database, which is correct for the smoke/demo.
- **Status:** Accepted.

## Implementation plan

### Step 1: Audit and guide

- Create this ticket and implementation guide.
- Relate go-go-goja and RAG example files.
- Record that base support already exists in the current go-go-goja checkout.

### Step 2: Host provider tests/docs in go-go-goja

Files likely to change:

```text
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/pkg/xgoja/providers/host/host_test.go
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/pkg/xgoja/providers/host/doc.go
```

Expected tests:

- preconfigured `db` module can `query`/`exec` without JS `configure`,
- preconfigured `db` module rejects JS `configure`,
- partial `driverName`/`dataSourceName` config returns a setup error,
- default config without `allowConfigure` still disables configure unless explicitly allowed.

Validation:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja
go test ./modules/database ./pkg/xgoja/providers/host -count=1
```

Commit in go-go-goja:

```text
xgoja host: test preconfigured database config
```

### Step 3: RAG xgoja example integration

Files likely to change:

```text
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/examples/xgoja/widget-site/xgoja.yaml
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/examples/xgoja/widget-site/verbs/sites.js
```

Change config:

```yaml
  - package: go-go-goja-host
    name: db
    as: db
    config:
      driverName: sqlite3
      dataSourceName: ':memory:'
```

Remove JavaScript configure:

```diff
-  db.configure("sqlite3", ":memory:")
```

Validation:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system
make -C examples/xgoja/widget-site smoke
cd examples/xgoja/widget-site && devctl smoke --timeout 10m
```

Browser smoke:

- open `/pages/actions`,
- verify shell/default UI renders,
- click `Add query`,
- verify refreshed rows and audit trail,
- verify console warnings/errors are zero.

Commit in RAG repo:

```text
Use preconfigured DB in xgoja widget site
```

## Testing and validation strategy

| Layer | Validation |
|---|---|
| database module | Existing direct preconfigured DB tests. |
| host provider | New config-driven preconfigured DB tests. |
| generated xgoja build | `make -C examples/xgoja/widget-site smoke`. |
| devctl workflow | `cd examples/xgoja/widget-site && devctl smoke --timeout 10m`. |
| browser | Pi Playwright action smoke with console warning/error check. |
| docs | `docmgr doctor --ticket XGOJA-DB-PRECONFIG --stale-after 30`. |

## Risks and review notes

- `sql.Open` does not prove a DSN is reachable until first query/exec. Tests should execute SQL after requiring the module.
- SQLite `:memory:` is per connection. This demo initializes the schema in the same module connection, so it is safe. If future code opens multiple DB handles, in-memory state will not be shared.
- If `allowConfigure: true` is combined with `driverName`/`dataSourceName`, preconfiguration should still win and disable JS configure. This should be documented and tested.
- Generated xgoja builds use local replacements; validation must keep using `--xgoja-replace` for the workspace-local go-go-goja checkout.

## References

- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/database/database.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/database/database_test.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/pkg/xgoja/providers/host/host.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/examples/xgoja/widget-site/xgoja.yaml`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/examples/xgoja/widget-site/verbs/sites.js`

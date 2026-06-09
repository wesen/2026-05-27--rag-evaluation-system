---
Title: Investigation diary
Ticket: RAGEVAL-STORYBOOK-DEPLOY
Status: active
Topics:
    - storybook
    - deployment
    - kubernetes
    - static-sites
    - rag-evaluation
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-05-27--rag-evaluation-system/ttmp/2026/06/09/RAGEVAL-STORYBOOK-DEPLOY--deploy-rag-evaluation-site-storybook-to-hetzner-k3s/design-doc/01-intern-guide-deploy-rag-evaluation-site-storybook-to-hetzner-k3s.md
      Note: Primary design guide produced in this investigation
ExternalSources: []
Summary: Chronological diary for the rag-evaluation-site Storybook deployment design work.
LastUpdated: 2026-06-09T20:59:15-04:00
WhatFor: Use this to understand how the deployment guide was researched, what evidence was inspected, and what remains to implement.
WhenToUse: Before continuing implementation of the Storybook deployment ticket.
---


# Diary

## Goal

This diary records the evidence-gathering and documentation work for deploying the `packages/rag-evaluation-site` Storybook to the Hetzner K3s static-sites platform. It is meant to make the next implementation step easy to resume without re-discovering which Storybook, which deployment pattern, or which repos are involved.

## Step 1: Create ticket and write deployment design guide

I created a new docmgr ticket under the requested `2026-05-27--rag-evaluation-system/ttmp` root and wrote a detailed intern-oriented deployment guide. The guide focuses on the package-local Storybook in `packages/rag-evaluation-site/`, not any parent or app Storybook, and maps it onto the existing K3s static-site release model.

The main outcome is a concrete implementation plan covering source repo workflow files, static artifact Docker packaging, `deploy/gitops-targets.json`, K3s GitOps manifests, Vault roles/policies, bootstrap commands, validation steps, and common failure modes.

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr in 2026-05-27--rag-evaluation-system/ttmp with `docmgr --root 2026-05-27--rag-evaluation-system/ttmp ...` to deploy the storybook to ~/code/wesen/2026-03-27--hetzner-k3s/ (using potentially ~/code/wesen/go-go-golems/infra-tooling/) . Story book is in @2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/ (not the parent one). 

Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a new docmgr ticket in the RAG Evaluation System `ttmp` tree, investigate the package-local Storybook and the K3s static-site deployment pattern, write a detailed design/implementation guide for an intern, and upload the result to reMarkable.

**Inferred user intent:** Produce a complete, technically precise handoff document so a junior engineer can safely implement the Storybook deployment through existing infra rather than guessing from scattered repos.

**Commit (code):** N/A — documentation-only work in docmgr ticket workspace.

### What I did

- Created ticket `RAGEVAL-STORYBOOK-DEPLOY` with:
  - `docmgr --root 2026-05-27--rag-evaluation-system/ttmp ticket create-ticket --ticket RAGEVAL-STORYBOOK-DEPLOY --title "Deploy rag-evaluation-site Storybook to Hetzner K3s" --topics storybook,deployment,kubernetes,static-sites,rag-evaluation`
- Added the primary design document:
  - `docmgr --root 2026-05-27--rag-evaluation-system/ttmp doc add --ticket RAGEVAL-STORYBOOK-DEPLOY --doc-type design-doc --title "Intern Guide: Deploy rag-evaluation-site Storybook to Hetzner K3s"`
- Added this diary document:
  - `docmgr --root 2026-05-27--rag-evaluation-system/ttmp doc add --ticket RAGEVAL-STORYBOOK-DEPLOY --doc-type reference --title "Investigation diary"`
- Inspected the package-local Storybook files:
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/package.json`
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/.storybook/main.ts`
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/vite.config.ts`
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/vite.app.config.ts`
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/index.ts`
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx`
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/README.md`
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/GUIDELINES.md`
- Inspected the K3s static-site deployment reference implementation:
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/docs/static-site-packaging-and-gitops-playbook.md`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/gitops/kustomize/static-sites-host/caddy-config.yaml`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/gitops/kustomize/dmeta-examples/publish-job.yaml`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/gitops/kustomize/dmeta-examples/kustomization.yaml`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/gitops/kustomize/dmeta-examples/ingress.yaml`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/gitops/applications/dmeta-examples.yaml`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/vault/policies/github-actions/dmeta-gitops-pr.hcl`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/vault/roles/github-actions/dmeta-gitops-pr.json`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/vault/policies/kubernetes/dmeta-examples.hcl`
  - `/home/manuel/code/wesen/2026-03-27--hetzner-k3s/vault/roles/kubernetes/dmeta-examples.json`
- Inspected infra-tooling handoff machinery:
  - `/home/manuel/code/wesen/go-go-golems/infra-tooling/.github/workflows/publish-ghcr-image.yml`
  - `/home/manuel/code/wesen/go-go-golems/infra-tooling/actions/open-gitops-pr/action.yml`
  - `/home/manuel/code/wesen/go-go-golems/infra-tooling/docs/platform/source-repo-to-gitops-pr.md`
- Wrote the design guide at:
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/ttmp/2026/06/09/RAGEVAL-STORYBOOK-DEPLOY--deploy-rag-evaluation-site-storybook-to-hetzner-k3s/design-doc/01-intern-guide-deploy-rag-evaluation-site-storybook-to-hetzner-k3s.md`

### Why

- The user asked for a guide that a new intern can follow, so the document needed both high-level system explanation and copy/paste-ready implementation details.
- The user explicitly warned that the Storybook is in `packages/rag-evaluation-site/`, so the guide repeatedly distinguishes package Storybook from parent/app build outputs.
- The existing K3s static-sites model already solves static hosting, TLS, GitOps handoff, and immutable release promotion; reusing it is safer than inventing a new Storybook-specific server.

### What worked

- `docmgr --root 2026-05-27--rag-evaluation-system/ttmp status --summary-only` confirmed the requested docs root exists and contains existing RAG Evaluation System tickets.
- The package files clearly identify `build-storybook`, `.storybook/main.ts`, and the package ownership boundary.
- The K3s repo contains a complete static-site reference (`dmeta-examples`) and a detailed static-site playbook.
- The infra-tooling reusable workflow and action already support the needed `static-publisher-job` patch strategy.

### What didn't work

- Looking for `../2026-05-27--rag-evaluation-system` from the current working directory failed:
  - command context: `ls -la ../2026-05-27--rag-evaluation-system`
  - error: `ls: cannot access '../2026-05-27--rag-evaluation-system': No such file or directory`
- I found the requested relative tree under the current repository instead:
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system`
- I also found other copies under `/home/manuel/code/wesen/2026-05-27--rag-evaluation-system` and older workspace paths, but used the relative path requested by the user for docmgr operations.

### What I learned

- The source repo has no root `package.json` in this worktree, but it does have `pnpm-workspace.yaml` listing `web` and `packages/rag-evaluation-site`.
- The package has distinct outputs: `dist/` for npm, `app-dist/` for the default Vite app, and `storybook-static/` for Storybook.
- The K3s `static-sites-host` Caddy config uses the request hostname as part of the content path, so Ingress host and publisher Job host must match exactly.
- The infra-tooling static publisher patch strategy exists specifically because Kubernetes Jobs are immutable and the release token appears in several fields.

### What was tricky to build

- The main tricky part was preventing ambiguity between similarly named front-end targets. The source tree contains package code, a `web` workspace, `dist`, `app-dist`, and Storybook. The guide addresses this by making `pnpm --dir packages/rag-evaluation-site build-storybook` the core invariant and by explicitly saying not to deploy `dist/`, `app-dist/`, or a parent Storybook.
- Another tricky part was the cross-repo credential boundary. The source workflow publishes a GHCR image using `GITHUB_TOKEN`, but opening a PR against the K3s GitOps repo requires a separate GitOps credential obtained through Vault OIDC. The guide separates these credentials and documents both Vault policy/role paths.
- The static publisher Job also has a subtle immutability invariant: all `sha-*` tokens must change together. The guide explains the failure mode and prescribes `patch_strategy: static-publisher-job`.

### What warrants a second pair of eyes

- Confirm the final public hostname. The guide uses `rag-evaluation-storybook.yolo.scapegoat.dev` as a concrete proposal.
- Confirm the actual GitHub repository owner/name for the source workflow before finalizing Vault `bound_claims`. The package metadata says `go-go-golems/rag-evaluation-system`.
- Confirm whether the GHCR package will be public or private. The guide includes image-pull secret wiring for the safer private-package case.
- Confirm the CI package-manager install command. The guide proposes `pnpm install --frozen-lockfile` from the source repo root.

### What should be done in the future

- Implement the source repo files described in the guide.
- Implement the K3s GitOps and Vault files described in the guide.
- Run the local Storybook and Docker validations.
- Bootstrap Vault secrets and apply the first Argo CD Application after the first real `sha-*` image exists.

### Code review instructions

- Start with the design guide:
  - `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/ttmp/2026/06/09/RAGEVAL-STORYBOOK-DEPLOY--deploy-rag-evaluation-site-storybook-to-hetzner-k3s/design-doc/01-intern-guide-deploy-rag-evaluation-site-storybook-to-hetzner-k3s.md`
- Then inspect the source evidence files listed in its References section.
- Validate docmgr state with:
  - `docmgr --root 2026-05-27--rag-evaluation-system/ttmp doc list --ticket RAGEVAL-STORYBOOK-DEPLOY`
  - `docmgr --root 2026-05-27--rag-evaluation-system/ttmp doctor --ticket RAGEVAL-STORYBOOK-DEPLOY --stale-after 30`
- When implementation begins, validate source changes with:
  - `pnpm --dir packages/rag-evaluation-site typecheck`
  - `pnpm --dir packages/rag-evaluation-site build-storybook`
  - `docker build -f Dockerfile.storybook-static -t rag-evaluation-storybook:test .`
- Validate K3s changes with:
  - `kubectl kustomize gitops/kustomize/rag-evaluation-storybook`

### Technical details

Key design conclusion:

```text
Use packages/rag-evaluation-site Storybook as a static artifact.
Package storybook-static as /site in GHCR.
Use infra-tooling publish-ghcr-image.yml and open-gitops-pr.
Use static-publisher-job patch strategy.
Serve through K3s static-sites-host.
```

Primary generated document:

```text
/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/ttmp/2026/06/09/RAGEVAL-STORYBOOK-DEPLOY--deploy-rag-evaluation-site-storybook-to-hetzner-k3s/design-doc/01-intern-guide-deploy-rag-evaluation-site-storybook-to-hetzner-k3s.md
```

## Step 2: Expand implementation tasks into phased execution plan

I converted the ticket's simple completed checklist into a phased implementation plan. The phases now separate source packaging, source CI/GitOps handoff, K3s static-site manifests, K3s Vault wiring, and final documentation/upload work so the deployment can be implemented and reviewed in focused commits.

This planning step intentionally happened before source or cluster files changed. That makes the ticket useful as a live runbook: each phase has a small set of acceptance criteria, and later diary entries can refer back to the phase being executed.

### Prompt Context

**User prompt (verbatim):** "ok ,add detailed tasks to the ticket's tasks, goruped into different phases, and then execute them in order, committing at appropriate intervals, keeping a frequent diary all along. (we're going to reuse the diary to make it a playbook on how to package storybook for deployment)."

**Assistant interpretation:** Expand the ticket into detailed phased tasks, then implement the deployment in order with focused commits and frequent diary entries that can later become a Storybook deployment playbook.

**Inferred user intent:** Turn the initial design guide into an executable implementation trail, preserving the reasoning and command outcomes so future Storybook deployments can reuse the diary as a procedural playbook.

**Commit (code):** pending — planning-only ticket documentation update.

### What I did
- Rewrote `tasks.md` with phases 0 through 5.
- Kept completed initial design/upload tasks in Phase 0.
- Added source repo packaging tasks for Docker artifact creation and local validation.
- Added source repo CI/GitOps handoff tasks for the infra-tooling workflow and target metadata.
- Added K3s manifest tasks for static-site resources and Argo CD Application wiring.
- Added K3s Vault tasks for image-pull and GitOps PR credential access.
- Added final documentation, doctor, reMarkable upload, and changelog tasks.

### Why
- The implementation touches two Git repositories and a docmgr ticket, so phases reduce the chance of mixing unrelated concerns in one commit.
- The future playbook needs the order of operations, not just the final files.
- The phase structure mirrors the deployment contract boundaries: source artifact, GitOps handoff, cluster manifests, credentials, and delivery docs.

### What worked
- The existing task file was small, so replacing it with a structured phase plan was straightforward.
- The design guide already contained enough detail to derive implementation tasks without another investigation pass.

### What didn't work
- N/A.

### What I learned
- Planning commits are useful here because they preserve the implementation intent before generated validation artifacts or cluster manifests appear.

### What was tricky to build
- The main subtlety was avoiding a task list that says only “deploy Storybook.” The actionable phases need to encode where each contract lives: source repo, infra-tooling API boundary, K3s GitOps repo, and Vault. I split the work along those boundaries so each later commit can be reviewed independently.

### What warrants a second pair of eyes
- Confirm the phase order before any live rollout. In particular, the K3s publisher Job can be committed with a placeholder for render validation, but it should not be applied to the cluster until a real GHCR `sha-*` image exists.

### What should be done in the future
- Execute Phase 1 next: add the static artifact Docker contract, ignore generated Storybook output, and validate package-local Storybook build plus local Docker packaging.

### Code review instructions
- Review `tasks.md` first to confirm the phase boundaries.
- Then review subsequent diary entries and commits phase-by-phase.

### Technical details
- Ticket task file: `/home/manuel/workspaces/2026-06-07/club-meetup-site/2026-05-27--rag-evaluation-system/ttmp/2026/06/09/RAGEVAL-STORYBOOK-DEPLOY--deploy-rag-evaluation-site-storybook-to-hetzner-k3s/tasks.md`

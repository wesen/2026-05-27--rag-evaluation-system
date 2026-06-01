# Tasks

## Phase 0 — Source capture

- [x] Create ticket workspace for npm trusted publishing migration and token lockdown.
- [x] Add npm/publishing/security topics to docmgr vocabulary.
- [x] Capture npm Trusted Publishers documentation with Defuddle.
- [x] Capture npm `npm trust` CLI documentation with Defuddle.
- [x] Capture npm 2FA and disallow-token package setting documentation with Defuddle.
- [x] Capture npm provenance documentation with Defuddle.
- [x] Capture npm CI/CD token fallback documentation with Defuddle.
- [x] Capture GitHub/npm trusted publishing and token-security changelog context with Defuddle.
- [x] Add source README with document purpose and working conclusion.

## Phase 1 — Audit current packages and workflows

- [ ] Identify all npm packages owned by Manuel that should use trusted publishing.
- [ ] For each package, record npm package name, GitHub owner/repo, workflow filename, and optional GitHub environment.
- [ ] Inspect current GitHub Actions workflows for `NODE_AUTH_TOKEN`, `NPM_TOKEN`, `--provenance`, and `id-token: write`.
- [ ] Identify packages currently configured with granular tokens or bypass-2FA token publishing.

## Phase 2 — Configure trusted publishing safely

- [ ] Upgrade local/admin npm CLI to a version supporting `npm trust` commands if CLI automation is used.
- [ ] Configure trusted publishers package-by-package, using either npmjs.com or `npm trust github`.
- [ ] Verify OIDC publish or staged publish works without npm tokens.
- [ ] Set package Publishing access to `Require two-factor authentication and disallow tokens` after verification.
- [ ] Revoke obsolete npm automation tokens and remove GitHub secrets.

## Phase 3 — Write playbook

- [ ] Write a repeatable migration playbook for all packages.
- [ ] Include a package inventory table.
- [ ] Include rollback and failure diagnosis notes for common OIDC mismatch errors.

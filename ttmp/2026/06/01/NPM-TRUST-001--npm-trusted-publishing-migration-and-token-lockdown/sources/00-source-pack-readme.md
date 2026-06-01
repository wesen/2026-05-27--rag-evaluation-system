---
Title: Source Pack - npm Trusted Publishing and Token Lockdown
Ticket: NPM-TRUST-001
Status: active
Topics:
    - npm
    - publishing
    - security
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Index of Defuddle-captured source documents for npm trusted publishing migration."
LastUpdated: 2026-06-01T15:12:00-04:00
WhatFor: "Quick map of source captures and the migration conclusion they support."
WhenToUse: "Use before writing the npm trusted publishing migration playbook."
---

# Source Pack: npm Trusted Publishing and Token Lockdown

Captured with `defuddle parse <url> --md` on 2026-06-01.

## npm official documentation

1. `01-npm-trusted-publishers.md`
   - URL: https://docs.npmjs.com/trusted-publishers/
   - Why it matters: canonical trusted publishing setup, GitHub Actions OIDC workflow shape, and the recommendation to switch package Publishing access to `Require two-factor authentication and disallow tokens` after trusted publishing works.

2. `02-npm-trust-cli.md`
   - URL: https://docs.npmjs.com/cli/v11/commands/npm-trust/
   - Why it matters: command-line management for trusted publishers, including `npm trust github`, `npm trust list`, and `npm trust revoke`; useful for bulk setup across many packages.

3. `03-npm-requiring-2fa-and-disallow-tokens.md`
   - URL: https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/
   - Why it matters: explains the two package Publishing access modes and confirms that `Require two-factor authentication and disallow tokens` blocks granular access tokens regardless of bypass-2FA settings.

4. `04-npm-generating-provenance-statements.md`
   - URL: https://docs.npmjs.com/generating-provenance-statements/
   - Why it matters: explains provenance; notes that trusted publishing automatically generates provenance attestations without requiring `--provenance`.

5. `05-npm-ci-cd-private-packages.md`
   - URL: https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow/
   - Why it matters: contrasts trusted publishing with token fallback for CI/CD, useful for packages or registries where trusted publishing is not available.

## GitHub/npm security changelogs

6. `06-github-changelog-npm-trusted-publishing-ga.md`
   - URL: https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/
   - Why it matters: announcement and context for npm trusted publishing with OIDC.

7. `07-github-changelog-npm-token-security-changes.md`
   - URL: https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management/
   - Why it matters: broader token lifetime/security changes that motivate migrating away from long-lived publish tokens.

8. `08-github-changelog-npm-granular-token-changes.md`
   - URL: https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/
   - Why it matters: follow-up changes around classic and granular tokens.

## Working conclusion from these sources

The safe migration order is:

1. Ensure each package has a working GitHub Actions release workflow with `permissions: id-token: write`, npm CLI `>=11.5.1` for trusted publishing, and Node `>=22.14.0`.
2. Configure one trusted publisher per npm package, matching owner/repo/workflow filename and optional GitHub environment exactly.
3. Verify a publish or staged publish works without `NODE_AUTH_TOKEN` / `NPM_TOKEN`.
4. Only then set package Publishing access to `Require two-factor authentication and disallow tokens`.
5. Revoke obsolete npm automation tokens and remove secrets from GitHub.

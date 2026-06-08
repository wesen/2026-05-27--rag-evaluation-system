# npm Release Playbook: `@go-go-golems/rag-evaluation-site`

Use this when publishing a new `packages/rag-evaluation-site` version to npmjs. Publishing is manual through GitHub Actions Trusted Publishing; a normal `git push` does **not** publish to npm.

## 1. Pick and bump the version

Check the currently published version:

```bash
npm view @go-go-golems/rag-evaluation-site version
npm view @go-go-golems/rag-evaluation-site dist-tags --json
```

Bump `packages/rag-evaluation-site/package.json` to the next semver version, for example:

```json
"version": "0.1.2"
```

## 2. Validate locally

```bash
pnpm --dir packages/rag-evaluation-site typecheck
pnpm --dir packages/rag-evaluation-site build
pnpm --dir packages/rag-evaluation-site consumer:smoke
```

Confirm the generated publish artifact has the new version:

```bash
node -p "JSON.parse(require('fs').readFileSync('packages/rag-evaluation-site/dist/package.json','utf8')).version"
```

## 3. Commit and push the bump

```bash
git add packages/rag-evaluation-site/package.json
git commit -m "chore(npm): bump rag evaluation site to X.Y.Z"
git push origin HEAD:main
```

## 4. Optional dry run

Use `skip_existing=true` for the normal safe dry run. If the version already exists, the workflow exits successfully without calling `npm publish`.

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/rag-evaluation-system \
  -f npm_tag=latest \
  -f dry_run=true \
  -f skip_existing=true

gh run list --repo go-go-golems/rag-evaluation-system --workflow publish-npm.yml --limit 5
gh run watch --repo go-go-golems/rag-evaluation-system
```

## 5. Real publish

Only publish after the version bump is on `main` and the local validation passed.

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/rag-evaluation-system \
  -f npm_tag=latest \
  -f dry_run=false \
  -f skip_existing=true \
  -f confirm_latest_publish=CONFIRM_LATEST

gh run list --repo go-go-golems/rag-evaluation-system --workflow publish-npm.yml --limit 5
gh run watch --repo go-go-golems/rag-evaluation-system
```

The workflow publishes from `packages/rag-evaluation-site/dist` using npm Trusted Publishing (`id-token: write`, environment `npm-production`) and signs provenance with `npm publish --provenance`.

## 6. Verify npm

```bash
npm view @go-go-golems/rag-evaluation-site@X.Y.Z version
npm view @go-go-golems/rag-evaluation-site dist-tags --json
```

Expected for a latest publish:

```json
{
  "latest": "X.Y.Z"
}
```

## Troubleshooting

- `You cannot publish over the previously published versions`: bump `packages/rag-evaluation-site/package.json`; npm versions are immutable.
- Workflow skips publish: `skip_existing=true` found the version already on npm.
- Real `latest` publish fails validation: pass `confirm_latest_publish=CONFIRM_LATEST` exactly.
- Trusted Publishing failure: confirm npm trusted publisher is configured for package `@go-go-golems/rag-evaluation-site`, repo `go-go-golems/rag-evaluation-system`, workflow `publish-npm.yml`, environment `npm-production`.

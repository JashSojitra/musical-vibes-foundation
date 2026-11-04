# Cloudflare deployment readiness and operations

Reviewed 2026-11-04. Selected stack: **Next.js 16.4.5 + OpenNext Cloudflare 1.20.16 + Wrangler 4.157.0**. The approved design, routes, animations and Journal-to-Gallery projection remain intact. Only OpenNext is present in the committed production toolchain. See [migration evidence and adapter comparison](NEXT16-MIGRATION.md).

**Locally validated; live staging approval remains outstanding.** No Worker has been uploaded/deployed, no DNS or existing hosting settings changed, and no Sanity project configured. The committed workflow has not yet executed on GitHub. A local build or workerd preview is not proof of production readiness.

## Repeatable local verification

Use a supported Node 22/24 release; Node 24 LTS is the CI track. Local verification used Node 24.14.1 and npm 11.11.0. Update to a maintained Node patch before operating CI or production tooling; do not use unsupported global tooling. OpenNext emits a native-Windows support warning: prefer Linux CI or WSL for release builds.

```powershell
npm ci
npm run lint
npm run typecheck
npm audit --omit=dev
npm audit --audit-level=high
npm run cf:build
npm run test:workers
npx wrangler deploy --env production --dry-run --outdir .tmp/worker-dry-run
```

`cf:build` runs the actual Next production build and generates `.open-next/worker.js` plus `.open-next/assets`. `test:workers` starts the local Worker on port 3002 automatically and runs all 100 collected cases (97 pass and three legacy non-desktop WebGL cases intentionally skip), then stops the server it owns. It can reuse a manually started local preview outside CI. For manual browser review: `npm run cf:preview -- --env staging --port 3002`. Stop competing servers before rebuilding and never rebuild `.next` underneath a running `next start` verification session.

`npm run build` / `npm run start` still provide the ordinary Next.js production path. Generated bundles, captures, reports, tool state and secret files remain ignored. Run `node scripts/audit-repository.mjs` before publication; it scans tracked text and reachable history for credential patterns and oversized files without printing credential values.

## Worker configuration

`wrangler.jsonc` pins compatibility date **2026-11-03**, enables `nodejs_compat`, declares ASSETS and IMAGES, and defines separate explicit `staging` / `production` Worker names. It declares no domains/routes and creates no D1, R2, KV or Durable Objects. New version preview URLs are disabled. Named environments repeat non-inherited bindings. Always pass the environment explicitly to deployment commands.

The local dry run read 149 static assets and bundled roughly 1,149 KiB gzip of Worker code. This does not measure global startup/CPU limits or confirm account entitlements. Check the intended Cloudflare account's Workers plan and Images availability/billing before the first staging deployment. No account ID is guessed or committed.

### Cache and image delivery

- `open-next.config.ts` uses the read-only **Workers Static Assets incremental cache** for build-time local content. Dynamic Gallery queries and Contact render on the Worker. No shared mutable cache is required today. This cache does **not** support ISR or on-demand content invalidation; content changes require a new build/deployment. [OpenNext caching reference](https://opennext.js.org/cloudflare/caching).
- `public/_headers` applies a one-year immutable policy only to hashed `/_next/static/*` assets. Editable public photography/fonts retain normal revalidation behavior. Do not add an HTML-wide CDN cache rule: Gallery query variants and RSC responses must stay distinct.
- IMAGES supplies responsive `next/image` transformations on Workers; the local 640px resize and unsupported quality rejection were tested. Keep the existing `[75, 85]` allowlist. Do not enable unrestricted remote origins, SVG execution or private-IP fetches. Validate real Images responses/costs in staging; Node `sharp` is not the production Worker optimizer. [Official image integration](https://opennext.js.org/cloudflare/howtos/image).
- Retain asset IDs and consent/provenance records. Read-only cache assets belong to a Worker version; withdraw content by deploying corrected data promptly. For future rights revocation or live CMS content, use the Sanity strategy below rather than assuming a build-time asset can be revalidated.

## Environment and secrets

| Name / binding               | Where it belongs                                              | Purpose                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ASSETS`, `IMAGES`           | Wrangler bindings, repeated for named environments            | Static files / responsive image transforms; no hand-written API keys.                                                                                 |
| `DEPLOYMENT_ENV`             | Non-secret Wrangler var                                       | Environment label for future operational use. The current app does not use it as a security boundary or change its production metadata.               |
| `CLOUDFLARE_ACCOUNT_ID`      | GitHub environment secret or local operator environment       | Explicit destination account.                                                                                                                         |
| `CLOUDFLARE_API_TOKEN`       | GitHub environment secret or local operator secret store      | Least-privilege deployment token for the intended account; never a `NEXT_PUBLIC_` variable or remote URL credential.                                  |
| Future Sanity identifiers    | Build/runtime public config only when integration is approved | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, pinned `NEXT_PUBLIC_SANITY_API_VERSION`. Not required or read today.                   |
| Future Sanity tokens/secrets | Server-only host secrets, separately for staging/production   | `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, optional authenticated-preview secret. A migration write token must never enter website runtime. |

The existing typed content requires no runtime credentials. No `.env` values are committed. Local `.env.local` / `.dev.vars*` remain ignored. GitHub deployment secrets are injected only into the final deployment step, after build/test approval; install and PR validation receive none. Limit Cloudflare tokens to required Workers/account permissions, and add permissions only for actual configured bindings. Do not introduce a database merely to satisfy a template.

## GitHub workflow and staging strategy

The configured origin was verified read-only as [JashSojitra/musical-vibes-foundation](https://github.com/JashSojitra/musical-vibes-foundation). Remote `main` and local `main` both resolve to the migration baseline `c228711d5e02363f68d2c52156fdf68adfd5cac0`. No push is performed by this task. After review, recheck remote history before publishing the migration branch; never force-push or replace unexpected history.

```powershell
git remote -v
git ls-remote origin
# After review, publish the migration branch for Linux CI and PR review.
git push --set-upstream origin migration/next16-cloudflare
```

The files prepare GitHub Actions integration, not account-side settings:

1. `validate.yml` runs on PRs and main/migration pushes: Linux Node 24, `npm ci`, lint, types, audits, OpenNext build and the actual Workers browser suite. Artifacts last 14 days. Official Actions are SHA-pinned; weekly Dependabot proposals cover npm and Action updates.
2. Before enabling deployment, create GitHub environments **staging** and **production**, require independent production approval and restrict permitted branches to reviewed `main`. Configure separate least-privilege deployment secrets. Require the validation status for merging; no automated dependency merging.
3. `deploy.yml` runs **only** through manual dispatch from the intended repository's `main`, with an explicit environment. It invokes validation, then rebuilds/retests before exposing credentials to the final deploy step. It does not deploy on push or PR. Merge/review alone never deploys.
4. Use the staging Worker on `workers.dev`; protect it with Cloudflare Access before sharing it publicly. Apply `X-Robots-Tag: noindex, nofollow` through the staging access/response policy before public preview use. Current production canonicals/robots are intentionally preserved, so merely selecting `--env staging` does **not** make a public preview private or non-indexable. These account-side policies have not been configured by this task.
5. After Linux CI passes, approve a staging deployment, then run the same full tests against its real HTTPS URL using `VERIFY_BASE_URL` and `VERIFICATION_TARGET=opennext` with `playwright.migration.config.ts`. Inspect desktop/mobile screenshots, image headers, cold/warm SSR, 404s, contact mailto states, errors and CPU usage. Use a short-lived authenticated test path where Access is enabled; never commit an Access token.
6. Approve production on `workers.dev` only after staging evidence is reviewed. Attaching the existing domain and any DNS or hosting changes require separate approval. This configuration does not attach a domain.

## Rollback and monitoring

Keep the previous known-good Worker version ID, Git SHA and lockfile with every release. Workers observability is enabled with 10% request sampling and private source-map upload; the initial low-traffic sampling rate can be raised after reviewing costs. Use the Cloudflare dashboard to inspect exceptions, HTTP 5xx, CPU/subrequest limits and traffic changes; configure owner alerts/uptime checks before launch. Do not log contact messages, tokens or full sensitive query strings. The current Contact form intentionally prepares a mailto draft; it does not claim to send/store messages.

This config reports Worker-side activity. It does not install a third-party browser exception collector; select one separately if production client-error reporting is required. Browser console/hydration errors were checked locally during the migration.

```powershell
npx wrangler deployments list --env production
npm run cf:tail -- --env production
# On a confirmed regression, choose a previously verified version ID:
npx wrangler rollback <KNOWN_GOOD_VERSION_ID> --env production --message "Restore verified release"
```

These are future operator commands, not executed here. Recheck routes, images, sitemap and console after rollback. Rollback is operational only after a first known-good version exists. No database migrations or external cache contents need reversing today. Do not attempt to roll back secrets or future CMS data solely by changing Worker code; manage those independently.

## Future Sanity webhook/revalidation boundary

Keep the one-source Journal-to-Gallery adapter. No duplicated Gallery documents or SQL store are needed. The exact schemas/environment/migration checklist remains in [Sanity preparation](SANITY-INTEGRATION-CHECKLIST.md).

At integration time, choose one tested freshness strategy before adding webhooks:

- Initially prefer server-only published-perspective, **uncached SSR reads** (`cache: no-store`) for live Journal/Gallery/Events/home projections and sitemap. This avoids a distributed cache dependency while preserving immediate publication/withdrawal. Prove those routes actually become dynamic; do not continue serving build-time notes by accident. Authenticate previews separately and validate signed webhook requests without exposing a write token.
- If static content remains build-driven, a signed webhook can trigger an approved rebuild/deployment; document the delay, rate limiting and withdrawal expectations. This is not immediate tag revalidation.
- Introduce persistent ISR/tag/queue infrastructure only if its measured requirement justifies it. The current read-only cache cannot fulfill `revalidateTag` / `revalidatePath` promises. Select and test the adapter's supported cache/tag/queue combination, invalidating old/new slugs, media approval changes, Journal, Gallery, Events, homepage and sitemap. Do not add D1/R2/KV now for a future possibility.

Before calling the site production-ready: pass remote Linux CI, configure account/environment protections and Images, validate a real staging deployment under the intended plan, review media permissions, configure monitoring, and approve launch separately. None is substituted by the successful local preview.

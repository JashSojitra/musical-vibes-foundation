# Cloudflare deployment readiness and operations

Reviewed 2026-11-04. Selected stack: **Next.js 16.4.5 + OpenNext Cloudflare 1.20.16 + Wrangler 4.157.0**. The approved design, routes, animations and Journal-to-Gallery projection remain intact. Only OpenNext is present in the committed production toolchain. See [migration evidence and adapter comparison](NEXT16-MIGRATION.md).

**Live staging approval remains outstanding.** No Worker has been uploaded/deployed, no DNS or existing hosting settings changed, and no Sanity project configured by this work. The migration baseline `e7d7683` passed [Linux GitHub CI](https://github.com/JashSojitra/musical-vibes-foundation/actions/runs/41783105319). The current CI/staging follow-up must also pass its branch check. A local build or workerd preview is not proof of production readiness. Follow [the protected staging launch handoff](STAGING-LAUNCH.md) for the current workflow, exact manual setup and smoke checklist.

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

`cf:build` runs the actual Next production build and generates `.open-next/worker.js` plus `.open-next/assets`. For protected staging use `cf:build:staging`, which copies generated output to `.open-next-staging` before adding staging policies. Set `WORKER_CONFIG=wrangler.staging.jsonc` for `test:workers`: it starts the local Worker on port 3002, runs the complete suite including staging headers, then stops the server it owns. It can reuse a manually started local preview outside CI. For manual browser review use `npm run cf:preview:staging -- --port 3002`. Stop competing servers before rebuilding and never rebuild `.next` underneath a running `next start` verification session.

`npm run build` / `npm run start` still provide the ordinary Next.js production path. Generated bundles, captures, reports, tool state and secret files remain ignored. Run `node scripts/audit-repository.mjs` before publication; it scans tracked text and reachable history for credential patterns and oversized files without printing credential values.

## Worker configuration

`wrangler.jsonc` retains the ordinary production target. Staging is now in **`wrangler.staging.jsonc`**, containing only the staging Worker, an explicitly empty routes list and no production environment/account. Both pin compatibility date **2026-11-03**, enable `nodejs_compat`, and declare ASSETS and IMAGES without D1/R2/KV/Durable Objects. Preview URLs are disabled. The staging-only workflow cannot select production. Use staging-only credentials and a dedicated staging account as documented in the handoff; configuration alone is not an account authorization boundary.

The local dry run read 149 static assets and bundled roughly 1,149 KiB gzip of Worker code. This does not measure global startup/CPU limits or confirm account entitlements. Check the intended Cloudflare account's Workers plan and Images availability/billing before the first staging deployment. No account ID is guessed or committed.

### Cache and image delivery

- `open-next.config.ts` uses the read-only **Workers Static Assets incremental cache** for build-time local content. Dynamic Gallery queries and Contact render on the Worker. No shared mutable cache is required today. This cache does **not** support ISR or on-demand content invalidation; content changes require a new build/deployment. [OpenNext caching reference](https://opennext.js.org/cloudflare/caching).
- `public/_headers` applies a one-year immutable policy only to hashed `/_next/static/*` assets. Editable public photography/fonts retain normal revalidation behavior. Do not add an HTML-wide CDN cache rule: Gallery query variants and RSC responses must stay distinct.
- IMAGES supplies responsive `next/image` transformations on Workers; the local 640px resize and unsupported quality rejection were tested. Keep the existing `[75, 85]` allowlist. Do not enable unrestricted remote origins, SVG execution or private-IP fetches. Validate real Images responses/costs in staging; Node `sharp` is not the production Worker optimizer. [Official image integration](https://opennext.js.org/cloudflare/howtos/image).
- Retain asset IDs and consent/provenance records. Read-only cache assets belong to a Worker version; withdraw content by deploying corrected data promptly. For future rights revocation or live CMS content, use the Sanity strategy below rather than assuming a build-time asset can be revalidated.

## Environment and secrets

| Name / binding                  | Where it belongs                                              | Purpose                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ASSETS`, `IMAGES`              | Wrangler bindings, repeated for named environments            | Static files / responsive image transforms; no hand-written API keys.                                                                                 |
| `DEPLOYMENT_ENV`                | Non-secret Wrangler var                                       | Environment label for future operational use. The current app does not use it as a security boundary or change its production metadata.               |
| `CLOUDFLARE_STAGING_ACCOUNT_ID` | GitHub `staging` environment secret                           | Dedicated staging account; mapped to `CLOUDFLARE_ACCOUNT_ID` only in the deployment step.                                                             |
| `CLOUDFLARE_STAGING_API_TOKEN`  | GitHub `staging` environment secret                           | Staging-only token; mapped to `CLOUDFLARE_API_TOKEN` only in the deployment step. No production token is referenced.                                  |
| Future Sanity identifiers       | Build/runtime public config only when integration is approved | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, pinned `NEXT_PUBLIC_SANITY_API_VERSION`. Not required or read today.                   |
| Future Sanity tokens/secrets    | Server-only host secrets, separately for staging/production   | `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, optional authenticated-preview secret. A migration write token must never enter website runtime. |

The existing typed content requires no runtime credentials. No `.env` values are committed. Local `.env.local` / `.dev.vars*` remain ignored. GitHub deployment secrets are injected only into the final deployment step, after build/test approval; install and PR validation receive none. Limit Cloudflare tokens to required Workers/account permissions, and add permissions only for actual configured bindings. Do not introduce a database merely to satisfy a template.

## GitHub workflow and staging strategy

The configured origin was verified as [JashSojitra/musical-vibes-foundation](https://github.com/JashSojitra/musical-vibes-foundation). Remote `main` and local `main` remain at `c228711d5e02363f68d2c52156fdf68adfd5cac0`; the migration is published separately. Recheck remote history before publishing updates; never force-push or replace unexpected history. This CI preparation authorizes pushing the migration branch only, with no merge or deployment.

```powershell
git remote -v
git ls-remote origin
# After review, publish the migration branch for Linux CI and PR review.
git push --set-upstream origin migration/next16-cloudflare
```

The files prepare GitHub Actions integration, not account-side settings:

1. `validate.yml` runs on PRs targeting `main` and main/migration pushes: Linux Node 24, clean install, actionlint/config checks, lint, types, audits, native production build/OpenNext staging bundle, and the real Workers browser suite. JSON/HTML reports, screenshots and failure traces last 14 days. CI has no environment or production secrets.
2. The **staging** GitHub environment has been created with owner approval and main-only deployments. Manually disable administrator bypass, add the two staging-only secrets, and protect `main` with the **Linux CI** check. No Cloudflare account or credentials were created by this task.
3. `deploy.yml` offers **staging only** through manual dispatch from this repository's `main`. It validates and retests before its final credential-bearing deploy step. No push, PR, merge or CI success automatically deploys.
4. In a dedicated staging Cloudflare account, protect all Workers' traffic with Access before first creation. The staging entry point/assets add noindex and security headers; the production design, content and metadata remain unchanged. Cloudflare Access remains manual; GitHub reviewers were configured separately via the repository API.
5. After owner review/merge and successful main CI, manually dispatch staging and complete the [launch and smoke checklist](STAGING-LAUNCH.md). Authenticated remote Playwright checks can read an ignored local `PLAYWRIGHT_STORAGE_STATE` file; regular CI never needs it.
6. Production launch, its credentials, custom-domain attachment and DNS/hosting changes remain a separate future authorization. There is no production deployment option in this workflow.

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

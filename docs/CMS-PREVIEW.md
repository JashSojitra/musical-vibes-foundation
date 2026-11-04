# Isolated Sanity CMS preview

The only deployment target prepared here is **`musical-vibes-foundation-cms-preview`**, on `*.workers.dev`. It uses `wrangler.cms-preview.jsonc`, a dedicated entry point, and `.open-next-cms-preview/`. The existing `musical-vibes-foundation-demo` configuration/entry point and production domain are unchanged. No deployment or Sanity content/permission change was performed during implementation.

## Build and runtime configuration

The builder pins the same public values as the Worker configuration:

```text
CONTENT_SOURCE=sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=6jpdhhxg
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-11-01
```

No read, preview, write or migration token is needed or configured. Reads use the published perspective and bypass persistent content caches. The builder creates a clean, allowlisted source mirror under `.tmp/cms-preview-build/`, installs from the existing lockfile and builds Next.js/OpenNext there. It does not copy `.env*`, Studio state, credentials or dataset backups. It strips Sanity/Cloudflare credential variables from the child build environment. The final deployable bundle is `.open-next-cms-preview/`; ordinary `.next`, `.open-next` and `.open-next-demo` outputs are not replaced by this builder. Do not run two CMS-preview builds simultaneously.

The preview retains the logo and neutral missing-image SVG, but does not upload the local curated/original photo archive. Website media must come from approved, publicly enabled Sanity records. Public uploads remain public at their source URL; withdrawing website approval does not revoke a downloaded image.

Detail routes explicitly use request-time rendering so newly published slugs work in workerd. This corrects a runtime failure where on-demand static generation conflicted with uncached CMS reads. The local adapter still serves the same routes/content. Styling, SVG icons, GSAP and Three.js are unchanged.

The preview sends `X-Robots-Tag: noindex, nofollow`, security headers, and `Cache-Control: no-store` on dynamic responses. Static assets receive noindex/security headers too. Existing canonical URLs, Open Graph metadata, structured data and sitemap URLs still refer to the configured foundation website, not a new preview domain. The sitemap nevertheless reflects current published CMS routes. No webhook or cache-invalidation infrastructure is required.

## Validate locally (no deployment)

From `feat/sanity-cms`, using Node 24:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:cms
npm run cf:build:cms-preview
npm run cf:validate:cms-preview
npm run cf:dry-run:cms-preview
npm run test:cms-preview
npm run test:cms-preview:live
npm run cf:preview:cms-preview
```

The final command serves the real public CMS locally at `http://localhost:3012`. It is not a Cloudflare deployment. `cf:dry-run:cms-preview` invokes Wrangler with `--dry-run`; it reports the exact target and public bindings without uploading.

`test:cms-preview` runs the actual bundled Worker in local workerd with a **test-only outbound Sanity fixture**, at desktop and phone sizes. It changes only in-memory test responses to exercise publication, edit/rename/history redirects, unpublication, approved/withdrawn images, safe fallbacks, dynamic program/event/article routes, SSR, SEO, sitemap, shared Gallery collections and empty CMS pages. The harness is outside the deployment allowlist and is never shipped. It rejects authenticated or non-query Sanity requests. These tests do not create or edit Content Lake documents.

For optional read-only checks against the real public dataset after a dry run:

```bash
node scripts/cms-preview-test-server.mjs --live
```

This serves at `http://127.0.0.1:3014`, allows only tokenless published Sanity queries, and has no test-state update endpoint. It is a local verification harness, not the deploy command. Where approved Sanity photos exist, use the regular Wrangler preview on port 3012 to check actual CDN/Images delivery.

At preparation time the public dataset contained only the Site Settings singleton, with **no published programs, events, Journal entries or approved photos**. An empty Journal/Gallery and neutral photo placeholders are expected until the owner publishes content in the hosted Studio. Live article/CDN-image checks therefore require owner-published content; do not mistake fixture tests for a real Studio round trip.

## Launch manually through GitHub Actions

The existing repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are used only in the deployment step. They are not Worker bindings and are not given to the build or tests. No credential scope or account permissions are changed. If the existing token cannot create this distinct Worker, deployment must fail; do not change the target to the demo or broaden credentials automatically.

A new workflow cannot be manually dispatched from a feature-only file until registered on the default branch. Therefore the already-registered **`deploy.yml`** accepts an explicit CMS-preview confirmation on `feat/sanity-cms`, and delegates to the separate `deploy-cms-preview.yml` reusable workflow. The existing main-only demo jobs retain their target and commands; they are skipped on the CMS branch. The CMS jobs refuse other branches/repositories and use separate concurrency groups. GitHub's branch selector does not always refresh default-branch input fields, so use the exact CLI command below. See [GitHub manual workflow guidance](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

After reviewing this branch, run **only when you intend to deploy**:

```bash
gh workflow run deploy.yml \
  --repo JashSojitra/musical-vibes-foundation \
  --ref feat/sanity-cms \
  -f cms_preview=musical-vibes-foundation-cms-preview
gh run list --repo JashSojitra/musical-vibes-foundation --workflow deploy.yml --branch feat/sanity-cms --limit 5
gh run watch RUN_ID --repo JashSojitra/musical-vibes-foundation
```

The workflow runs lint, types, CMS tests, the isolated Next/OpenNext build, artifact validation, a Wrangler dry run, fixture workerd/browser tests and public read-only Wrangler smoke checks before the explicit deploy step. A branch push runs validation only. It does not deploy. Nothing needs merging into main to use the registered dispatch entry point with `--ref`. Supplying a CMS confirmation on the wrong branch cannot fall through to the demo jobs: they require main with a blank CMS input.

The preview URL is printed in the deployment logs, normally `https://musical-vibes-foundation-cms-preview.<account-subdomain>.workers.dev`. No DNS records or custom domain routes are configured (`routes: []`). The existing demo URL is not changed.

Alternatively, after the local validation sequence, set only the existing scoped Cloudflare credentials and an explicit confirmation in your local shell:

```powershell
$env:CLOUDFLARE_API_TOKEN = '<existing scoped token>'
$env:CLOUDFLARE_ACCOUNT_ID = '<existing account ID>'
$env:CMS_PREVIEW_CONFIRM = 'musical-vibes-foundation-cms-preview'
npm run cf:deploy:cms-preview
```

Do not paste actual credentials into Git, Studio content or chat. The guarded runner accepts no target/route/environment overrides. It checks the fixed config, public vars, wrapper hash and full bundle hash; stale/modified artifacts fail validation. Use the published command instead of constructing a raw Wrangler command with `--name`/`--env` overrides. No command above was executed in deployment mode during preparation.

## Owner checklist after deployment

These are manual Studio actions for the owner, **not automated by the build or test scripts**:

1. Check the existing demo URL still works. Open the new CMS preview and verify noindex headers, navigation, responsive layout, reduced motion and browser console. Confirm the current CMS state is shown, including empty states where appropriate.
2. Publish a Program and Event with accurate information. Confirm their new detail URLs return 200, unknown slugs return 404, and the sitemap includes only published routes.
3. Reuse or upload a permitted public photograph in Studio. Keep consent evidence private. Publish alt text/caption, editorial approval `approved`, and public visibility enabled. A pending/disabled/broken photo must remain absent or use the neutral placeholder.
4. Publish an event-related Journal story, selecting the Event reference and ordered photo references. Refresh the preview: verify article text is present in server HTML, the homepage/index preview updates, and Gallery automatically shows the same story title/photos. Follow Journal → Gallery → Journal links. Events must use the same dynamic Gallery preview.
5. Edit the title/body and reorder or remove photos; publish. Refresh Journal, Gallery, Events, homepage and sitemap. Confirm no duplicate photo or collection record is needed.
6. Copy the old slug into Previous addresses, change the story slug and publish. Confirm a 308 redirect from the old URL, the new canonical/SEO metadata, updated sitemap/related links, and the unchanged stable Gallery collection ID.
7. Revoke approval or public visibility on the photo and publish that change. Refresh every usage: the photo must disappear or be replaced with the safe placeholder. An empty derived collection must disappear, while the article text remains readable.
8. Unpublish the story. Confirm article/old-slug URLs no longer expose it, homepage/index/sitemap links disappear, and its derived Gallery collection is gone. Intentionally standalone-approved photos may remain in the standalone archive. Re-publish and repeat checks.
9. Check future publication dates, standalone Gallery, missing references and all-photo withdrawal. Test on actual iPhone/Android devices as well as desktop; emulation is not a replacement for physical-device testing.
10. Recheck the existing public demo. Do not promote this preview to the domain or deploy the existing demo as part of this checklist. A future production cutover needs separate authorization.

No preview-specific Studio permission changes or CORS additions are required for server-side public reads. The hosted Studio continues using its existing managed authentication and origins.

## Preparation validation results

- Lint and TypeScript: pass.
- Existing CMS adapter/SDK tests plus preview target/route/credential/workflow safety checks: **11 passed**.
- Isolated production Next.js and OpenNext build, CMS mode: pass. CMS detail routes render on request.
- Fixed-target artifact verification and Wrangler deployment **dry run**: pass; only public Sanity vars and Assets/Images bindings are configured.
- CMS fixture tests in actual local workerd, desktop and mobile: **4 passed**. Covers SSR HTML, new article/program/event slugs, 404s, approved CDN images through Images, SEO/canonical/structured data/sitemap, browser rename navigation and crawler 308 redirect, stable shared Gallery collection, approval withdrawal, placeholders, unpublication and empty CMS.
- Real Wrangler/public-dataset read-only smoke tests: **2 passed**, desktop and mobile. The main pages, sitemap and safe assets work with the current settings-only dataset, noindex/no-store headers and no local archive photos.
- Local-content demo rebuilt and tested without deployment: **113 passed, 3 intentional non-desktop WebGL skips**. Demo headers, routes, imagery, Journal/Gallery, SVG icons, motion and reduced-motion flows remain functional. Demo config/entry point/build script and the production config were not changed.
- Checksum-verified actionlint **1.7.12** and existing demo CI/asset safety checks: pass.

Early failures in the local harness were corrected for the installed Miniflare API and asset routing. Its HTTP bridge now preserves redirects rather than following them before the test client receives them. The real dynamic-detail-route failure discovered during these tests was fixed in the application, and Journal redirects are also resolved during metadata generation. Final results above are from passing reruns.

No Cloudflare upload/deploy was executed, and no Studio publishing/permissions test was performed automatically. The actual edge preview URL, live owner-published photographs and full Studio-to-edge mutation cycle remain post-deployment checks. Windows OpenNext builds emit the platform's standard Windows warning; Linux CI runs the same build/test commands. Read-only smoke tests on Windows and desktop/mobile emulation do not replace the eventual edge and physical-device checks.

Generated logs are in ignored `.tmp/cms-preview-*.log`; fixture/live browser reports are in ignored `docs/validation/cms-preview/`. The pre-existing untracked `sanity-backup.tar.gz` was left untouched and is excluded from the source mirror and commit.

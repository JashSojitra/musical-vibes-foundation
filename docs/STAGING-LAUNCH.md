# Protected Cloudflare staging — owner handoff

Repository: [JashSojitra/musical-vibes-foundation](https://github.com/JashSojitra/musical-vibes-foundation). Stack stays Next.js 16.4.5 / OpenNext 1.20.16. These instructions prepare a future staging launch; no deploy, merge, DNS change, Sanity configuration or account provisioning is performed by the preparation commit.

## What is prepared

- `validate.yml`: pushes to `main` and `migration/**`, plus PRs targeting `main`; Ubuntu, Node 24, `npm ci`, pinned/checksummed actionlint, staging safety checks, lint, types, audits, the normal production build through OpenNext, and the complete browser suite in local workerd. CI requires no Cloudflare, Sanity or production secrets. Playwright installs Chromium and Linux system dependencies. JSON/HTML reports, screenshots and failure traces are retained for 14 days.
- `deploy.yml`: **manual staging only**, from this repository's `main`, after the reusable validation job. GitHub environment `staging` gates the deployment job. Only the final deployment step receives staging credentials. There is no production selector, production credential reference or automatic deployment on push/PR.
- `wrangler.staging.jsonc`: only `musical-vibes-foundation-staging` on `workers.dev`, no routes/domains, no production account ID, no databases/storage/services. ASSETS and IMAGES are the only bindings. Version preview URLs are disabled. Full request sampling is enabled for staging diagnostics.
- `.open-next-staging/`: separate generated output. A small staging entry point adds noindex, nosniff, frame-denial, referrer and browser permission headers to dynamic/image responses; generated asset `_headers` applies the same policy to static files. The ordinary `.open-next/` output and production website content/styles are unchanged by those policies.

**Cloudflare access control is manual and mandatory before launch.** Noindex and a different Worker name do not make staging private or restrict a token. The GitHub `staging` environment was created separately through the API with owner approval and a main-only branch policy. Cloudflare Access and credentials remain unconfigured. Complete the steps below before dispatching deployment.

## 1. Prepare an isolated Cloudflare account

1. Sign in to the Cloudflare dashboard with MFA. Create/select a **dedicated staging account**, separate from the account that owns the existing production domain/Worker. Do not add, transfer or reconfigure the production zone. Record this staging account's Account ID from its dashboard.
2. In that account, open Workers & Pages and finish the `workers.dev` subdomain setup. The future URL will be `https://musical-vibes-foundation-staging.<YOUR_STAGING_SUBDOMAIN>.workers.dev`. Use the real subdomain shown by Cloudflare; none is guessed in this repository.
3. Review the account's Workers plan/SSR CPU allowances and Images transformation billing. The config declares the IMAGES binding; no photo re-upload, R2 bucket, custom domain or zone rewrite is needed. Local image emulation does not verify account entitlement or production latency. [Images binding setup and billing](https://developers.cloudflare.com/images/optimization/binding/).
4. Enable Zero Trust for **this staging account**. In Workers & Pages → **Protect all Workers** → Enable Access, choose **All traffic**, allow only the owner's/reviewers' verified identities, then Apply Access. This protects newly created Workers before the first application deployment. Do not choose previews-only or an everyone/bypass policy. Do not apply this account-wide policy in the existing production account. [Official Access setup](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).

This separate-account boundary is what prevents staging credentials from changing the existing production resources, even if a future deployment script is misconfigured. No DNS/zone permissions are needed for this launch.

## 2. Create staging authentication

In the staging account, go to **Manage account → Account API tokens → Create Token**. Name it `mvf-staging-ci`, select only the required Workers scope, set an expiry appropriate to your rotation policy, review the summary and create it. Store the value securely; do not paste it into chat, a URL, source files, logs or an npm command. [Account-owned token instructions](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/).

- **First creation:** an account-owned token with **Workers product Admin** in the dedicated staging account can create the new Worker. This is Workers-product access, not unrestricted account administration.
- **After the first successful deployment:** replace/restrict it to **Editor on only `musical-vibes-foundation-staging`** and update the GitHub environment secret. A per-Worker token requires an existing Worker. Do not grant production Worker access, Zone DNS, Workers Routes Write, Access administration or unrelated storage permissions. Cloudflare documents Editor for existing Worker deployments and product Admin for creating a new Worker; attaching domains additionally requires zone route permissions. [Workers roles and scope](https://developers.cloudflare.com/workers/authorization/workers/).
- Use `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` for token-authenticated Wrangler operations. OAuth `wrangler login` does not currently provide granular authorization. [Wrangler token authentication](https://developers.cloudflare.com/workers/authorization/#use-granular-permissions-with-wrangler).

You do not need to authenticate locally to run CI, builds, browser tests or `--dry-run`. The launch workflow authenticates only when its final step receives the staging environment secrets. Do not use the broad legacy “Edit Cloudflare Workers” template unchanged: it can include zone route permissions this setup does not need.

## 3. Finish GitHub protection and add secrets

In this repository → **Settings → Environments → staging**, review the environment already prepared:

1. **Already set:** required reviewer `JashSojitra`, self-review allowed so the sole owner can approve a manual staging launch. You may add another trusted reviewer and enable Prevent self-review later. **Manual action still required:** deselect **Allow administrators to bypass configured protection rules**, then Save protection rules. The API-created environment currently retains GitHub's default administrator bypass setting.
2. **Already set and verified:** Selected branches and tags → **Branch: `main`** only. There is no tag rule or migration branch deployment permission. Do not broaden this restriction to launch staging.
3. Add **environment secrets**, not repository-wide/production secrets (none has been added by this task):

| Environment secret              | Exact value to supply                             |
| ------------------------------- | ------------------------------------------------- |
| `CLOUDFLARE_STAGING_ACCOUNT_ID` | The dedicated staging Account ID from step 1.     |
| `CLOUDFLARE_STAGING_API_TOKEN`  | The staging-only account-owned token from step 2. |

Public repository environments support these controls; GitHub releases environment secrets only after the configured protections pass. [GitHub environment setup](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

In **Settings → Rules → Rulesets** (or branch protection), protect `main`, require a PR and the **Linux CI** check from `validate.yml`, and prevent force pushes. Add review requirements appropriate to the maintainers. These repository settings are not configured by this commit. Ordinary CI has read-only repository permissions and no environment/secret requirement.

## 4. Review, merge yourself, then launch staging

1. Review the migration branch and its successful Linux CI result, then open/review the PR into `main`. **The owner performs any merge**; this preparation task does not merge it.
2. After merge, wait for `main`'s Linux CI check. Confirm all account protections/secrets above are saved. GitHub's manual workflow must exist on the default branch before it can be dispatched; the migration branch push itself never deploys.
3. Open **Actions → Deploy protected staging → Run workflow → Branch: `main`**. There is no production target to select. Approve the waiting `staging` environment job after reviewing the SHA and destination.
4. The job runs validation, rebuilds the staging bundle, installs browser dependencies, tests it, then runs `npm run cf:deploy:staging`. Confirm the log names `musical-vibes-foundation-staging` and the expected account. Save the Git SHA, run URL, Worker version ID and actual staging HTTPS URL.
5. Run the smoke checklist below. Do not attach the production domain, add a DNS record or enable a broad cache rule. If Access, Images, permissions or SSR fail, resolve only the staging-account issue and retest; do not broaden access to production.

## Local commands (no account secrets)

```powershell
npm ci
npm run validate:ci
npm run lint
npm run typecheck
npm run cf:build:staging
$env:WORKER_CONFIG = 'wrangler.staging.jsonc'
npm run test:workers
npx wrangler deploy --config wrangler.staging.jsonc --dry-run --outdir .tmp/staging-dry-run
```

`cf:build:staging` runs `next build` through OpenNext, copies the output into `.open-next-staging`, then adds staging asset headers there. `cf:preview:staging -- --port 3002` opens a manually owned local preview. Local workerd does not enforce the account's remote Access policy. No credentials or Sanity variables are required by the current typed content.

## Post-deployment smoke checklist

Record the SHA, Worker version, time, browser/device, screenshots and results. Use an authorized Access session; test anonymous access separately.

- [ ] **Isolation / protection:** in a private browser window, the staging root, image URL and static JS URL require Access sign-in or deny access. After login, authorized reviewers can load the full site. Verify the Worker has only its staging `workers.dev` URL, no custom domain/route, and the production site's URL/content/DNS is unchanged.
- [ ] **Routes / SEO:** open `/`, `/about`, `/programs`, all six program details, `/events`, all three archived event details, `/journal`, all three Journal articles, `/gallery`, `/get-involved`, `/contact`, `/faq`, `/robots.txt`, `/sitemap.xml`. Direct refresh and client navigation work. Unknown page/program/event/Journal slugs return 404. Titles, descriptions, canonical URLs and sitemap entries remain correct; staging responses have `X-Robots-Tag: noindex, nofollow` even though the approved content's canonical/robots metadata remains production-oriented.
- [ ] **Navigation / responsive layout:** inspect 1440px desktop and 390px mobile. More is last and has no chevron; hover, click/tap, ArrowDown, Tab, Escape, focus return, active highlights and the mobile dialog work. Check browser back/forward and no horizontal scrolling.
- [ ] **Journal → Gallery:** follow an article's photograph link and the Gallery return link. The title, stable collection query ID and photos agree. Alternate two collection URLs, refresh and use back/forward; responses must not share the wrong selection. Unknown collection falls back to the public archive. Draft/unapproved content remains excluded by the existing model tests; Sanity is not connected.
- [ ] **GSAP / Three.js:** observe two different hero animation frames, pause/resume, community-story scrolling, pinned desktop sections and mobile layouts. Change reduced-motion preference and test the no-WebGL fallback. Repeated route navigation must not duplicate canvases or leave stale scroll locks.
- [ ] **Images / fonts:** in Network, inspect successful `/_next/image` responses, responsive `srcset`, dimensions and content types. Request `/_next/image?url=%2Fassets%2Fcurated%2Fcommunity-picnic.webp&w=640&q=75` and confirm a 640px image. `q=81` should return 400. Logo, curated photos and local fonts load without broken placeholders; confirm real IMAGES binding behavior and transformation usage/costs.
- [ ] **Security headers:** inspect authorized HTML, dynamic Gallery/Contact, an image and static asset for noindex, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and the staging Permissions-Policy. No `X-Powered-By` or secret values should appear. Review HTTPS/HSTS as delivered by Cloudflare; the local HTTP preview does not prove transport security. No new CSP is claimed by this change.
- [ ] **Contact:** invalid fields show useful errors/focus; valid data prepares a mailto draft and explicitly says nothing was sent. Do not send the test message. No POST/store/delivery success should be claimed.
- [ ] **Runtime / monitoring:** browser console has no hydration, missing-chunk, shader or unhandled errors. Review staging Worker logs, exceptions, status rates, CPU time, startup latency and limits after cold/warm visits. Sampling is 100% in staging. Keep tokens and contact content out of logs; use the staging dashboard or `wrangler tail --config wrangler.staging.jsonc` with staging-only credentials.
- [ ] **Caching:** hashed `/_next/static/*` files retain a one-year immutable header; HTML/query-specific Gallery results are not cached with an indiscriminate cache-everything rule. Inspect actual image/asset Cache-Control, ETag/304 and any cache-status headers on repeated requests. Local typed content changes on a new build; the read-only static cache does not support live tag/path invalidation. No Sanity webhook freshness is implied.
- [ ] **Rollback evidence:** record a known-good staging Worker version after validation. A later staging regression can be rolled back with `npx wrangler rollback <STAGING_VERSION_ID> --config wrangler.staging.jsonc --message "Restore verified staging"`; then repeat critical checks. Do not run the production rollback command.

### Automated checks behind Access

After staging exists, install the pinned browser (`npx playwright install chromium`). Log in as an approved reviewer using Playwright's interactive browser and save state locally:

```powershell
npx playwright codegen --save-storage=.tmp/staging-auth.json "https://musical-vibes-foundation-staging.<YOUR_STAGING_SUBDOMAIN>.workers.dev"
```

Complete Access sign-in and close the browser. Then run the existing suite against HTTPS without starting a local Worker:

```powershell
$env:VERIFY_BASE_URL = 'https://musical-vibes-foundation-staging.<YOUR_STAGING_SUBDOMAIN>.workers.dev'
$env:VERIFICATION_TARGET = 'opennext'
$env:WORKER_CONFIG = 'wrangler.staging.jsonc'
$env:PLAYWRIGHT_STORAGE_STATE = '.tmp/staging-auth.json'
Remove-Item Env:START_WORKER_PREVIEW -ErrorAction SilentlyContinue
npx playwright test --config playwright.migration.config.ts
```

Do not use `test:workers` for the remote URL: that helper deliberately targets localhost. Saved state and authenticated traces may contain session credentials; keep them in ignored local folders, do not upload them publicly, and discard the state when the review is done. Regular Linux CI uses no Access session and needs no production/staging secrets.

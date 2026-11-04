# Public client demo

Use **Actions → Deploy public demo → Run workflow → main**. The workflow runs the existing Linux checks, builds the approved website, then deploys **`musical-vibes-foundation-demo`** on `workers.dev`. There is no GitHub environment, reviewer approval, Access login, dedicated account requirement or authentication flow. Pushes run CI; they do not deploy automatically.

The existing Next.js 16.4.5 / OpenNext 1.20.16 setup is retained. `wrangler.demo.jsonc` declares no DNS/zone routes or custom domains. Hostinger and the eventual production domain are not changed. The actual demo URL appears in the deployment log and Cloudflare Workers dashboard; its account subdomain cannot be determined without account configuration.

## Finish setup in the dashboards

Cloudflare credentials were absent locally and from GitHub when checked. Deployment stops until you add **two repository secrets**:

1. **Cloudflare dashboard:** select the account you want to use. In **Workers & Pages**, finish its `workers.dev` subdomain setup if prompted, and copy the **Account ID** from the account dashboard. You can use your existing account; do not transfer the production domain or add DNS records. Confirm Workers/Images usage and billing for the demo; IMAGES is declared in the config and needs no photo re-upload or R2 bucket.
2. **Manage account → Account API tokens → Create Token:** create a custom deployment token scoped to this account. Use **Workers Admin at the Workers product scope** to create the new demo Worker; **Editor scoped to the demo Worker** suffices once it exists. Give it no DNS, Zone or Workers Routes permissions and no unrelated account permissions. This is an API deployment credential, not a visitor authentication system. [Cloudflare token setup](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/), [Workers permission requirements](https://developers.cloudflare.com/workers/authorization/workers/).
3. **GitHub → JashSojitra/musical-vibes-foundation → Settings → Secrets and variables → Actions → New repository secret:** add:

   | Secret                  | Value                               |
   | ----------------------- | ----------------------------------- |
   | `CLOUDFLARE_ACCOUNT_ID` | The selected Cloudflare Account ID. |
   | `CLOUDFLARE_API_TOKEN`  | The scoped token from step 2.       |

   Use repository secrets, not the old `staging` environment secrets. Do not paste values into source files, workflow YAML, URLs or chat. CI does not need these values; only the deployment step receives them.

4. Wait for main's CI to pass. Open **Actions → Deploy public demo → Run workflow → main**. No environment approval is requested. After success, open the `workers.dev` URL printed by Wrangler and share it with the client.

No Access setup is needed. If you previously enabled a blanket Access policy in that account, make **only this demo Worker** public using its Access settings; do not disable protection on unrelated applications. The unused GitHub `staging` environment has no effect on this workflow.

## What the demo publishes

The build reads the existing media records and includes only photos marked **published + approved**, plus the authentic logo. Currently that is 12 curated photographs. Unused high-resolution originals are excluded from the upload; source archive files stay in the repository. Journal publication dates/statuses, Gallery projections and all routes remain unchanged. The existing `consent: unconfirmed` provenance field is preserved; editorial approval is not relabelled as a rights/consent verification.

Demo responses and assets retain `noindex, nofollow`, nosniff, frame denial, referrer and browser permission headers. Hashed JS/CSS keep immutable caching; HTML and Gallery queries are not given a blanket cache policy. Cloudflare IMAGES handles responsive transformations. Prerendered cache assets are included in the demo bundle; no D1/R2/KV is introduced. Noindex discourages indexing but does not make the public demo private.

## Local checks and quick client smoke test

```powershell
npm run lint
npm run typecheck
npm run cf:build:demo
npm run validate:ci -- --built
$env:WORKER_CONFIG = 'wrangler.demo.jsonc'
npm run test:workers
npx wrangler deploy --config wrangler.demo.jsonc --dry-run --outdir .tmp/demo-dry-run
```

After deployment, verify in an anonymous browser: homepage; desktop/mobile navigation; all program routes; Journal → Gallery → Journal; images/fonts; moving and paused Three.js sculpture; GSAP scrolling; reduced motion; Contact's honest unsent email draft; 404s; no console/runtime errors; noindex/security headers. Check two different Gallery query URLs to ensure caching preserves the selection. The unused raw archive-photo URL must return 404.

For automated HTTPS checks, set `VERIFY_BASE_URL` to the actual public URL, `VERIFICATION_TARGET=opennext` and `WORKER_CONFIG=wrangler.demo.jsonc`, then run `npx playwright test --config playwright.migration.config.ts`. No saved login or Access token is required. JSON/HTML reports, screenshots and failure traces remain available as CI artifacts for 14 days.

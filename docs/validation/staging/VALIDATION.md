# Historical CI / protected staging preparation validation

This records the retired a7f514e staging setup. Current public-demo instructions are in [DEMO-DEPLOYMENT.md](../../DEMO-DEPLOYMENT.md).

Reviewed 2026-11-04. No deployment, merge, DNS update, Cloudflare account change or Sanity setup was performed. Website source, approved styling and content relationships are unchanged.

## Checks

- Official **actionlint 1.7.12** checked all workflow syntax, expressions and job references successfully. The Windows release ZIP and Linux CI archive are SHA-256 verified against the official release; no application dependency was added.
- `npm run validate:ci` checks secret-free validation CI, a staging-only deployment target, empty routes, allowed bindings and no embedded account ID. `--built` additionally verifies separated asset headers and the packaged prerendered cache. Passed locally.
- `npm run lint`, `npm run typecheck`, and the actual Next.js production build through `npm run cf:build:staging` passed. OpenNext/Wrangler retain their native Windows support warning; Linux CI remains the merge gate.
- The staging Worker suite passed **101 tests with three intentional legacy skips** across 1440, 768, 390 and 360px projects. Four new cases test noindex/security headers on HTML, dynamic routes, images and static assets. Existing cases cover all routes, Journal/Gallery publication logic, navigation, GSAP/Three.js, images, metadata/sitemap, honest Contact states, reduced motion and WebGL fallback.
- After separating output, the adapter's read-only prerender cache was explicitly included in staging ASSETS. Packaging validation confirmed it exists; the ordinary `.open-next/assets/_headers` still equals the original `public/_headers`. Staging noindex/security policies are applied only to `.open-next-staging` and its dedicated entry point.
- After that cache packaging adjustment, 12 focused cases passed across all four viewports: all-route health, Journal/Gallery visitor journeys and staging headers. The upcoming branch CI runs the complete final suite again.
- Final staging dry run: **149 static assets**, **1,149.70 KiB gzip** Worker upload estimate; only ASSETS, IMAGES and the staging label were declared. No network upload/deployment occurred.
- The migration baseline `e7d7683` already passed [Linux CI](https://github.com/JashSojitra/musical-vibes-foundation/actions/runs/41783105319). The new preparation commit must pass independently after its push. See [current validation runs](https://github.com/JashSojitra/musical-vibes-foundation/actions/workflows/validate.yml).
- GitHub environment `staging` was created and read back: `JashSojitra` is the required reviewer, self-review is permitted, and only the `main` branch is eligible. No secret was added. GitHub's default administrator-bypass option remains enabled and is explicitly listed as a manual checkbox to disable before launch.

JSON/HTML reports, screenshots and failure traces remain ignored locally and are configured as 14-day CI artifacts. Authenticated remote state is never required by CI; the optional post-launch test uses an ignored local state file.

## Release boundary

These checks validate repository configuration and local workerd behavior. Cloudflare Access, account/token scope, GitHub reviewers, Images entitlement, HTTPS delivery, runtime limits and live cache behavior require the owner to complete [STAGING-LAUNCH.md](../../STAGING-LAUNCH.md). A different Worker name and noindex alone are not access control. The handoff prescribes a dedicated staging account without the production zone and no production credentials in the pipeline.

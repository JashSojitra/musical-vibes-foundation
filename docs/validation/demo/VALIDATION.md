# Public demo validation

The public demo retains Next.js 16.4.5, OpenNext 1.20.16, the approved design and the Journal-to-Gallery architecture. No source content, photography or CSS was changed.

- Lint, TypeScript, Next production build/OpenNext demo build: passed.
- Official pinned actionlint 1.7.12 and `validate:ci -- --built`: passed. The manually triggered main workflow has no GitHub environment/reviewer gate and uses only the two standard repository secrets in its deployment step.
- Existing browser tests plus demo checks: **105 passed, 3 intentional legacy skips**, across desktop/tablet/mobile/small-mobile.
- Demo headers, responsive image resizing, unavailable-quality rejection, honest Contact behavior, navigation, GSAP/Three.js, reduced motion, routes/metadata and Journal/Gallery relationships passed in local workerd.
- The uploaded photo directory exactly matches the existing published/approved media records: **12 curated photos plus logo**. Unused originals are excluded from generated upload assets without deleting source archive files. A direct request for an unused raw archive photograph returned 404. Consent provenance remains unconfirmed; no rights confirmation was fabricated.
- Noindex/basic security headers, hashed-asset immutable caching and prerendered cache packaging remain intact. The normal build's asset headers are unchanged.
- Dry run: **107 static assets**, approximately **1,149.69 KiB gzip** Worker bundle; only ASSETS, IMAGES and the demo environment label. No upload occurred.
- Cloudflare Account ID/API token were absent from local environment and GitHub repository secrets. No deployment workflow was dispatched, so no working live demo URL is claimed.

Complete [DEMO-DEPLOYMENT.md](../../DEMO-DEPLOYMENT.md): add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as repository secrets, then manually run **Deploy public demo** from main. No Access setup, dedicated account, saved login or approval environment is required. DNS, Hostinger, production domain and Sanity remain unchanged.

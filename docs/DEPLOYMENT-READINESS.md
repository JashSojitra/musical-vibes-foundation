# Public demo deployment

The active deployment is a public client demo on Cloudflare Workers. Use [DEMO-DEPLOYMENT.md](DEMO-DEPLOYMENT.md) for the two repository secrets and exact dashboard steps.

- Next.js 16.4.5 + OpenNext Cloudflare 1.20.16 are retained.
- Manually run **Deploy public demo** from main; checks run automatically, with no environment reviewer approval or visitor login.
- Worker: **musical-vibes-foundation-demo**, configured in wrangler.demo.jsonc. No DNS, Hostinger or production-domain change.
- Only published/approved curated photos plus the authentic logo are included; unused archive assets are excluded.
- Noindex/security headers, responsive IMAGES handling, immutable hashed-asset caching and prerendered cache packaging remain enabled.
- CI requires no Cloudflare credentials. Deployment requires repository secrets CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN; both were missing when checked.

Protected staging instructions are retired. No dedicated account, Cloudflare Access, saved authentication state or GitHub environment is needed. The old unused staging environment does not gate this workflow.

See [framework migration](NEXT16-MIGRATION.md) and [security assessment](DEPENDENCY-SECURITY.md) for the retained implementation and dependency limitations. A live demo URL cannot be verified until credentials are added and deployment succeeds.

# Deployment readiness — final navigation

Reviewed 2026-11-03 (Toronto). No hosting, DNS, credentials or dependency changes were made.

## Repository publication

`main` retains the existing history. The existing Git identity is Jash Sojitra. There is **no remote configured**, so no GitHub destination can be verified and no push was attempted. Supply the exact intended empty repository URL before publishing:

```powershell
git remote add origin https://github.com/<OWNER>/<REPOSITORY>.git
git remote -v
git ls-remote origin
# Continue only after verifying the intended repository and an empty refs result.
# If refs exist, stop and inspect the remote history; never force-push.
git push --set-upstream origin main
```

Authentication must be completed through the user's Git credential manager or `gh auth login` if requested by Git. Do not embed a token in the remote URL. No verified GitHub URL is available yet.

Publication audit: `node scripts/audit-repository.mjs` scans tracked text and all reachable Git blobs for credential patterns, sensitive filenames and oversized blobs. The initial run scanned 751 historical blobs: no credential-pattern findings, tracked sensitive/build paths or blobs at least 10 MiB; largest blob is an authentic legacy photograph (9,160,958 bytes). This is a pattern scan, not proof that every possible secret is absent. Re-run before publication; the detailed report remains local at `docs/validation/navigation-final/publication-audit.json`.

Ignore rules cover environment files (except `.env.example`), private key files, local agent/account folders, build/cache outputs and generated QA captures/reports. Existing QA images/JSON were removed from the index only; local copies and historical commits remain. Markdown reports and reproducible capture scripts stay tracked. Historical report screenshot links require the local captures or regeneration. Authentic source assets remain intact. History was not rewritten, so historical QA blobs still contribute to clone size.

## Cloudflare Workers + vinext

The installed lockfile resolves Next.js **15.5.29**, React/React DOM **19.3.1**, GSAP **3.15.0**, Three.js **0.187.0**, Fiber **9.8.2** and Drei **10.7.9**. The current build remains a Next.js build; vinext and Cloudflare tooling are not installed or verified here.

Cloudflare currently recommends vinext for Workers, describes it as beta, and documents migration from existing **Next.js 16** applications. Treat the Next.js 15 baseline as a migration gate, not a certified compatible deployment. Its documented sequence is compatibility check, initializer, development and production build. Perform that work in a separate migration branch with pinned versions. [Official Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).

The vinext main-branch package inspected identifies version 1.4.2, Node **>=22**, Vite **^8**, and React/React DOM **^19.3.1** peers. These are a research snapshot, not a selected npm release or compatibility guarantee; verify the exact release manifest before installation. Our installed React satisfies those peers. Use a supported Node 22+ release consistently in CI and local migration checks. [Package manifest](https://github.com/cloudflare/vinext/blob/main/packages/vinext/package.json).

Recommended future configuration:

- Use a Workers SSR application with static asset delivery, rather than a static-only Pages export. Keep the Next.js deployment working while evaluating vinext.
- After reviewing the Next.js 16 upgrade, run a pinned `vinext check`, then `vinext init` targeting Cloudflare. Review every generated change before committing. Use its generated `vite.config.ts` and platform configuration rather than an outdated hand-written Worker entry. The current initializer generates `cloudflare.config.ts` with Cloudflare Vite plugin v2. Pin a tested compatibility date; preserve any generated runtime flags and asset bindings required by the chosen release. [Initializer documentation](https://github.com/cloudflare/vinext#quick-start).
- CI should use `npm ci`, lint, typecheck, the normal build, then the separately generated `build:vinext` and runtime/browser checks. Keep build directories separate and stop competing dev servers before a production test. No deployment job is enabled by this change.
- Configure no database for the existing typed content. Add persistent cache bindings only when the chosen vinext cache adapter and Sanity freshness strategy require them. Never assume process memory is a shared production cache.
- Keep platform API tokens out of browser variables. Future CI may need `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in its secret store, scoped to the intended account/Worker. Local secrets belong in ignored environment files; runtime secrets belong in the platform secret store. No application runtime environment variables are required by the current local content adapter.

### Application-specific acceptance gates

| Area            | Required verification before migration approval                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Journal         | `/journal`, generated `/journal/[slug]`, unknown-slug 404, client navigation, article metadata/JSON-LD, sitemap and unpublish behavior must work on the actual Workers runtime.                                                                                                                                                                                                       |
| Gallery         | Async `searchParams`, direct `?collection=...` requests, refresh, back/forward and Journal links must preserve the same derived collection IDs. Test query-aware caching so collections do not share the wrong rendered response.                                                                                                                                                     |
| Contact         | Preserve dynamic rendering and verify the actual contact journey, redirects and external links. A successful static route build does not verify this route.                                                                                                                                                                                                                           |
| GSAP / Three.js | Preserve client-only browser access, dynamic WebGL boundaries, teardown, reduced motion and mobile DPR limits. Workers must not execute DOM/WebGL code during SSR. Test hydration, scroll choreography, route transitions and devices with no WebGL.                                                                                                                                  |
| Images / fonts  | Do not assume Node `sharp` or the complete Next image pipeline transfers to Workers. Evaluate vinext's request-time `imagesOptimizer()` and Images binding for local assets, or an explicit CDN loader for future Sanity images. Verify widths, quality settings, crop, cache headers, fonts, image responses and mobile network weight. No optimizer configuration was changed here. |
| SEO / previews  | Verify canonicals, robots, OG assets and sitemap against the intended production domain; protect or noindex previews. Existing production URL foundations remain unchanged.                                                                                                                                                                                                           |
| Sanity          | Validate SDK server/client boundaries, authenticated previews, signed webhooks and real cache invalidation on Workers. Run Journal/Gallery publication tests against a staging dataset.                                                                                                                                                                                               |

vinext documents partial image/font behavior and request-time Cloudflare Images optimization; its feature table is a starting point, not application QA. [Official vinext feature coverage](https://github.com/cloudflare/vinext#api-coverage).

**Readiness verdict:** the existing Next.js production build can be verified locally. Workers + vinext remains a future migration requiring runtime validation; this repository has not been declared deployable through vinext. See [Sanity integration checklist](SANITY-INTEGRATION-CHECKLIST.md) for the future content environment contract.

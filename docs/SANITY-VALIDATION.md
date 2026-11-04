# Sanity integration validation — November 4, 2026

Started from main `82a6f6b` (favicon packaging fix), on `feat/sanity-cms`. No deployment, DNS change, live migration or Sanity upload was performed.

| Check | Result |
| --- | --- |
| ESLint | Pass |
| Next type generation / TypeScript | Pass |
| Separate Studio TypeScript | Pass |
| Sanity schema validation | Pass; zero errors / warnings |
| Separate Sanity Studio production build | Pass |
| `test:cms` | 9 pass: publication defense, future visibility, stable collection identity, rename/history, missing references, withdrawal, broken assets, standalone isolation, rich text/date mapping, missing singleton and official SDK fresh reads |
| Migration dry run (repeat runs) | Pass; 32 documents, 12 unique original images; no network or writes |
| Next.js production build, local and CMS modes | Pass |
| OpenNext Workers build, local/demo and CMS modes | Pass; CMS content pages, sitemap and robots use request-time rendering |
| Existing production Next browser suite | 101 pass, 11 intentional skips across desktop, tablet, mobile and small mobile |
| Portable Text browser checks | 4 pass at the same viewport sizes; real article CSS with SDK-rendered rich text, lists and safe links |
| Ordinary local Workers visitor suite | 101 pass, 11 intentional skips |
| Final isolated demo Workers suite | 113 pass, 3 intentional non-desktop WebGL skips; includes demo headers/noindex, archive exclusions, new Portable Text checks and all visitor flows |
| Demo CI target, secret boundary, headers and cache-asset packaging | Pass (`validate:ci -- --built`) |
| Website production dependency audit | Zero vulnerabilities |
| Separate Studio dependency audit | Zero vulnerabilities after scoped compatible/security overrides |
| Formatting | Only three pre-existing failures: `src/components/gallery-explorer.tsx`, `tests/migration.spec.ts`, `tests/site.spec.ts`; reproduced against main, left unchanged |

The SDK test uses a local HTTP fixture with the real Sanity client: it changes the returned published snapshot between requests to test rename, media withdrawal and unpublication without writing to the real project. The browser rich-text test renders the real component into the existing article container; it does not pretend that fixture injection is a live CMS round trip.

Free-plan compatibility was reviewed against [Sanity's published plan contract](https://www.sanity.io/pricing): the configured Studio uses ordinary documents, managed login, public assets, references, drafts and manual publishing. Paid scheduled drafts and Content Releases are explicitly disabled. No paid plugin or private dataset is required. Project membership, post-trial entitlements and usage quotas still need owner confirmation in Manage; local tests cannot certify account billing state.

OpenNext warns that Windows is not its recommended build environment. Both bundles built successfully and the visitor tests ran in local workerd. Linux CI now also runs the CMS tests, migration dry run and separate Studio checks; deployment remains manual-only. No claim is made that a signed webhook has been tested: this implementation has no webhook endpoint or persistent content cache.

## Acceptance still requiring live setup

The real Studio → public production dataset → Workers CMS publish/edit/rename/unpublish/re-publish/approval-withdrawal cycle is pending the explicitly authorized migration and an approved CMS preview. The write command and post-import live verification were not run. No authenticated website draft preview is included; editors review drafts in Studio. These boundaries are deliberate and documented, not completed live acceptance checks.

The migration manifest is `.tmp/sanity-migration/manifest.json`; local build/test logs are `.tmp/sanity-cms-build.log`, `.tmp/sanity-demo-build.log`, and `.tmp/sanity-workers-tests.log`. Generated reports, manifests and build output are ignored. Keep private backups and migration receipts before an eventual write. Follow [integration setup](SANITY-INTEGRATION.md), [migration operations](SANITY-MIGRATION.md) and the [owner guide](SANITY-OWNER-GUIDE.md).

## Reconciliation with main `08c5fc8`

Merged `origin/main` into the existing Sanity branch with both histories preserved. The starting working tree was clean. Three import-only conflicts occurred in `src/app/contact/page.tsx`, `src/app/journal/[slug]/page.tsx`, and `src/components/program-explorer.tsx`; each retains both the CMS helper and `ArrowIcon` import.

Reviewed automatic merges in navigation, footer, shared UI, Gallery and other pages. CMS-provided/approved imagery, dynamic contact/social settings, Portable Text, slug redirects, missing-media placeholders and async adapters remain intact alongside the SVG arrows. Studio, schemas, content libraries/types/data, migration script and dependencies are unchanged from `8bccf33`. The standalone SVG component, shared CSS and icon tests/configuration match main. No decorative Unicode navigation arrows were reintroduced; the Gallery's intentional written keyboard-key instructions remain unchanged.

Reconciliation checks: lint, website/Studio TypeScript, nine CMS fixture/real-SDK tests against a local HTTP fixture, migration dry run (32 documents / 12 unique originals), Studio schema validation (zero errors/warnings), Studio build, and Next.js/OpenNext builds in both CMS and local-demo modes pass. CMS builds retain request-time content routes, sitemap and robots; they do not require populated live data. Demo CI/header/cache-asset packaging checks and the standalone arrow source guard pass. The merged Chromium/WebKit SVG matrix passes **17 tests**, with **7 intentionally redundant source-check skips**, at 360, 390, 768 and 1440px. The full local-demo workerd browser suite passes **113 tests**, with **3 intentional non-desktop WebGL skips**, including Journal/Gallery links, Portable Text, routes/404s, responsive imagery, navigation, reduced motion and demo security headers.

No live dataset mutation, migration write, deployment, DNS update, reset or rebase was performed. Remaining setup is unchanged: configure the documented environments/CORS and owner access, back up and explicitly authorize migration, review media permissions, and complete real Studio-to-Workers publishing acceptance before separately authorizing deployment. Physical-device testing remains recommended; Chromium/WebKit device profiles cannot replace actual iPhone/Android testing. Reconciliation logs are in ignored `.tmp/reconcile/`.

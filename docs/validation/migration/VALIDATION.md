# Next.js 16 / Cloudflare migration validation

Reviewed 2026-11-04. Local Windows, Node 24.14.1, npm 11.11.0, installed Chrome through Playwright. This is application/runtime verification, not a live Cloudflare deployment sign-off.

| Target                                              | Build                                     | Final acceptance suite                                            |
| --------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Next.js 16.4.5 native production server             | Default Turbopack production build passed | **97 passed, 3 intentional skips**, zero unexpected/flaky results |
| OpenNext 1.20.16 / Wrangler 4.157.0 workerd preview | Native Next output adapted successfully   | **97 passed, 3 intentional skips**, zero unexpected/flaky results |
| vinext 1.4.3 / Vite 8.3.0 workerd preview           | Isolated Vite/RSC Worker build passed     | **97 passed, 3 intentional skips**, zero unexpected/flaky results |

Each target ran the 68 Release 4/migration cases, then the 32 legacy cases (29 pass and three intentionally skip the redundant non-desktop legacy WebGL test). The new combined configuration includes all 100 cases. All three targets used the same four viewport projects: desktop 1440x1000, tablet 768x1024, mobile 390x844 and small-mobile 360x800. The three added acceptance tests cover an actual 640px image transformation plus invalid quality rejection, a valid Contact enquiry that prepares but does not send/post data, and Gallery modal scroll-lock restoration. Existing tests cover all pages and program/event/Journal detail routes, unpublished/unknown 404s, metadata/sitemap, Journal-to-Gallery relationships and approval rules, navigation/focus, responsive overflow, GSAP, Three.js, reduced motion and WebGL fallback. Legacy tests were corrected to scope FAQ summaries and respect the configured base URL; no application change was needed.

## Visual evidence

`scripts/capture-migration.mjs` captured native Next and OpenNext at 1440x1000 and 390x844, including two timed hero frames, the community story, Journal, Gallery, Contact, navigation and reduced-motion poster. Browser captures recorded **zero console/page/network errors and no horizontal overflow**. Representative screenshots were actually inspected: approved typography, logo, framing, photography, navigation order, active highlights and mobile layouts remain intact. The two hero frames show the moving ribbon while text and photography remain stable. No visual design edits were made to accomplish the migration.

Generated PNG/JSON evidence remains local and ignored:

- `next16-tests.json`, `opennext-tests.json`, `vinext-tests.json`
- `next16-legacy-tests.json`, `opennext-legacy-tests.json`, `vinext-legacy-tests.json`
- `captures.json`
- `opennext-1440-hero-frame-1.png`, `opennext-1440-hero-frame-2.png`
- `opennext-390-hero-frame-1.png`, `opennext-390-reduced-motion.png`
- `opennext-1440-story.png`, `opennext-390-story.png`
- `opennext-1440-journal.png`, `opennext-390-gallery.png`, `opennext-390-navigation.png`

Vinext received the full functional suite but not a separate screenshot review; the selected OpenNext deployment received both. These are real browser checks in local emulation, not physical iOS/Android or global-network measurements.

## Reproduce

```powershell
npm ci
npm run lint
npm run typecheck
npm run cf:build
npm run test:workers
```

For a normal Next server, run `npm run start -- --hostname 127.0.0.1 --port 3000`, then `npx playwright test --config playwright.migration.config.ts`. For screenshots, run a second manually owned Worker preview on 3002 and `node scripts/capture-migration.mjs`. Stop servers before rebuilding. The isolated vinext setup and locked evaluation package remain under `.tmp/vinext-evaluation`; they are not production configuration.

## Remaining release gates

- OpenNext warns about native Windows support. A clean Linux GitHub CI run remains mandatory after publication; workflows were parsed locally but have not run remotely.
- Live Workers CPU/cold-start behavior, account-specific Images support/costs, access controls, alerts and HTTPS delivery have not been verified. The dry run performed no upload or deployment.
- The read-only static cache cannot perform live Sanity tag/path revalidation. Sanity remains unconfigured; the runbook defines the required future strategy.
- Full-tree npm audit retains 16 moderate lint-tool findings, no high/critical; production dependency audit has zero findings. See [security assessment](../../DEPENDENCY-SECURITY.md).
- ESLint 9 emits an end-of-support warning; the current upstream React/import/accessibility lint plugins have not declared ESLint 10 support. The dry-run upgrade was not forced; this tooling limitation needs upstream follow-up.

See the [migration decision](../../NEXT16-MIGRATION.md) and [deployment runbook](../../DEPLOYMENT-READINESS.md) for exact staging, secrets and rollback steps.

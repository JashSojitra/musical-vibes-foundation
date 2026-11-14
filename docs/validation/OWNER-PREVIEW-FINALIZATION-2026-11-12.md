# Owner-preview finalization — 2026-11-12

Focused snapshot pass for `feat/sanity-cms`, on the requested remote worker. Changes are returned to the caller as one patch; no commit, push, deployment, DNS change, live Sanity read, upload, mutation, deletion or publication occurred. Existing visual styles and assets are unchanged. All fixtures use synthetic data; no recovered photos, private backups or credentials are added.

## Changes

- Historical validation retains exact full-dataset and revision equality. Count-only diagnostics distinguish additions, removals, authored-content changes, revision-only changes and metadata-only changes, with separate recovery guidance for pending outcomes. A legitimate owner edit still invalidates an older plan. There is no automatic rebase, force switch or guard relaxation. Fixture regression checks prove failure before probes/writes/checkpoint saves and avoid disclosing private values.
- Production Worker pages and legacy redirects now receive the same `nosniff`, frame denial, referrer and device-permission policies as preview. Static assets receive those policies through `public/_headers`. Preview retains its separate `X-Robots-Tag: noindex, nofollow`; production does not gain noindex. Preview asset builders append only the preview indexing header to avoid repeating common headers. Build receipts now bind the shared header source as well as the wrapper; existing preview/production bundles must be rebuilt.
- Event JSON-LD uses recorded title, description, calendar date, location and URL only. Missing venue or invalid date omits markup rather than inventing facts. No offers, organizer, attendance mode, time or status claims are synthesized. Rich-result eligibility is not promised.
- Organization JSON-LD ID and logo now follow the same CMS site URL used by its URL field. Relative canonical, OG and Twitter URLs continue resolving against the explicit production metadata base. Confirm the CMS site URL matches that approved production origin before launch.
- Root-layout and page CMS failures have generic retry states that do not expose service errors. Navigation says “All programs” rather than an assumed fixed count. Footer attribution and the existing design remain intact.
- Added a small browser fixture for contact validation, first-error focus, keyboard preparation, mailto encoding and stale-draft clearing; it never opens a mail client or sends a message. The existing backup test now creates its own ignored temporary parent directory.

## Validation

Node 24.22.2; locked root dependencies installed with lifecycle scripts disabled. Node 22 initially exposed the existing explicitly Node-24-only CLI integration assertion; the final checks use Node 24. No dependency versions or lockfile changed.

| Check                                  | Final result                                                                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:cms`                     | 40 passing                                                                                                                                    |
| `npm run test:historical-import`       | 20 passing                                                                                                                                    |
| `npm run test:production-plan`         | 10 passing                                                                                                                                    |
| `npm run test:photo-recovery`          | 12 passing                                                                                                                                    |
| `npm run lint`                         | Passed                                                                                                                                        |
| `npm run typecheck`                    | Passed, including Next route generation                                                                                                       |
| `npm run test:studio-upload`           | Passed in headless Chromium: 24 files, recovery/retry/clear, preserved existing photo, keyed persistence and one cover; mocked transport only |
| `npm run test:owner-preview`           | Passed in headless Chromium at 390px and 1440px; contact component fixture only, not a full layout audit                                      |
| Worker wrapper fixtures                | Production/preview security and indexing separation, redirect status/location, caching behavior; generated Worker not executed                |
| `npm audit --omit=dev --json`          | Zero reported runtime vulnerabilities                                                                                                         |
| `npm audit --json`                     | 8 moderate, zero high/critical; minimatch and lint-tool dependency chain; no blind major overrides applied                                    |
| Current source credential-pattern scan | 191 text files scanned, zero matches for private keys, common provider tokens, AWS keys or JWTs; not proof against every possible secret      |

## Audit findings and limits

Public website reads use an unauthenticated client with published perspective and uncached reads. No website API mutation routes exist. Importer writes are isolated behind explicit phase approval and exact target/plan guards. Studio uses its authenticated client; UI restrictions and publication flags do not substitute for dataset ACLs. Existing JSON-LD escapes `<`; editorial links reject executable protocols; React escapes ordinary content. Existing image configuration restricts remote image optimization to the designated Sanity project/dataset. These are source/fixture findings, not certification of external service settings.

Canonical paths, OG/Twitter metadata, sitemap, robots, FAQ markup, legacy HTML redirects, journal aliases and previous-slug redirects were inspected. Sitemap includes public page/program/event/update paths, not journal aliases. FAQ markup follows displayed CMS answers. Preview allows crawling so crawlers can observe the noindex response header; robots disallow is not substituted for noindex. Production indexing remains separate. No unsupported content, claims or dates were added.

Footer attribution, image fallbacks, navigation keyboard/escape behavior and contact messaging were inspected. Contact clearly prepares an email rather than promising delivery. Real responsive rendering, image loading, internal links across the private CMS snapshot and root-error recovery in a built application remain unverified. Component tests do not certify those integration behaviors.

External blockers/gates:

1. The actual failed authenticated export and its private baseline are absent. The cause of the latest drift, the 14-album/299-original inventory and retained owner edits cannot be recertified remotely. Follow the [import recovery procedure](../HISTORICAL-IMPORT.md); no new live validation was attempted.
2. An owner/admin must verify full-read ACL coverage, least-privilege write credentials, Studio roles/CORS origins, public-dataset asset visibility, photo consent and intended publication permissions. No external permissions were changed. Dataset publication flags cannot make already public uploaded assets private.
3. No generated `.open-next-*` bundle or Studio dependencies are present. Full Studio schema/build validation, real Worker checks, fixture-backed website browser navigation/responsiveness and production/CMS-preview builds must run through the caller's `ld` lab-dispatch workflow. Suggested commands within that workflow: `npm run studio:validate`, `npm run studio:build`, `npm run cf:build:production`, `npm run cf:build:cms-preview`, the corresponding dry runs, `npm run test:cms-preview` (fixture harness, **not** `:live`) and applicable existing browser checks. Do not run live tests requiring credentials or deploy. The only `ld` executable here is the system linker, not the lab dispatcher.
4. Independent Codex review remains a caller-side gate before integration. `codex-remote`/delegation and quota skills are unavailable in this throwaway worker; no additional worker was launched. Git history/diff checks are unavailable because snapshot Git metadata is not usable here; inspect the returned patch in the owning checkout.
5. Runtime dependency audit is clean at this check; moderate build/lint findings remain visible. Studio's separate dependency tree was not installed or audited in this bounded pass. Current-source pattern scanning does not cover inaccessible Git history or verify external secret revocation.

The user-level service-use skill/logger is absent on this worker, so its session health check/activity record could not run. External activity was limited to npm dependency retrieval and advisory audit, without service credentials. No connected cloud storage/hosting services were used.

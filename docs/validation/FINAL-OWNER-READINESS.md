# Final owner-readiness audit — 2026-11-14

**READY for owner demonstration on the existing staging website.** No critical or
high finding was identified in this bounded audit. This is not production launch
authorization or a claim that every production acceptance check was repeated.

Target: <https://musical-vibes-foundation-cms-preview.musical-vibes-staging.workers.dev/>.
Source: supplied `feat/sanity-cms` snapshot. Read-only staging/CMS checks and local
fixtures only; no live data, permissions, drafts, deployment, DNS or Hostinger
changes. No migration was repeated. No commit or push was made.

## Findings and disposition

| Severity | Finding                                                                                                                                                                                                        | Disposition                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | None identified.                                                                                                                                                                                               | No demonstration blocker.                                                                                                                                                        |
| High     | None identified.                                                                                                                                                                                               | No demonstration blocker.                                                                                                                                                        |
| Medium   | Christmas album/title records December 8, 2025; the actual first flyer reads December 18, 2025.                                                                                                                | Confirm the intended date with the owner before correcting CMS text. Existing historical content was preserved.                                                                  |
| Medium   | Historical album alt text often says “Photograph N from [album] (description not provided)”. Attributes exist, but these are identification fallbacks, not useful descriptions of the pictured scene or flyer. | Editorial accessibility follow-up; prioritize covers and flyers. Do not invent descriptions or change live records in this audit.                                                |
| Medium   | Root dependency audit reports eight moderate findings in the development-only ESLint/TypeScript/minimatch chain.                                                                                               | Runtime-only audit is clean; zero high/critical findings. Handle a compatible tooling update separately; do not apply the audit's suggested Next ESLint major downgrade blindly. |
| Low      | LinkedIn attribution URL returned HTTP 999 to automated access.                                                                                                                                                | External anti-automation response; not evidence of a broken profile. Verify once in a normal browser. GitHub profile returned 200.                                               |
| Low      | Recovered album titles retain source capitalization/underscores, and album ordering is editorial/source ordering rather than strictly chronological.                                                           | Preserve provenance; owner can decide whether to normalize labels later. No duplicate albums found.                                                                              |

## Exact changes

Added this report only. No confirmed application defect required a code change.
No dependencies or lockfiles were changed. Audit probes, JSON results, logs and
screenshots were generated as ignored local evidence, not application changes.

## Visual and functional evidence

Actual staging Chromium checks used desktop **1440 × 1000**, tablet **768 × 1024**,
and mobile **390 × 844**. These are browser viewports, not physical-device tests.
Normal-motion rendering was exercised; a separate reduced-motion mobile capture
also completed. Animation timing was not assessed through video or real-device GPU
profiling.

| Check                                                          | Current result                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage, Events, Updates, Gallery, Contact at all three sizes | 200; one H1; no horizontal document overflow, missing alt attributes or image-unavailable placeholders.                                                                                                                                                                         |
| About, Programs, Get involved, FAQ                             | Desktop rendering/screenshots and image decoding completed; responsive screenshot review of these four pages was not repeated.                                                                                                                                                  |
| Visual inspection                                              | Inspected actual screenshots of desktop home/Gallery/Events, tablet home, mobile home/menu/Contact/Updates and Christmas lightbox. Typography, spacing, card layouts, photograph framing, contact details and footer attribution were coherent; no demonstrated visual blocker. |
| Public navigation and routes                                   | All 21 sitemap pages returned 200: nine main pages, six program details, three event details and three Updates. Collected page navigation targets were included in the route sweep. All 14 album selections also opened successfully.                                           |
| Missing routes                                                 | `/owner-readiness-missing`, `/events/not-a-real-event`, `/updates/not-a-real-update` returned 404.                                                                                                                                                                              |
| Legacy journal index                                           | `/journal` resolves to a successful response through redirect-following requests; source retains the alias to Updates. Exact redirect status was not independently asserted in this pass.                                                                                       |
| Desktop keyboard                                               | More opens using ArrowDown, focuses its first program link, closes using Escape and restores trigger focus. Skip link receives Tab focus and moves focus to `main`.                                                                                                             |
| Tablet/mobile menu                                             | Opens; Escape closes and restores Menu trigger focus. A mobile Gallery link navigates to `/gallery` and closes the dialog.                                                                                                                                                      |
| Contact                                                        | Live form rejects empty required fields and prepares an encoded `mailto:` draft at all three sizes. Existing fixture additionally passed first-error focus, keyboard submission and stale-draft clearing at 390/1440px. No email app was opened and no message was sent.        |
| FAQ                                                            | Unmatched search displays its empty state; Clear search restores seven answers. Enter expands the focused native disclosure.                                                                                                                                                    |
| Gallery filters                                                | Music returns two photographs; All moments restores 299.                                                                                                                                                                                                                        |
| Events empty state                                             | Actual live page clearly states there are no confirmed upcoming events and provides a contact action; historical gatherings are presented separately.                                                                                                                           |
| Runtime errors                                                 | Final responsive/album probe recorded zero page errors and zero image HTTP responses with error status. This is not a claim about every network request or every failure mode.                                                                                                  |

### Photographs and Gallery

The current anonymous published query, passed through the actual website adapter,
returns **14 albums, 299 distinct public photographs and 307 ordered album
positions**. Eight repeated positions are intentional source reuse. All 14 album
IDs are distinct. There are exactly three published Updates:

- `diwali-celebrations-2025`
- `seniors-club-christmas-2025`
- `seniors-club-picnic-2025`

The first desktop sweep decoded **316 visible Gallery image elements**, including
299 grid photographs, 14 covers, the intro image and two logos. This count includes
repeated uses, not 316 distinct originals. Home decoded 15 image elements at each
size; responsive Gallery passes additionally decoded their first 18 visible image
elements. Other desktop pages decoded 3–6 image elements each.

All 14 album card covers match the first image in their live CMS sequence. A second
probe compared **every one of the 307 thumbnail positions** with the adapter's exact
asset sequence. All matched. Album lengths in display order were
**43, 18, 15, 24, 11, 5, 2, 19, 7, 69, 19, 4, 20, 51**.

Each album's first lightbox image decoded; ArrowLeft wrapped to the correct final
image, which also decoded; Escape closed the dialog. The initial probe additionally
stepped back to the first image with ArrowRight and captured all 14 album lightboxes.
The full-resolution link was present for each visited album. A direct original
opened in Chromium and decoded at its recorded **1024 × 1024** dimensions.

This pass does **not** claim to have decoded all 299 full-resolution originals or
all 307 lightbox positions again. The prior exhaustive three-viewport and original
pixel/dimension verification is recorded in
[Historical Galleries](HISTORICAL-GALLERIES-2026-11-14.md). Current screenshots visibly
contain real historical photographs and the Christmas flyer, not only successful
image URL responses.

Public Sanity audit: six programs, three events, three published journal entries,
14 media documents, 14 albums, one settings record and seven FAQs; **zero unreadable
references**. Two previously documented pending/disabled PNG media remain withheld
and unreferenced. Published-perspective reads and the adapter's draft/version
exclusion remain in place. The public website exposes the three published Updates;
this audit did not authenticate to enumerate private drafts or re-prove their
revision equality. No mutation was made, and the prior 11-draft preservation record
remains the relevant authenticated evidence.

## SEO, AEO, security and performance

- All 21 sitemap paths are on `https://www.musicalvibesfoundation.com`; no draft
  article or journal alias is included. Albums use query selections with the main
  Gallery canonical rather than independent indexed detail routes.
- Main page metadata was inspected in source; all 12 live detail pages were checked
  for a single H1, description, matching production canonical and Open Graph URL.
  Organization JSON-LD appeared on them, Article on all three Updates and
  BreadcrumbList on program details. FAQ markup follows displayed CMS answers in
  source; search-engine rich-result eligibility is not certified.
- Live picnic Event JSON-LD contains the recorded August 21, 2025 date and
  Chinguacousy Park location. Diwali and Christmas omit Event markup because their
  recorded venues are empty. No venue, time, organizer, price or event status was
  invented to satisfy a validator.
- `/robots.txt` and `/sitemap.xml` returned 200. Robots permits crawling and points
  at the production sitemap. Staging HTML has **`X-Robots-Tag: noindex, nofollow`**
  and **`Cache-Control: no-store`**. The root's indexable HTML metadata is overridden
  by the restrictive response header; robots disallow is not used to hide that header.
- Live HTML headers include `nosniff`, frame `DENY`, strict-origin referrer policy
  and disabled camera/microphone/geolocation. Source applies shared policies to
  production and static assets while keeping preview noindex separate.
- `/api/contact`, `/api/draft-mode`, `/.env` and `/studio` returned 404 on staging.
  Source uses a tokenless published Sanity client with uncached reads; no public
  website API write route exists. Remote image optimization is restricted to this
  Sanity project/dataset. These checks do not audit account ACLs, CORS settings,
  Studio authentication or every possible endpoint.
- Source error boundaries provide generic retry/home actions without rendering
  underlying CMS errors. A live CMS outage was not induced.
- Final unthrottled responsive samples across five pages and three viewports
  recorded early LCP **276–560 ms** and CLS **0.00069–0.05090** at the measurement
  point after network idle. These are worker-host lab observations, not field Core
  Web Vitals, slow-network results or a guarantee about shifts after later scrolling.
  A separate mobile home sample loaded its largest measured image at **20,516 bytes
  transferred**, through the responsive optimizer rather than its original asset.
  Full archive scrolling, Lighthouse, CPU throttling and production performance
  were not re-benchmarked.

## Local checks and limits

Locked root packages installed with lifecycle scripts disabled; checks used Node
**22.23.1**, within the declared engine range. The host default Node 18 was bypassed.

| Command/check                                                                                                                                                                                                             | Result                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run lint`                                                                                                                                                                                                            | Passed.                                                                                                                                                                                                |
| `npm run typecheck`                                                                                                                                                                                                       | Passed, including Next route type generation.                                                                                                                                                          |
| `node node_modules/tsx/dist/cli.mjs --test tests-cms/owner-finalization.test.ts tests-cms/gallery-albums.test.ts tests-cms/media-visibility.test.ts tests-cms/preview-config.test.ts tests-cms/public-references.test.ts` | 16 passed, zero failed. Covers publication/visibility, album ordering/repeated positions, preview isolation, metadata/header contracts and reference boundaries.                                       |
| `npm run test:owner-preview`                                                                                                                                                                                              | Passed at 390/1440px; component browser fixture only.                                                                                                                                                  |
| `node scripts/audit-sanity-public.mjs`                                                                                                                                                                                    | Passed anonymously; zero unreadable references.                                                                                                                                                        |
| Live staging Chromium probes                                                                                                                                                                                              | Responsive rendering, gallery decoding/sequences/covers, keyboard/menu/contact/FAQ, detail metadata and route checks above completed.                                                                  |
| `npm audit --omit=dev --json`                                                                                                                                                                                             | Zero vulnerabilities.                                                                                                                                                                                  |
| `npm audit --json`                                                                                                                                                                                                        | Eight moderate development findings; zero low/high/critical.                                                                                                                                           |
| `npm run cf:validate:cms-preview`                                                                                                                                                                                         | Cannot validate this snapshot: `.open-next-cms-preview/cms-preview-build.json` is absent. This is a missing generated artifact, not a demonstrated Worker defect.                                      |
| Worker build/dry-run, built-Worker fixture suite, full CMS suite, Studio build/schema validation                                                                                                                          | Not repeated here under the caller's targeted-check-only worker instruction. Prior successful build/schema/deployment evidence is linked below; fresh execution belongs in the caller's `ld` workflow. |

The initial long browser sweep reached all 14 albums but its process ended with
exit 143 before emitting its final aggregate. Its screenshots and progress log are
partial evidence, not a passing suite result. Separate bounded probes saved results
incrementally and completed the responsive metrics, full album sequence comparison,
covers, metadata and route checks reported above. A supplementary selector ambiguity
was corrected in the audit probe and that probe passed on rerun; no application
change was needed.

Current ignored evidence is under `.tmp/final-owner-audit/`: `capture.json`,
`cms.json`, `metadata.json`, `covers.json`, `extras.json`, viewport page/menu PNGs and
`album-1.png` through `album-14.png`. Local command logs are `/tmp/mvf-final-*.log`
and dependency reports `/tmp/mvf-final-*-audit.json`. These files are temporary
worker evidence and are **not included in the returned text patch**; retain them
separately if screenshot provenance is needed beyond this job. Prior successful
Worker/Studio build and exhaustive media checks are recorded in
[Historical Galleries](HISTORICAL-GALLERIES-2026-11-14.md) and prior security/contact
work in [Owner Preview Finalization](OWNER-PREVIEW-FINALIZATION-2026-11-12.md).

## Staging versus production and next actions

1. Demonstrate the existing staging site now: homepage, Gallery, a historical album,
   full-resolution link, the three Updates and Contact. Explain that Contact
   prepares an email and requires the visitor to send it from their email app.
2. Obtain owner editorial decisions on the Christmas date, useful photo/flyer alt
   descriptions, source album labels, the displayed Gmail/telephone and current
   program descriptions. Dates on Updates are publication dates, distinct from
   historical gathering dates. There are no confirmed upcoming events. Do not
   publish the 11 draft Updates as part of this review.
3. Check LinkedIn in a normal browser and perform a short physical-phone review.
   Screen-reader/contrast certification, Safari/Firefox and real mail-client
   delivery were not tested here.
4. Before any release that changes application code or artifacts, use the caller's
   established `lab-dispatch` skill and `ld` workflow, preferably with the project's
   CI Node 24, to run the following job payload. No dispatcher was configured in
   this snapshot, so no lab job or replacement local build was started:

   ```sh
   npm run test:cms
   npm run studio:validate
   npm run cf:build:cms-preview
   npm run cf:validate:cms-preview
   npm run cf:dry-run:cms-preview
   npm run test:cms-preview
   npm run test:cms-preview:live
   ```

   Retain the build receipt/results. This report-only patch does not require a
   staging application redeployment for the owner demonstration.

5. Treat production launch as a separate authorized operation: production config
   currently has `workers_dev: false`, `preview_urls: false` and **no routes**.
   Source intentionally omits preview noindex on production and uses the approved
   production metadata origin, but this audit does not verify live production
   routing, headers or indexing. Before launch, run production build/dry-run through
   `ld`, confirm the approved domain, then verify public production canonicals,
   robots, sitemap and absence of noindex following an explicitly authorized
   deployment. No DNS, Hostinger or routing change is part of this patch.

The patch lands only as this documentation file for the caller to review and
integrate. No branch/worktree integration or deployment was performed on the worker.

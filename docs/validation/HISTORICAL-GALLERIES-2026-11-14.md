# Complete independent historical galleries — 2026-11-14

The original Gallery derived albums only from published Updates. Eleven recovered
sequences belonged to draft Updates; only 12 individually enabled Media Library
photographs and three derived collections were visible. Gallery album publication
now has its own approved/enabled `galleryAlbum` document, separate from article
publication. All photographs reuse existing original assets; no image was uploaded.

## Data safety and source verification

Before mutation, a fresh authenticated complete backup saved **396 raw documents
and 307 original asset binaries** under ignored
`.tmp/sanity-repair/galleries-20261114`. Original size/SHA1, backup SHA256 and a
stable second export passed. The current operator's Administrator role was checked.
Credentials remained in memory and child-process environment variables.

The create-only plan cross-checked the recovered inventory against the literal
legacy gallery index, exact backed-up asset bytes and the independently completed
import manifest. It established **14 albums / 299 unique originals / 307 ordered
positions**. Eight positions intentionally reuse an original. Ambiguous asset
identities, occupied album IDs, source-order gaps and unverifiable published
relationships abort the planner. No fuzzy title match or inferred date is used.

One atomic transaction created exactly 14 Gallery records after a server dry run
and full-dataset freshness checks. A private exclusive intent prevents blind replay.
Authenticated after-verification found **410 documents**: every one of the original
396 documents and revisions is exact, including all assets, unknown owner fields,
system records, retained legacy records, three published Updates and eleven draft
Updates. No original was uploaded, updated or deleted. No draft article was published.

The three existing historical collection IDs and verified published Update links
remain stable. The other eleven albums have no article link. Complete photo albums
replace matching derived collections without changing the articles' selected
photographs or editorial content. Existing Media Library descriptions, captions and
crops remain intact; album-position metadata can be edited independently.

| Recovered source album                          | Ordered positions |
| ----------------------------------------------- | ----------------: |
| Seniors Club Christmas Celebration (Dec 8 2025) |                43 |
| Seniors Meet (Dec 4 2025)                       |                18 |
| Seniors Club (Nov 13 2025)                      |                15 |
| Diwali Celebrations (Oct 16 2025)               |                24 |
| Seniors Club (Feb 26, 2025)                     |                11 |
| Seniors Club (March 19, 2025)                   |                 5 |
| Seniors Club (jan 15, 2025)                     |                 2 |
| Seniors Meet (May 8,2025)                       |                19 |
| Seniors Meet (June 19, 2025)                    |                 7 |
| Seniors Meet (Aug 21 2025)                      |                69 |
| Seniors Meet (Oct 2 2025)                       |                19 |
| Hawthorn Woods Care Community (June 6 2025)     |                 4 |
| Sick Kids (Oct 7 2025)                          |                20 |
| Tribute_to_Rafi (Oct 20, 2024)                  |                51 |
| **Total**                                       |           **307** |

## Implementation and local checks

The tokenless published query now reads Gallery albums and validates their asset
existence. Approval and enablement gates remain independent and fail closed. Draft
Updates and release versions are excluded. Gallery lists all album cards; selecting
one shows its ordered sequence. The all-photo view deduplicates originals, while
lightbox selection uses position indices so repeated photographs remain navigable.
Every Sanity photograph has a direct full-resolution original link.

Passed locally: **56 CMS tests**, lint, root TypeScript, Studio TypeScript, Studio
schema validation (zero errors/warnings), Studio build, fresh isolated Cloudflare
build, target/artifact validation, non-deploying Wrangler dry run, **18 built-Worker
fixture checks** across desktop/tablet/mobile and **two real-data built-Worker
browser checks**. The actual anonymous website query returns 14 collections, 299
distinct images and all 307 ordered positions exactly matching the approved plan.

Separately, Chromium decoded **all 299 direct full-resolution originals** at their
exact expected dimensions. Playwright screenshots of each image passed pixel
variation checks; every image had a channel deviation greater than 38. No canvas
CORS permission or service permission change was needed.

The website implementation is `823b62e`. A subsequent Studio-only correction uses
Sanity's native album image-array editor instead of the story-specific uploader,
which exposed irrelevant article instructions and cover controls. Studio TypeScript,
lint, eight relevant regressions, schema validation (zero errors/warnings) and Studio
build passed again. This correction does not change the deployed website bundle.

## Deployment and actual public browser verification

The existing staging-only [deployment workflow](https://github.com/JashSojitra/musical-vibes-foundation/actions/runs/43644794023)
completed successfully for `823b62e515aa9c9ec3d4eca35e224058eb4617ba`. Linux CI repeated
lint, TypeScript, all 56 CMS tests, Cloudflare build/validation/dry-run, all 18 Worker
fixture checks and two real-data browser checks before deployment. The production
jobs were skipped and the preview has no domain routes.

Staging: <https://musical-vibes-foundation-cms-preview.musical-vibes-staging.workers.dev/gallery>.
Deployed Worker version: `5f2df507-3fce-4740-975e-28ab83767fe6`.

An exhaustive Playwright Chromium probe ran on the actual deployed public website:

| Viewport            | Public album cards | Distinct all-photo thumbnails | Ordered album thumbnail positions checked | Ordered lightbox positions decoded |
| ------------------- | -----------------: | ----------------------------: | ----------------------------------------: | ---------------------------------: |
| Desktop 1440 × 1000 |                 14 |                           299 |                                       307 |                                307 |
| Tablet 768 × 1024   |                 14 |                           299 |                                       307 |                                307 |
| Mobile 390 × 844    |                 14 |                           299 |                                       307 |                                307 |

All 42 album visits verified the selected title, exact asset sequence, photo count,
visible decoded thumbnails, full-resolution link targets, repeated positions,
forward navigation, first/last wrapping, keyboard navigation and Escape dismissal.
Each viewport also opened a full-resolution link in a real browser tab and decoded
the original. All 14 card covers matched their albums' first image. The Updates index
still exposed exactly the original three articles; no draft article link appeared.

Every counted photograph had positive natural and rendered dimensions, visible
opacity through its ancestors, and actual nonuniform image pixels. The lowest sampled
lightbox luminance range exceeded 140 at every viewport. There were **zero failed
image HTTP responses, page errors, beige placeholders or horizontal overflows**.
The eight repeated source positions were preserved without duplicate album records;
the all-photo view still contains exactly 299 distinct originals.

Private screenshots include overview pages, each album's lightbox, original-link
tabs and 14-album contact sheets at all three sizes. These were visually inspected;
the evidence shows actual historical photographs and source flyers, rather than
only successful asset URLs. Detailed evidence is under `.tmp/gallery-browser/`,
with the separate 299-original pixel/dimension results in `.tmp/gallery-originals.json`.

Final authenticated after-verification repeated the exact **396 unchanged existing
documents**, **14 new Gallery documents**, **307 unchanged original asset records**,
**11 unchanged unpublished draft Updates**, **three unchanged published Updates**
and **six unchanged retained identity pairs**. There are no unresolved historical
provenance or identity blockers. Source formatting and staged diff checks passed;
private files and credentials are excluded from Git.

## Records retained for review

The two unverified PNG media records remain pending, disabled and publicly
unreferenced: `06195726-d7cc-45df-b0f8-9772367129bc` and
`2bbaa698-b9c9-494f-a0d4-1bb0618dd5c3`. They have no verified membership in the
historical inventory and were not added to an album. All six legacy/repaired
Update/Event pairs, including differing referenced media approval states, remain
unchanged; no identity conflict required invention or merging.

The Christmas source title still says December 8 while its original first flyer
says December 18. The exact recovered album membership is verified; this date-label
discrepancy was preserved for editorial review, without inferring a replacement date
or changing an existing Update.

Backups, raw originals, plans, receipts and screenshot evidence stay under ignored
`.tmp/`. No production-domain, DNS, Hostinger, production Worker, account permission
or unrelated Sanity change was made. Mobile/tablet checks use Chromium emulation;
physical devices were not tested.

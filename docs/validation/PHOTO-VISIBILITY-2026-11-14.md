# Historical photograph visibility — 2026-11-14

Completed on `feat/sanity-cms` with owner authorization to publish recovered historical
photographs. Reviewed and applied investigation patch
`4a2d3dab1b434e8daf29d5a5c2d4c167.patch`; its changes add diagnostics and tests,
without bypassing the website's approval gates. No application rendering change or
staging redeployment was necessary: existing staging reads current published content.

## Backup and exact content changes

Before any dataset modification, the existing authenticated Sanity CLI session
created a fresh complete backup of **396 raw documents and 307 original asset
binaries**. Original sizes/SHA1 and backup SHA256 hashes passed; a second full
authenticated export matched the first. Backup and private execution artifacts remain
under ignored `.tmp/`, including `.tmp/sanity-repair/visibility-20261114`.
The current operator's Administrator role was checked before mutation. Credentials
were used only in memory and the child-process environment, never printed or committed.

The schema and actual `readSanitySnapshot` / `mapSanity` path require a published
Media Library document with a valid existing image, `editorialApproval: "approved"`
and `publicationEnabled: true`. The legacy consent field is read-only and was preserved.
Embedded `storyPhotos` follow their parent Update's publication; they cannot be
published independently by changing legacy Media Library approval.

Of 14 anonymously readable media documents, 13 were pending/disabled. Exactly 11
matched recovered source URLs **and** original asset SHA1 identities:

| Media source identity enabled | Verified recovered album                        |
| ----------------------------- | ----------------------------------------------- |
| `june-song`                   | Seniors Meet (June 19, 2025)                    |
| `march`                       | Seniors Club (March 19, 2025)                   |
| `speaker`                     | Seniors Meet (Oct 2 2025)                       |
| `picnic`, `picnic-table`      | Seniors Meet (Aug 21 2025)                      |
| `conversation`                | Seniors Meet (Dec 4 2025)                       |
| `christmas`                   | Seniors Club Christmas Celebration (Dec 8 2025) |
| `circle`                      | Seniors Club (jan 15, 2025)                     |
| `gathering`                   | Seniors Club (Nov 13 2025)                      |
| `diwali`, `diwali-portrait`   | Diwali Celebrations (Oct 16 2025)               |

Only the two required approval/publication fields were set on those 11 existing
repaired public IDs. The already approved `song` photograph from February 26, 2025
was preserved, yielding **12 eligible historical photographs from 10 source albums**.
Two pending PNG records, `06195726-d7cc-45df-b0f8-9772367129bc` and
`2bbaa698-b9c9-494f-a0d4-1bb0618dd5c3`, have no verified recovered-album provenance
and remain unchanged. They have no public inbound references in the final audit.

The transaction used exact revision guards, a fresh complete-dataset comparison,
a successful Sanity server dry run, another freshness comparison and a private
exclusive execution intent before one atomic non-retried commit. Full authenticated
after-verification confirmed the original document count, the exact two-field changes,
and every other document and revision unchanged. No asset was created or removed.

All six retained legacy/repaired Update/Event pairs remain intact. Their parent
fields normalize equally under the historical reference mapping, but referenced
media have differing approval states. No identities were merged or deleted and no
legacy approval state was synchronized. The exact current photo references in all
three published Updates were verified against the original album relationships;
none needed repair. All three Updates, including titles, prose, dates, slugs and
photo selections, remain byte-for-byte unchanged, as do all **11 historical Update
drafts**, including their 171 embedded photograph positions. No draft was published.

## Browser evidence

Existing staging:
`https://musical-vibes-foundation-cms-preview.musical-vibes-staging.workers.dev`.
Chromium at desktop 1440 × 1000 and mobile 390 × 844, with reduced motion:

| Actual page      |              Visible decoded photo elements per viewport | Beige placeholders |
| ---------------- | -------------------------------------------------------: | -----------------: |
| Homepage         |                                                       13 |                  0 |
| Gallery          |             16 (12 grid images, 3 album covers, 1 intro) |                  0 |
| Updates index    |                                                        4 |                  0 |
| Diwali Update    |                                                        2 |                  0 |
| Christmas Update |                                                        1 |                  0 |
| Picnic Update    |                                                        2 |                  0 |
| Gallery lightbox | All 12 distinct photographs, individually opened/stepped |                  0 |

These counts include repeated uses of the same photographs across page components;
the public Gallery contains **12 distinct images**, not 38 unique photographs.
Every counted element passed browser `decode()`, positive natural and rendered
dimensions, and positive opacity through its ancestors. All 12 direct image URL
responses also passed full Sharp pixel decoding. No failing image HTTP responses,
page errors or horizontal overflow were found in the exhaustive probe.

Screenshots of homepage, Gallery, Updates index, all three articles and all lightbox
positions were retained privately in `.tmp/visibility-browser/`. Desktop and mobile
lightbox contact sheets and page screenshots were visually inspected; actual
historical photographs are visible. Browser and adapter checks found exactly three
distinct historical album collections (Diwali, Christmas and picnic), plus the
existing standalone community archive. All 12 grid assets and all 12 lightbox assets
are unique. No duplicate album identity or Update slug was introduced.

The live regression test additionally compares Gallery thumbnail counts and minimum
article photo counts with the **actual anonymous website query and content adapter**,
so an empty image list cannot silently pass when eligible photographs exist.

## Validation

- Investigation content/visibility regression tests: 16 passed.
- Full CMS suite: 48 passed; lint and TypeScript checks passed.
- Fresh isolated Cloudflare CMS-preview build, target/artifact validation and
  non-deploying Wrangler dry run passed; no production route is configured.
- Built workerd fixture suite: 15 passed (desktop, tablet, mobile).
- Built local Worker with anonymous live Sanity: 2 passed (desktop, mobile).
- Existing staging live suite: 2 passed (desktop, mobile).
- Separate exhaustive staging query/URL/browser/screenshot probe passed at both sizes.
- Public reference audit: no unreadable references; only the two unrelated pending PNGs
  remain withheld, with no public inbound references.
- Changed-source formatting and `git diff --check` passed. Private artifacts and
  credentials are excluded from the source commit.

## Remaining limits

This restores the verified existing public Media Library selections. It does not
publish all 299 recovered originals or all 14 complete album sequences. Eleven
album stories remain drafts under the existing publication workflow; publishing
those Updates requires a separate editorial decision. Four source albums have no
photograph among the existing public Media Library selections. The two unverified
PNG records remain pending. No production-domain, Hostinger, editorial prose,
schema, permission, legacy-record deletion or unrelated content changes were made.
Real-device testing was not performed; mobile verification used Chromium emulation.

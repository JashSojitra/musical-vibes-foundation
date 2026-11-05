# Authorized live Sanity ID repair

Completed 2026-11-04, America/Toronto (transaction receipt: `2026-11-05T04:52:30.693Z`). Project `6jpdhhxg`, dataset `production`, branch `feat/sanity-cms`. This record contains no credentials or raw owner content.

## Backup and authorization

- The owner explicitly authorized the backed-up legacy-ID/reference repair and prohibited legacy deletion, approval/content edits, permission changes and unrelated deployments.
- Fresh verified backup: `.tmp/sanity-repair/20261104-235109/` in the current workspace. It contains `documents.ndjson`, `backup.json`, 12 original asset binaries, inventory, exact plan, permission preflight, transaction receipt and verification artifacts. Keep this ignored directory private and archive it securely outside Git.
- Export: **57 documents** = 32 website documents, 12 asset documents and 13 reserved ACL/schema/retention records. **Zero drafts** were present. Backup asset bytes: **32,642,100**, verified against original size/SHA-1 and locally recorded SHA-256; document hash `5fe153d75d0a4bf2ae12c007ed5c5c68ee011f752eff57d87202891b514f526b`. A second export confirmed no revision drift during backup.
- Existing full-path dataset read/create/update grants were confirmed using read-only ACL/grants endpoints. The exact mutation transaction passed server `dryRun=true`, with unchanged dataset revisions, before execution.
- Plan SHA-256: `db50e3e2750626c27673080ce4fc919f5a87ad1a69aa6aad20a0bdce366674b1`.
- Transaction ID: `OXKzsTJ7Efs4i6zOkRJVaz`. One atomic transaction: 31 creates, one Site Settings reference patch and 31 revision-guard no-op patches on legacy content. No delete, replace/upsert, asset upload or system mutation.

## Diagnosed execution issues

The original native Node `fetch failed` was caused by **`EACCES` from the restricted execution environment**, observed on both the public query request and `GET https://6jpdhhxg.api.sanity.io/v2026-11-01/data/export/production`. Identical requests succeeded from the approved network-enabled terminal. No TLS, network security, DNS or Sanity permissions were weakened. Tool errors now identify the request URL and underlying network code without exposing authorization headers.

The first backup correctly stopped on an asset integrity mismatch. The plain image CDN response was 997,821 bytes versus the original 2,224,613 bytes and had a different SHA-1. `dl` changed only disposition. The documented authenticated **`dlRaw`** request returned the exact original size and SHA-1. The backup tool now uses that endpoint only after validating the HTTPS CDN host and exact project/dataset image path, forbids redirects and unsafe URL components, and retains all integrity checks. The failed backup directory was preserved; a new complete backup was taken rather than relaxing verification.

The authenticated export also includes reserved `_.` system records absent from the prior fixtures. The planner now preserves ACL groups, retention and deployed schemas as opaque, unchanged records, excluding them from reference interpretation and every mutation. Unknown private-path content remains a blocker. Regression tests cover these cases.

## Integrity and public results

An independent reverse-mapping comparison proved every current field/reference could be restored to its backup representation, including owner edits and all image restrictions. No sourceId needed addition or replacement. Slugs/history, content, sourceIds, asset references, crop/hotspot and approval/consent fields were preserved. All 31 old dotted-ID records remain with their original authored reference graph.

The resulting full authenticated dataset contains **88 documents**. Exact post-repair verification compared every expected authored field and reference, all retained legacy documents, assets and protected system records. It excludes server-owned revision/update metadata. A final verification after browser checks also passed.

| Anonymous published type | Count |
| ------------------------ | ----: |
| Program                  |     6 |
| Event                    |     3 |
| Journal entry            |     3 |
| FAQ                      |     7 |
| Media record             |    12 |
| Site Settings            |     1 |

Tokenless query/Doc API verification and `sanity:audit:public` pass with **zero unreadable or unresolved references**. All 12 photos remain **pending**, **publication-disabled** and **consent-unconfirmed**. The actual content adapter exposes **zero photos and zero Gallery collections**, as intended until separately approved editorial decisions change. No draft-only content was published.

## Browser and code validation

The existing deployed preview picked up the data immediately:

https://musical-vibes-foundation-cms-preview.musical-vibes-staging.workers.dev/programs

Clean tokenless browser checks passed for **21 routes per profile** (nine index/general routes, six Program details, three Event details, three Journal details):

- Chromium desktop, 1440px.
- Chromium Pixel/Android emulation, 390px.
- Chromium mobile, 360px.
- Chromium tablet, 768px.
- WebKit iPhone emulation, 390px.

Checks include actual HTTP 200 responses and page headings, six SSR Program rows and navigation links, preserved owner-edited Program names, three Journal articles, seven FAQ structured-data entries, all content detail routes in the sitemap, functional desktop/mobile menus, SVG dimensions and absence of navigation arrow glyphs, reduced-motion operation, no horizontal overflow, and no unapproved photo URLs. Fallback images remain in place. Private evidence: `deployed-browser-verification.json` beside the backup. Desktop browser emulation does not replace real-device testing.

**27 CMS tests**, **two live Wrangler desktop/mobile smoke tests**, the SVG source regression check, lint, TypeScript, formatting and existing isolated preview bundle validation pass. No site runtime, styling, Worker configuration or deployment workflow was changed; the repair-tooling fixes are operator-only.

No redeployment was necessary or performed. Main, the demo Worker, the production domain and DNS were untouched. The existing GitHub CLI authentication was verified without retrieving Cloudflare secrets. The operator credential was entered through masked local terminal input; its temporary Windows-user-encrypted copy was removed after verification. No token or permission was created, rotated or revoked.

## Remaining operational notes

There is no public-read/rendering blocker. Retained legacy copies may appear alongside root records in Studio and cause slug-validation warnings; do not edit the legacy copies or rerun the seed importer. Their cleanup remains separately authorized work under the [runbook](../SANITY-ID-REPAIR.md). No cleanup was executed. Live edit/rename/unpublish tests were intentionally not performed because they would change owner-authored content; publishing the withheld photos also requires a separate editorial decision.

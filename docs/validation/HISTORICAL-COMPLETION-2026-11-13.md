# Historical migration and owner-preview handover — 2026-11-13

Executed in the owner's Windows checkout on `feat/sanity-cms`, preserving `cd34969`. The developer explicitly authorized historical photo uploads, creation of missing Updates as drafts, the two identified test-story deletions, and only demonstrably redundant cleanup. No new Update was published. No official domain, DNS, Hostinger service or production Worker was changed.

## Implementation and authentication

- Reviewed and integrated `.git/codex-remote/0cd15e7c751d478ab11923f4bb6132c4.patch`: count-only drift diagnostics, shared security headers, canonical Organization/Event metadata, safe error boundaries and navigation/contact regression checks. Existing premium styling and genuine owner fields were retained.
- Used the existing authenticated Sanity CLI session through `exec --with-user-token`. The project API confirms the current user's Administrator role with read/write access to every dataset. Credentials remained in memory and child-process environment variables; no token was printed, copied into chat, written to source or committed. Read-only CORS inspection found only credentialed `http://localhost:3333`; no wildcard origin or permission change was introduced.
- The original drift was exactly **11 revision-only changes to `system.group` records**. No additions, removals or owner-authored changes were found. A fresh complete backup and newly validated plan resolved the stale baseline without editing hashes or bypassing drift checks.
- Live ingestion exposed EXIF orientation: one original encoded as 4000×2252 is represented by Sanity's 2252×4000 display identity. The importer stopped on the mismatch. Reconciled the persisted pending intent read-only using original SHA256/SHA1/bytes and exact EXIF identity; no duplicate upload occurred. The legacy run is permanently read-only. A new backup and orientation-aware plan reused all 13 completed uploads. Independent Sharp metadata agrees with all 299 planned identities, including seven rotated originals. Original files/inventory remain unchanged.
- Fixed a Windows fixture import-path escape in Studio upload tests. Built runtime tests also proved the root error boundary's reset repeated a stale failed payload; its retry now reloads fresh server content and passes the actual-button recovery check.
- Broader Linux release CI then exposed duplicate `/*` blocks in generated preview `_headers`: the later noindex block shadowed static security headers. The shared builder now inserts noindex into the single validated common block, preserves production indexing separation, rejects duplicate/invalid policies and has a real built-logo header assertion. No browser assertion was relaxed; the four failing demo-header viewport checks are rerun through the corrected release workflow. Final CI/deployment outcomes are supplied in the handover.

## Verified data and private backups

| Evidence | Result |
| --- | --- |
| Initial fresh backup | `.tmp/sanity-repair/historical-20261113-finalization`: 100 documents, 20 original asset binaries |
| Reconciled orientation backup | `.tmp/sanity-repair/historical-20261113-oriented`: 113 documents, 33 originals |
| Fresh pre-cleanup backup | `.tmp/sanity-repair/pre-cleanup-20261113-finalization`: 398 documents, **307 original asset binaries**, complete hashes and stable second export |
| Historical recovery | **14 albums, 307 original ordered positions, 299 unique originals** |
| Actual uploads | **287 new assets**: 13 in the original run, 274 in the corrected run |
| Original reuses | **12**; the corrected run reused 25 including the 13 already uploaded |
| Updates | **11 new unpublished drafts**, with 171 ordered embedded photographs; no published counterparts |
| Preserved albums | **3 existing historical Updates** retain all owner-authored content/photo selections; their 136 original source positions are available in the local comparison gallery |
| Post-import verification | Passed: exact assets, complete draft set, prior authored fields and dataset reconciliation |
| Cleanup | Deleted only `5616f846-7b1b-4264-9c96-e76c0fe846e6` and `a257f306-d199-4d83-bfe0-780ffc2c121b` |
| Final authenticated state | **396 documents, 307 assets**, 11 historical drafts, 3 published historical Updates; zero unresolved strong references |

Every historical asset's identity/dimensions/size and backed-up raw SHA256 match its recovered original. All surviving original owner-authored fields are exact. Cleanup separately verifies every survivor and every unchanged asset/protected record. The importer success receipt is intentionally retained from before cleanup; its checkpoint was not rewritten to conceal the authorized later deletions.

The six legacy/repaired Update/Event pairs were reconciled and **retained**, not blindly deleted. Some referenced Media Library records have different approval/publication states between legacy and repaired copies; retained legacy parents also have inbound dependencies. The executor blocks deletion when recursively referenced owner content differs, even when parent fields normalize equally. No approval flags were overwritten. Other retained legacy candidates were outside this authorized cleanup scope.

The scoped cleanup executor is limited to the exact two test identities and six documented pairs. It rejects releases, plan tampering, asset selection, unrelated IDs, dangling references, revision drift and unsafe transaction sizes. A server dry-run and fresh export precede one revision-guarded atomic transaction; an exclusively created, fsynced intent prevents blind replay after ambiguous responses. Mocked engine and real offline CLI tests cover these boundaries.

Private plans, exports, originals, checkpoints, intents, receipts, pair analysis and screenshots remain under ignored `.tmp/`. Relevant runs are `.tmp/historical-import-20261113-finalization`, `.tmp/historical-import-20261113-oriented` and `.tmp/historical-cleanup-20261113-finalization`. Final reconciliation is `.tmp/finalization-final-audit.json`. Never commit or serve these directories as public assets.

## Tests and website review

Passed on Windows/Node 24.14.1: ESLint; root TypeScript/Next route generation; **45 CMS tests** (including five cleanup tests); **21 importer tests**; **12 recovery tests**; **10 production-plan tests**; Studio TypeScript/schema validation/build; 24-file mocked Studio upload handling; contact component keyboard/error-focus/encoding checks; fresh CMS-preview Next/OpenNext build, artifact validation and Cloudflare dry-run; **15 built-Worker desktop/tablet/mobile checks**; **2 current-data desktop/mobile browser checks**. CI secret/target validation and seed migration dry-run also passed without live writes.

The private local owner gallery renders all **14 source albums / 307 positions** in original order, verifies every displayed asset against the completed import and decodes every image successfully. Desktop/tablet/mobile layout has no overflow. Open `.tmp/owner-review-20261113/index.html`; its manifest, images and browser evidence remain local. This gallery is a source comparison view, not publication of draft Updates or replacement of the three existing Updates' photo choices.

Public route/metadata/image fallback tests pass. Known test content is absent from the final dataset. Footer attribution remains intact; actual contact fields are present without example values. CMS canonical origin matches `https://www.musicalvibesfoundation.com`. Organization metadata follows current settings; Event markup uses only recorded valid dates/locations, without invented availability or offers. Sitemap/public readers omit drafts. Security policies cover pages, legacy redirects and static assets; preview remains `noindex, nofollow`, with production indexing separate.

Root and Studio runtime audits report **zero vulnerabilities**. Seven moderate lint-tool advisories remain; npm's compatible lockfile-only dry-run offered no fix, so no major override or dependency change was forced. A current-source scan of 216 text files found no common credential/private-key patterns; matching credential filenames were absent from Git history. This is a scoped check, not proof that every possible credential has been revoked or every external account setting audited. No operator token reaches website/Studio hosting.

## Staging and owner acceptance

The existing staging target is `musical-vibes-foundation-cms-preview` at `https://musical-vibes-foundation-cms-preview.musical-vibes-staging.workers.dev`. Its prior successful GitHub deployment and the branch/target/route guards were verified. The repository has authenticated deployment access via its existing Cloudflare secrets; local Wrangler itself is not logged in. Only the explicit CMS-preview workflow on the reviewed development commit may be used. The current deployment run/version and remote browser outcome are supplied in the final handover; no production target is selected.

Owner review remains necessary before publication: factual wording and dates, captions/image alternatives, covers/crops, and any enrichment of the three preserved Updates using their complete source sequences. Check conflicting historical source labels against evidence: the Christmas source album says Dec 8 while its first flyer says Dec 18; no existing date was changed or inferred from that conflict. Review the differing Media Library approval states before any later legacy cleanup.

Confirm donation/payment destination and contact workflow; the website prepares mailto drafts and does not transmit/store form submissions. Verify real devices, final SEO/Search Console settings and approved official-domain canonical behavior before a separately authorized production cutover. Keep current Hostinger/DNS rollback evidence and take a fresh backup for subsequent owner edits. No payment integration, official-domain change or draft publication was performed in this run.

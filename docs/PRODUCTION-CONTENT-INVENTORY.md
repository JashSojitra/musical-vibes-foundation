# Production content inventory — 2026-11-10

## Evidence and limits

Read-only live GET comparison is in [legacy evidence](validation/LEGACY-LIVE-COMPARISON-2026-11-10.md). Four HTML pages and the gallery script match after whitespace normalization. Home, About and Programs differ through archived mojibake versus live UTF-8 punctuation/emoji; inspected text diffs show no substantive new content. Fresh decoded copies are retained in `archive/2026-11-10-launch-audit/`. Source publication is evidence of a historical listing, never consent, attendance, partnership or impact verification.

Verified legacy organization listing: Musical Vibes Foundation; Brampton, ON, Canada; `meenumalik77@gmail.com`; `+1 (416) 832-6970`. Owner must confirm these remain appropriate for launch. The six legacy Programs match the repository: Healing Through Music; Meditation and Yoga; Senior Engagement Activities; Nutrition and Health Guidance; Online Workshops and Talks; Food Drives for the Needy. Current descriptions are editorial adaptations, not verbatim historical reports. Do not reinstate clinical therapy, certified-instructor or “hundreds benefiting” claims without evidence.

Anonymous Sanity observation: **6 Programs, 3 Events, 5 Updates, 14 media records, 7 FAQs, 1 settings record**; no unreadable published references. [Exact observed IDs/revisions](validation/SANITY-PUBLIC-LAUNCH-2026-11-10.md). This supersedes the older three-Update/twelve-media observation for public counts only. Private records, drafts, releases and full inbound references remain unavailable: no full-read credential was supplied. No authenticated current dry-run was possible. The bundled 2026-11-04 tar has an empty `data.ndjson` and no image binaries; it is not a usable current recovery backup.

All 14 Media Library records observed are pending, public enabling is false and consent is unconfirmed. Embedded Update photos follow the existing Update publication flow; do not infer that all public photographs are hidden from the library approval counts.

Two published titles look like tests: “Test 8th november” and “Test 11th November Story” (the latter has seven embedded photos). These are suspected test entries, not proven disposable material; preserve owner edits and photos. Exact IDs and review conditions are in [cleanup review](PRODUCTION-CLEANUP.md). Three migrated historical Events and Updates correspond to Diwali 2025-10-16, Seniors Meet 2025-08-21 and Christmas 2025-12-08. Their event dates are supported by source album labels. The Updates' 2026-11-03 publication date is a migration date, not the event date. The other eleven source albums have no corresponding migrated Event in this public observation; reconcile all owner content before creating draft Updates.

## Complete source album index

Counts below are unique paths within each album, not confirmed files or participant counts. Dates are quoted labels, not independently verified occurrence dates. Descriptions beyond album labels require owner evidence.

| Source album label | Photos | Videos | Downloaded sample | Not in sample |
| --- | ---: | ---: | ---: | ---: |
| Seniors Club Christmas Celebration (Dec 8 2025) | 43 | 4 | 3 | 40 |
| Seniors Meet (Dec 4 2025) | 18 | 10 | 3 | 15 |
| Seniors Club (Nov 13 2025) | 15 | 7 | 3 | 12 |
| Diwali Celebrations (Oct 16 2025) | 24 | 4 | 3 | 21 |
| Seniors Club (Feb 26, 2025) | 11 | 14 | 3 | 8 |
| Seniors Club (March 19, 2025) | 5 | 0 | 3 | 2 |
| Seniors Club (jan 15, 2025) | 2 | 0 | 2 | 0 |
| Seniors Meet (May 8,2025) | 19 | 0 | 3 | 16 |
| Seniors Meet (June 19, 2025) | 7 | 29 | 3 | 4 |
| Seniors Meet (Aug 21 2025) | 69 | 0 | 3 | 66 |
| Seniors Meet (Oct 2 2025) | 19 | 4 | 3 | 16 |
| Hawthorn Woods Care Community (June 6 2025) | 4 | 2 | 3 | 1 |
| Sick Kids (Oct 7 2025) | 20 | 1 | 3 | 17 |
| Tribute_to_Rafi (Oct 20, 2024) | 51 | 0 | 3 | 48 |

Recount from the preserved machine-readable index: **307 distinct photo paths**, 75 video references and 23 repeated references within albums. This confirms the older prose count of 307 photographs. There are 41 downloaded sample paths and **266 uncollected photo paths**. Exact paths for every album are already in `docs/legacy-snapshot/gallery-index.json`; downloaded source URLs/checksums/dimensions are in `gallery-manifest.json`. Uncollected does not mean unavailable: they have not all been requested or visually reviewed. No batch media download was performed.

Two malformed video paths (`5mp4`, `6mp4`) and the previously recorded `TEST.mp4` 404 remain unresolved; no current availability claim is made for them. No video masters are supplied. No verified activity-specific photos for yoga, nutrition, online workshops or food drives, team biographies, vector logo or permission evidence were found. Care-community signage and “Sick Kids” labels do not establish partnerships. Rafi concert watermarks must remain intact.

## Migration dry-run status

**BLOCKED for current authenticated data.** The new `production:content:plan` command verifies the complete existing backup and asset hashes, then compares a new authenticated export before writing a private, create-only report. It never calls a mutation endpoint. It proposes draft archive Updates for unmatched exact album labels, omits unknown publication dates and photo assignments, and never replaces an existing ID/slug. Gallery collections remain derived from published Updates plus eligible photos; no new Gallery schema or duplicate image assets are needed.

It also proposes pending Media Library drafts reusing current embedded photo asset references and crop/hotspot/alt fields. This lets owners select existing images for Program/Event photos and homepage hero through existing reference controls after separately approved import/publication. Approval and public enabling stay off, consent stays unconfirmed, and ambiguous categories/captions require review. Existing Updates and their photos are never altered. Re-running after a later authorized draft import skips occupied stable proposal IDs. Match-by-album is deliberately conservative; owner review must resolve renamed or relabelled content before importing. There is no live import/delete executor in this patch.

The future write phase must use only reviewed draft creates (never seed upsert/replace), pause writers, compare a fresh complete export with the reviewed hash, reject collisions across draft/published IDs and slug histories, enforce atomic transaction limits, retain original assets, and verify all prior authored content/references unchanged. Re-run raw and anonymous integrity checks afterward. Rights approvals must remain explicit owner decisions backed privately.

# Photo recovery verification — 2026-11-11

Read-only recovery from the verified legacy HTTPS asset origin completed: **307/307 source URLs**, **299 unique binaries**, **8 duplicate byte references**, **0 missing**, **0 failed**. All 41 existing sample originals were independently reverified by checksum, dimensions and length; recovery reused locally verified bytes through its checkpoints. All successful binaries were re-read and checked before producing the proposal. No image was transformed or watermark removed. No Sanity mutation, upload, deployment, commit or push occurred.

Metadata evidence: [complete photo inventory](../legacy-snapshot/photo-recovery-inventory.json) and [public-observation migration proposal](../legacy-snapshot/photo-migration-proposal.json). The ignored worker binaries are ephemeral and absent from the patch. The caller must rerun recovery to retain originals locally. See [PowerShell procedure](../PHOTO-RECOVERY.md). Header/signature validation is not visual review or full decoding.

| Album | References | Verified |
| --- | ---: | ---: |
| Seniors Club Christmas Celebration (Dec 8 2025) | 43 | 43 |
| Seniors Meet (Dec 4 2025) | 18 | 18 |
| Seniors Club (Nov 13 2025) | 15 | 15 |
| Diwali Celebrations (Oct 16 2025) | 24 | 24 |
| Seniors Club (Feb 26, 2025) | 11 | 11 |
| Seniors Club (March 19, 2025) | 5 | 5 |
| Seniors Club (jan 15, 2025) | 2 | 2 |
| Seniors Meet (May 8,2025) | 19 | 19 |
| Seniors Meet (June 19, 2025) | 7 | 7 |
| Seniors Meet (Aug 21 2025) | 69 | 69 |
| Seniors Meet (Oct 2 2025) | 19 | 19 |
| Hawthorn Woods Care Community (June 6 2025) | 4 | 4 |
| Sick Kids (Oct 7 2025) | 20 | 20 |
| Tribute_to_Rafi (Oct 20, 2024) | 51 | 51 |

Anonymous CMS observation returned 56 public content/asset documents. Exact matching preserved three historical album counterparts and proposed 11 missing album drafts. 12 unique recovered binaries match existing public Sanity asset hashes; 287 are prospective uploads, subject to full authenticated reconciliation and owner approval. These counts are provisional: private assets/content can change them. Ordered photo manifests retain duplicates and every album relationship; draft payloads intentionally remain incomplete and unpublished.

## Exact suspected test observations

- 5616f846-7b1b-4264-9c96-e76c0fe846e6: “Test 8th november”; revision o3j7Liw4brTzZp1OeYY9M9; 0 public inbound paths; 2 direct references.
  - image-4b0d63697481a2dea524338e09f272a8294ab748-1672x941-png via 06195726-d7cc-45df-b0f8-9772367129bc.image.asset.
  - image-ce305944efd8d65ad55c9c24b40268f09c9e95c4-941x1672-png via 2bbaa698-b9c9-494f-a0d4-1bb0618dd5c3.image.asset.
- a257f306-d199-4d83-bfe0-780ffc2c121b: “Test 11th November Story”; revision LLB7XvsnrFBwaHMSzc4m9u; 0 public inbound paths; 6 direct references.
  - image-ca1dd79221021b335b4f3d5219c2ef6b807a9b28-1920x1080-jpg via a257f306-d199-4d83-bfe0-780ffc2c121b.storyPhotos[0].asset.
  - image-76f1672f16f540ee46bb8ccfafd66c3159a79072-1254x1254-png via a257f306-d199-4d83-bfe0-780ffc2c121b.storyPhotos[2].asset.
  - image-ced22c6a70a2f3f22cea14755c965a1fd7414ba3-1280x720-png via a257f306-d199-4d83-bfe0-780ffc2c121b.storyPhotos[3].asset.
  - image-6d1b8fc083e3ef265cd9b68b9337bff042de47ad-1280x720-png via a257f306-d199-4d83-bfe0-780ffc2c121b.storyPhotos[4].asset.
  - image-59ffdfcfb890487ccecff2cabbf8a29cc5860657-4096x2730-jpg via a257f306-d199-4d83-bfe0-780ffc2c121b.storyPhotos[5].asset.
  - image-d1a402977646cf992af2004a149808f6c8fdba5b-4096x2730-jpg via a257f306-d199-4d83-bfe0-780ffc2c121b.storyPhotos[6].asset.

The second story has seven storyPhotos slots: six asset references and one empty image slot. The first story references two Media Library records, whose image references are listed above. No asset or story is selected for deletion. Public absence of inbound paths does not cover private/draft/release/unknown-type references. Fresh full-read backup, owner classification and revision-guarded separately authorized implementation remain mandatory.

## Validation and remaining blockers

Ten targeted recovery/planning tests pass on Node 22, including retries, missing/invalid responses, timeout, bounded concurrency, redirect rejection, sample integrity, resume/cache repair, deduplication, graph traversal and safe planning. Node syntax and git whitespace checks pass. Existing production planner tests: five pass; the config test is blocked by missing TypeScript dependency. `npm run typecheck` was attempted and cannot start (`next` missing); this snapshot has no installed project dependencies. Caller must run both checks after normal installation and obtain independent Codex review before integration. Full application/Studio builds and browser QA should run through **ld**, not this worker.

Full authenticated CMS state/ACL, image rights, participant consent, owner descriptions/alt text/publication dates, renamed-content reconciliation and visual review remain unverified. This is a reviewable preparation patch only. Service-use/delegation skills are unavailable in this worker snapshot; caller should record the read-only legacy recovery and public Sanity observation under its service-use workflow.

Final verification used an isolated recovery directory after detecting an interrupted npm child still writing its earlier checkpoint. All 307 entries in the retained inventory were then independently revalidated against recovered binary hashes/dimensions. Normal recovery locking prevents simultaneous runs; after interrupting npm, verify its child Node process has also stopped before archiving a stale lock.

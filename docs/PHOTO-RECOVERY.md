# Historical photo recovery and draft preparation

This workflow only reads legacy assets and writes local reports/binaries. It has no upload, publish, delete or Sanity mutation command. The existing UI, schemas and Gallery derived from Updates are unchanged. Do not run the old seed importer. Owner approval of rights, participant consent, descriptions and publication is still required, including for previously published images. Watermarks and original bytes are retained.

## Windows PowerShell

From the existing `feat/sanity-cms` checkout, use Node 22.14–24. The recovery and local proposal commands use built-in Node modules and need no install. Existing authenticated backup/planning commands require the project's normal `npm ci` setup.

```powershell
node --version
npm run photos:recover
Get-Content .tmp/photo-recovery/report.json
$inventory = Get-Content .tmp/photo-recovery/inventory.json -Raw | ConvertFrom-Json
$inventory.photos | Where-Object { $_.status -ne 'success' } | Select-Object source,status,error
$inventory.photos | Where-Object duplicateOf | Select-Object source,duplicateOf
npm run test:photo-recovery
```

Repeat `npm run photos:recover` to resume. It rechecks signatures, dimensions and SHA-256 on cached objects, validates all 41 sample manifest checksums/dimensions/lengths before reuse, retries missing/failed references on the next run, and never changes the source manifest. `npm run photos:recover -- --offline` inventories and validates available local files without requests. Recovery uses two workers, at most one request start per 750 ms, 20-second request/body aborts, a 30 MB response cap, and at most three attempts with exponential backoff. 404/410 are missing; non-transient HTTP failures stop immediately. Redirects are rejected, and only HTTPS `www.musicalvibesfoundation.com/assets/` JPEG/WebP URLs from the index are requested. Configuration bounds and fixture injection are available in the exported `recover` function; the CLI deliberately accepts only `--offline`.

If interrupted, confirm the earlier Node process has stopped, then move `.tmp/photo-recovery/recovery.lock` to a uniquely named private archive path and rerun. Never remove another active operator's lock. State is checkpointed by atomic replacement after every completed reference; a crash may cause only in-flight references to be retried. A malformed checkpoint fails closed; retain it for diagnosis before choosing a new directory with the exported API.

All original binaries are under **ignored** `.tmp/photo-recovery/objects/<sha256>.bin`. `.bin` is intentional: metadata records the actual JPEG/WebP format and original filename. Identical bytes share one object while every source URL and album/order/date label is retained. Inventory contains SHA-256, SHA-1, dimensions, byte count, result, reuse provenance, attempts and errors. Dates are literal album label fragments, not inferred publication dates. Signature/header checks do not replace visual review or full image decoding. Do not move this directory into `public`, attach it to a PR, upload backups/originals to GitHub, or force-add ignored files. These local binaries on a throwaway worker are **not included in the returned patch**; rerun recovery on the trusted workstation to retain them.

## Safe preparation against current content

First follow `PRODUCTION-LAUNCH.md` and `SANITY-ID-REPAIR.md`: pause writers, take a new complete authenticated documents-and-original-assets backup, verify hashes and independently verify the credential's full-read ACL. Never use the old empty tar. Do not print credentials. Use a new private backup directory each time.

```powershell
npm run sanity:repair -- --backup --dir .tmp/sanity-repair/photos-YYYYMMDD-HHMMSS
npm run production:content:plan -- .tmp/sanity-repair/photos-YYYYMMDD-HHMMSS - .tmp/photo-recovery
```

`-` means no requested cleanup IDs. The existing planner verifies the backup and compares a fresh authenticated export for drift before producing `production-plan.json`, now including `historicalPhotoMigration`. If that report already exists, preserve it and use a fresh backup directory. The photo proposal is a review artifact, not an executable import. Full-read verification is never inferred from possession of a token.

For exploratory local comparison only, given an existing private raw NDJSON export:

```powershell
npm run photos:plan -- .tmp/sanity-repair/photos-YYYYMMDD-HHMMSS/documents.ndjson
```

The existing verified backup uses `documents.ndjson`; confirm its receipt before selecting it. This standalone command revalidates recovered bytes but cannot certify completeness/freshness of the export; its proposal explicitly records that blocker. It makes no network requests. Timestamped proposals remain ignored/private.

Matching is exact and conservative: source album/title/sourceId, occupied proposal identity and slug history, plus three explicit historical seed identities corroborated in repository content. Possible renamed content still requires owner reconciliation. Existing Updates, Events, Programs, assets, drafts and unknown owner fields are never patched. Missing albums receive only unpublished `drafts.*` journalEntry proposals, literal source titles and empty `storyPhotos`; no narratives, captions, publication dates or identities are invented. Required authoring fields remain intentionally incomplete. Ordered photo assignment manifests list every source, including failures, with stable image keys and pending asset bindings. SHA-1 matches against Sanity image asset hashes reuse existing assets; SHA-256 deduplicates proposed uploads across all albums. Multiple possible assets require owner selection. No Hostinger URL is assigned as a website image; URLs are provenance only. Future uploads and insertion of references into `storyPhotos` require separate authorization and a reviewed, revision-guarded implementation.

Cleanup proposals inspect only the two exact IDs in `PRODUCTION-CLEANUP.md`, their observed drafts/releases, all nested inbound links and reachable photographs, with revisions and document hashes. References through Media Library records are followed; unresolved references are reported. All cleanup remains blocked. Preserve the original documents and image assets even when an owner classifies a story as a test. Public observations cannot establish a complete inbound graph.

Run `npm run test:photo-recovery`, `npm run test:production-plan` and `npm run typecheck` after normal dependency installation. Have the caller obtain independent Codex review of the final patch. Full application/Studio builds and browser suites belong through **ld**, as described in `PRODUCTION-LAUNCH.md`; no heavy build is needed to run the collector.

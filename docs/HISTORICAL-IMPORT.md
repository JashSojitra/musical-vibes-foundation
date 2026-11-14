# Guarded historical photo and Update importer

This is a reviewable implementation, **not approval to migrate production**. No production operation was run while preparing it. It does not publish, delete, remove assets, run the seed migration, or change Studio/website design.

## Prerequisites and review gates

- Use Node **24**, npm, and this branch's locked dependencies (`npm ci`). The entry point runs with `tsx`.
- Work in the caller's original checkout. The remote snapshot has neither private backups nor recovered binaries. Do not copy those into tracked directories or include them in a patch.
- Supply a complete authenticated backup in the format produced by `sanity-repair.ts --backup`: `backup.json`, `documents.ndjson`, and every referenced original asset binary. `loadBackup` checks target, document hash, asset inventory, byte counts and SHA hashes on **every invocation**. The previously verified directory is `.tmp/sanity-repair/photos-20261111-102201`; if production has changed, take a new backup and review a new plan.
- Supply the complete recovery directory, including `inventory.json` and `objects/<sha256>.bin`. The checked-in recovery inventory alone is insufficient. Original bytes, SHA256, SHA1, dimensions, size, format, source paths and all ordered album associations must agree. Reusable assets also require the backed-up original SHA256 and byte count to match the recovered binary.
- A human administrator must verify that `SANITY_REPAIR_TOKEN` can read **all** production documents, including drafts and protected records. A filtered export cannot prove its own completeness. Use the same full-read scope as the verified backup. Missing credentials, denied exports, malformed exports and any difference from the backup/checkpoint fail closed.
- Review the private `plan.json`: expected prior evidence is **14 albums / 307 ordered photo paths / 299 unique binaries / 287 uploads / 12 reusable assets**, preserving the three existing historical Updates. Counts are evidence to compare, not values forced onto a changed dataset. Inspect every preserved match, including renamed content, and the proposed 11 missing-album drafts. Match ambiguity or asset identity inconsistency requires a new reviewed plan; no fuzzy match is used.
- Upload approval means permission to make every original in that plan publicly accessible. **Draft status does not make an asset private.** Old hosting is not consent. Approve rights and participant permissions independently before entering the upload phrase. Neither approval nor schema defaults are inferred by the script.
- Pause concurrent CMS editing and other importers for the write window. The same dataset, complete revisions and inventory are rechecked before each operation. Sanity has no cross-document unique-slug constraint: a concurrent new document can race a transaction. The post-export will stop on that drift, but cannot undo it. An editing pause is necessary.

All run artifacts stay under ignored project `.tmp/`. They contain private content and must remain local. POSIX files use mode 0600/directories 0700; **on Windows protect the directories with the user's filesystem ACLs**. Do not expose a run directory through a web server or symlink it into public content.

## Windows PowerShell: plan and validate (read-only)

Run from the repository root. These commands make no dataset writes. `plan` is entirely offline; `validate` exports production for exact comparison. The importer does not load `.env` automatically.

```powershell
node --version  # must be v24.x for the tested runtime
npm ci
npm run test:historical-import

$backup = '.tmp/sanity-repair/photos-20261111-102201'
$photos = '.tmp/photo-recovery'  # adjust to the real recovery directory
$run = '.tmp/historical-import-20261111-review'  # new directory for this plan
$common = @('--backup', $backup, '--photos', $photos, '--run', $run)

npm run photos:import -- plan @common
if ($LASTEXITCODE -ne 0) { throw 'Plan failed; stop' }

$secret = Read-Host 'Full-read Sanity token (not recorded in history)' -AsSecureString
$env:SANITY_REPAIR_TOKEN = [System.Net.NetworkCredential]::new('', $secret).Password
$secret = $null
npm run photos:import -- validate @common
if ($LASTEXITCODE -ne 0) { throw 'Validation failed; stop and review' }

$plan = Get-Content -Raw (Join-Path $run 'plan.json') | ConvertFrom-Json
$plan.hash
$plan.imports | Group-Object action | Select-Object Name, Count
$plan.drafts | Select-Object _id, title
```

`plan` never replaces an existing plan. Repeating it in the same directory stops without changing the original. Reuse the directory for validation/resume, or choose a new `.tmp/` directory when deliberately replanning. Do not edit plan hashes or checkpoints to bypass drift.

## Future write phases: separate deliberate approvals

**Do not execute these during patch review.** After the owner separately authorizes the relevant phase, the following is the exact syntax. Omitting `--write` always previews; `--write` without that phase's exact phrase fails. Approval binds the full plan hash and pinned `6jpdhhxg/production` target. Resume requires the same explicit phase and approval for additional writes.

```powershell
# Preview uploads; inspect the returned requiredConfirmation.
npm run photos:import -- upload @common

# Only after explicit approval of public original photographs:
$uploadApproval = Read-Host 'Enter PUBLIC-PHOTOS 6jpdhhxg/production followed by the reviewed full plan hash'
npm run photos:import -- upload @common --write --confirm "$uploadApproval"
if ($LASTEXITCODE -ne 0) { throw 'Upload stopped; retain artifacts and reconcile' }
$uploadApproval = $null

# Preview missing-album draft creation separately.
npm run photos:import -- create-drafts @common

# Only after explicit approval of the unpublished draft set:
$draftApproval = Read-Host 'Enter UNPUBLISHED-DRAFTS 6jpdhhxg/production followed by the reviewed full plan hash'
npm run photos:import -- create-drafts @common --write --confirm "$draftApproval"
if ($LASTEXITCODE -ne 0) { throw 'Draft phase stopped; retain artifacts and reconcile' }
$draftApproval = $null

npm run photos:import -- verify @common
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; do not publish' }
Remove-Item Env:SANITY_REPAIR_TOKEN
```

Existing Updates, captions, crops, references and edited fields are retained. Photos are attached in original album order only to newly created missing-album drafts. Those drafts contain the source album title, source identity and ordered image references. They omit publication dates, story text, alt text, participant identities and permission claims. Missing required publication fields intentionally need owner work before any later publication.

The three documented historical Update identities and their three Event identities can each have both a retained dotted ID and its deterministic repaired `mvf-` ID. The importer recognizes only these six explicit identities, with matching type, exact ID encoding and matching `sourceId`. It preserves every copy independently, even when owner fields differ; it never merges fields or removes duplicates. `retainedIdentityGroups` records every preserved ID, revision and full-document hash. The three known album matches may include their exact associated Event identities. Unrelated IDs claiming those source identities, other duplicate slugs, and unrecognized multiple album matches still stop planning. Future cleanup remains separate.

Drafts are deterministic `drafts.mvf-archive-…` IDs created with **create**, never create-or-replace, create-if-absent, or patching existing story fields. One bounded transaction creates the entire draft set and revision-guards existing non-system content with an unset of a prevalidated absent reserved field. Owner-authored fields remain exact; the guard may advance system revisions/timestamps. The transaction is server-dry-run checked for validation/permissions first. Upload permission is enforced by the upload endpoint itself; no upload probe creates a test asset. Before uploads, a dry-run guard transaction checks document mutation permissions without referring to assets not yet uploaded.

## Interruptions, retries and receipts

- One process holds `active.lock` for a run. It is archived on normal exit, including handled failures. After a crash, inspect its PID and make sure no importer is active. On Windows: `Get-Content "$run/active.lock"`, then `Get-Process -Id <recorded-pid>` and inspect the process command/time. Only after confirming the lock is abandoned, preserve it with `Move-Item "$run/active.lock" "$run/archive/abandoned-lock-<unique-time>.json"`. Never automatically break locks or start another run against the same dataset.
- Each intent is fsynced into a new, exclusive `checkpoint-00000001.json` file **before** its POST. Checkpoints are an append-only hash chain. An interrupted/torn checkpoint fails closed. Preserve it for review; do not discard it and restart uploads.
- Checkpoint filenames must be contiguous from 00000001; missing sequence members stop before any API request. Local filesystem failures expose only their standard error code, without printing private paths or server payloads.
- Uploads are serial, spaced at least one second apart. Only definitive HTTP 429 rejections retry, with exponential waits and at most three retries. Definite 400/401/403/409/422 rejection clears the pending intent only after an unchanged export. Permission rejection stops immediately. Network errors, timeouts, HTTP 5xx and malformed mutation responses are ambiguous and are never blindly retried.
- Resume first exports and reconciles. A pending asset is adopted only by exact expected ID, SHA1, size and dimensions, backed by the locally verified SHA256 original. A pending draft transaction is accepted only when **all** expected draft contents exist and **all** prior authored values are unchanged. Assets/protected documents must retain their revisions. No partial draft batches are replayed.
- If an ambiguous response has **no verified matching outcome**, resume stops again, even if it looks as though nothing happened. Have an administrator determine the actual outcome and prepare a separately reviewed recovery/new backup. There is deliberately no `--force`, reset-pending or overwrite switch.
- Dry-run resume reconciles observed outcomes locally but performs no remote mutation. `verify` requires all assets and the complete exact draft set; unrelated additions, revision drift and changed owner content fail it.

```powershell
# Read-only reconciliation after an interruption:
npm run photos:import -- resume @common --phase upload
# Or: --phase create-drafts

# Only with renewed explicit phase approval to continue remaining uploads:
$approval = Read-Host 'Enter the exact reviewed PUBLIC-PHOTOS phase phrase'
npm run photos:import -- resume @common --phase upload --write --confirm "$approval"
$approval = $null
```

`plan.json` holds the exact before documents and proposed after drafts; checkpoints hold exact observed after documents/revisions. `receipt-*.json` records every ID, revision and SHA256 document hash before/after, the plan hash, phase, reconciliation summary, observed operation receipts and Sanity request/transaction IDs when available. A crash may leave only a pending checkpoint; a later read-only reconciliation produces the receipt. No token, authorization header or server error body is logged. The CLI shows fixed locally authored failure reasons; arbitrary SDK, parse and HTTP error bodies receive a generic message. Inspect private inputs/checkpoint state with a trusted local operator.

`cleanup-proposal.json` is a **separate non-executable** proposal for the two exact test Update IDs. It includes variants, revisions, linked photographs and inbound references. Every candidate remains blocked. No cleanup mutation or asset deletion exists in this importer; cleanup needs its own owner review and future authorization.

## Verification and limitations

Run `npm run test:historical-import` under Node 24, `npm run test:cms`, `npm run test:photo-recovery`, `npm run test:production-plan`, `npm run lint`, and `npm run typecheck`. Fixtures use synthetic originals and mock responses for every write. A real tsx entry-point subprocess plans with network explicitly blocked and no token. Tests cover dry-run/phase approvals, identity collisions, corrupt originals, changed associations, partial uploads, lost responses, bounded rate retries, permissions, owner revisions, dataset additions, draft transaction reconciliation, checkpoint persistence and locks.

The original remote fixture report is retained as historical evidence. The subsequent Windows workspace validation, real recovery/backup counts and remaining authentication gate are recorded in [the local stabilization report](validation/HISTORICAL-STABILIZATION-2026-11-11.md). The owner's direct-workspace instruction governs that local run; no lab dispatcher is required for these authorized local checks. Fixtures and anonymous reads cannot certify production write permissions, full-read ACL coverage, rights or consent. Those remain owner/operator gates before any live import.

## Diagnosing dataset drift safely

A legitimate owner edit makes an older plan stale. Validation cannot infer who authorized an edit, and must not adopt it automatically. The count-only diagnostic separates added/removed documents, authored-content changes, revision-only changes (possibly including server timestamps), and other server-metadata-only changes. All categories stop the import, including unrelated documents and revision-only differences. Counts disclose no document IDs, titles, field values or credentials. Export ordering alone is harmless.

Retain the original backup, plan and checkpoint chain. Review a fresh **full authenticated** backup privately with the owner/operator; confirm the token can see the whole dataset. A remote snapshot without the exports cannot determine the cause of a real validation failure. Do not interpret a missing document as an authorized deletion or an ACL-filtered export as complete.

If there is no pending request, prepare a new plan in a new private run directory against that verified backup, inspect preserved matches and proposed drafts, validate again, and obtain renewed phase approval before any write. Keep the old run as evidence. Never change stored hashes, revisions, expected documents or the approved backup to make validation pass. Already uploaded reusable originals still require independent backed-up SHA256 evidence.

If a checkpoint has a pending request, resolve that request's actual outcome first under the interruption procedure above. Do not discard the intent, reset the run, replan around an ambiguous write or replay it. Draft reconciliation may adopt revision/timestamp changes caused by the importer's guard transaction only when the entire planned draft set exists and all prior authored fields remain exact; this is not a general exception for owner edits.

## Original pixels and EXIF display orientation

The recovery inventory records original encoded dimensions and hashes; it is never rewritten to match a CMS response. Sanity asset IDs/dimensions use EXIF display orientation. New plans record `orientationVersion: 1`, each original's `orientation`, and `assetWidth`/`assetHeight` separately from raw `width`/`height`. Orientations 5–8 swap the display dimensions. SHA256, SHA1, byte count and original files remain unchanged. Exact identity/collision/reuse checks and new draft references use the display dimensions. JPEG and WebP EXIF directories are inspected with bounds/type/value validation.

A legacy plan can be reproduced unchanged for read-only reconciliation. If a pending original is found with exactly the expected SHA1, size and locally verified EXIF display identity, and the rest of the export is unchanged, resume records that observed outcome in a new checkpoint without replaying the upload. It marks the run `requiresReplan`; no further writes from that legacy plan are permitted. Keep its plan and complete checkpoint chain. Take a new authenticated originals backup, verify the stored original's SHA256, and prepare/validate a new orientation-aware plan in a new directory. Completed uploads become exact reuses. This recovery path never swaps dimensions speculatively, edits an old hash or accepts a changed owner document.

The image importer itself never deletes. Separately authorized exact cleanup uses [the scoped cleanup workflow](HISTORICAL-CLEANUP.md) only after import verification and a fresh pre-cleanup backup. Later authorized cleanup legitimately changes the dataset: preserve the successful pre-cleanup import receipt and use the cleanup receipt plus final album/asset reconciliation for the final state, rather than altering the import checkpoint to hide drift.

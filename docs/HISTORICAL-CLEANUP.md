# Scoped historical cleanup

This executor is limited to the two exact owner-identified test Update IDs already documented in [the cleanup review](PRODUCTION-CLEANUP.md), their observed draft counterparts, and the six documented legacy Update/Event identities. It cannot select arbitrary IDs, infer tests from titles, delete image/file assets, publish, replace documents or merge owner edits. Execution requires separate owner authorization; authorization already supplied for the current task does not need repeating.

Use a new complete authenticated backup **after** historical import verification and before cleanup. Retain every original asset binary. Plan locally in a new ignored run directory:

```powershell
npm run sanity:cleanup -- plan --backup .tmp/sanity-repair/<fresh-pre-cleanup-backup> --run .tmp/<new-cleanup-run>
# Authenticated comparison only; no permission probe or mutation:
npm run sanity:cleanup -- execute --backup .tmp/sanity-repair/<fresh-pre-cleanup-backup> --run .tmp/<new-cleanup-run>
```

Inspect the private plan, exact revisions/hashes, blocked records and inbound paths. Legacy deletion requires equal owner-authored fields after deterministic ID/reference normalization, plus recursively equivalent referenced owner content. External reference identities are never normalized as local. Even a weak inbound reference from a retained document blocks deletion. Candidate dependencies are re-evaluated until no retained document points into the deletion set. A differing media approval, consent, caption or other owner field prevents treating its parent copy as redundant. Preserve it for explicit reconciliation; never erase approval differences to satisfy cleanup.

Only after reviewing the concrete plan under the owner's authorization:

```powershell
npm run sanity:cleanup -- execute --backup .tmp/sanity-repair/<fresh-pre-cleanup-backup> --run .tmp/<new-cleanup-run> --write --confirm 'CLEANUP 6jpdhhxg/production <full-plan-hash>'
npm run sanity:cleanup -- verify --backup .tmp/sanity-repair/<fresh-pre-cleanup-backup> --run .tmp/<new-cleanup-run>
```

Both backup bytes and plan are reverified on each invocation. Execute compares a fresh full export, server-dry-runs one bounded transaction, and compares another fresh full export before writing. The same atomic transaction revision-guards all non-system/non-asset documents and deletes only the exact reviewed IDs. It does not change any owner-authored survivor fields. Assets and protected documents must remain byte-for-byte equal in the post-export. A successful receipt verifies exact survivors, removals, asset preservation and strong reference integrity.

One exclusive run lock prevents concurrent local operators. `intent.json` is exclusively created and fsynced before the single live request. An existing intent is never replayed, even after a lost response. Use read-only `verify`; retain the entire run and resolve any ambiguous outcome with an administrator. There is no automatic retry, force, reset, wildcard, broad cleanup mode or restoration. Pause concurrent writers for the operation; server-side global uniqueness/reference graph changes cannot be locked by a local process.

Run `npm run test:cms` for planner/executor and real offline CLI coverage. All test mutations are injected fixtures; tests never use the production operator token. Backups, full plans, references, intents and receipts remain private under `.tmp/`.

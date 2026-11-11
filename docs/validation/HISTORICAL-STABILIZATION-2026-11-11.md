# Windows historical migration stabilization — 2026-11-11

Executed directly in the owner's existing Windows workspace on `feat/sanity-cms`, Node 24.14.1. Existing uncommitted work was preserved. No live Sanity mutations, uploads, publications, deletions, deployments, DNS changes, commits or pushes occurred. Local fixture POSTs and mocked mutation tests do not contact production. This report supplements the original Linux fixture report.

## Root causes and changes

- Reproduced the actual failure: `EPERM` on rename from `photos/inventory.next.json` to `photos/inventory.json` inside a synthetic historical-entry fixture. Recovery now retries only Windows EPERM/EACCES/EBUSY replacement failures five times with bounded backoff (775 ms total). Persistent denial and unrelated errors retain the original error and fail. Both checkpoint and original-object replacement use the helper. No original recovery run was repeated against the private photo directory.
- Recovery previously used `Promise.all`, which could release its directory lock after the first checkpoint failure while another worker was still writing. It now drains every worker before releasing the lock. A real filesystem-failure regression checks this behavior.
- The real verified backup has six known retained legacy/repaired Update/Event identity pairs. Generic duplicate detection blocked planning, and known associated Events would also have blocked album matching. Exact allowlisted type/ID/source identities now preserve every copy independently. No source fields are merged or overwritten; unrelated collisions still fail. Private plan evidence records all IDs, revisions and hashes.
- Importer checkpoint loading rejects missing sequence members in addition to hash-chain corruption. CLI filesystem failures expose safe standard codes. Entry-point integration checks fixture completion and subprocess spawn errors. Existing URL-encoded preload paths and async/CommonJS compatibility remain covered.
- Git ignores the pre-existing local `archive/` originals and `sanity-backup.tar.gz`; `.tmp/`, credentials and recovered originals remain excluded. Nothing private was staged.

## Validation

| Exact command/check | Final result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass, including Next route generation |
| `npm run test:cms` | 36 pass |
| `npm run test:historical-import` | 20 pass, including real Node/tsx CLI and mocked complete lifecycle |
| `npm run test:photo-recovery` | 12 pass |
| `npm run test:production-plan` | 10 pass, including actual npm/tsx offline integration |
| `npm --prefix studio run typecheck` | Pass |
| `npm run studio:validate` | Pass: zero errors/warnings |
| `npm run studio:build` | Pass |
| `npm run cf:build:cms-preview` | Pass: isolated fresh Next/OpenNext build |
| `npm run cf:validate:cms-preview` | Pass: target/config/artifact receipt checks |
| `npm run cf:dry-run:cms-preview` | Pass; Wrangler explicitly exited in dry-run mode |
| `npm run test:cms-preview` | 6 pass: desktop/mobile fixtures in workerd |
| `npm run test:cms-preview:live` | 2 pass: desktop/mobile local Wrangler with anonymous production reads |
| `npm run sanity:audit:public` | Pass: 6 Programs, 3 Events, 5 Updates, 14 Media records, 1 settings document, 7 FAQs; no inaccessible references |
| Real `photos:import ... plan` | Pass: private plan, no network/CMS writes |
| Real `photos:import ... validate` | Blocked as designed: no `SANITY_REPAIR_TOKEN` in this process |
| Public backup comparison | 56 published documents/assets: no additions, removals, value or revision changes |
| Full original-image decode | 299 unique originals pass Sharp full-image statistics with `failOn: warning` |
| `git diff --check` and source diff inspection | Pass |

The restricted build initially failed reading the global npm cache (EPERM); it succeeded with normal Windows access. Sanity process inspection and Wrangler registry/log access also encountered sandbox restrictions; normal-access checks passed. The six fixture browser tests passed, but restricted Windows teardown left the owned server tree running; that exact tree was inspected and stopped, after which Playwright exited successfully. Live browser tests completed normally with normal access. These restrictions were not bypassed by weakening tests or changing content permissions. No repeated full build was needed after the successful preview build; subsequent changes were importer/tests/docs only.

Fixture coverage includes all six importer modes, dry-run defaults, separate exact phase approval, asset reuse/identity collisions, corrupt originals, ordered associations, permissions, revision drift, bounded rate retries, ambiguous responses, checkpoint persistence, missing sequence members, lock exclusion and safe resume. Browser checks cover public SSR/routes, dynamic slugs/redirects, metadata, image fallbacks, empty datasets, gallery ordering, editor homepage choices, withdrawal/unpublication and desktop/phone overflow. No website component change was needed based on these checks.

## Private recovery and migration evidence

Inputs: `.tmp/sanity-repair/photos-20261111-102201` and `.tmp/photo-recovery`.

- Backup: 100 raw documents; all 20 original asset binaries verified against recorded SHA256/size and Sanity SHA1/size.
- Recovery: 14 albums, 307 source references, 299 unique originals. Every row's SHA256, SHA1, size, format and dimensions was checked against original bytes; all 299 unique originals also fully decoded without warnings. Source paths and every album association retain their original order.
- Proposed import: 287 new originals, 12 exact reusable assets. Reusable originals agree with the independent backup's SHA256 and byte count.
- Draft set: 11 missing historical Updates; three known existing historical albums preserved, together with every retained copy. New drafts contain literal source titles and ordered references; no dates, narratives, captions, alt text, identities or consent claims were invented.
- Private artifacts: `.tmp/historical-import-20261111-stabilization/plan.json`, `cleanup-proposal.json`, `reconciliation.json`, `public-comparison.json`, `decode-verification.json`, and archived run locks. Do not commit or serve this directory. The plan includes a complete before snapshot and `retainedIdentityGroups`; the separate reconciliation report retains the original duplicate evidence.
- Reviewed-plan hash: `39d2a6a9dc927ebb8ddba5f0fdc8c76f881430cac649f11cab1ee62ed63a398b`. Replan if inputs change; never edit hashes/checkpoints.

## Readiness and next action

The local implementation and preview are validated. The import has not run. Anonymous equality covers only the published subset and does not certify drafts, protected records, full-read ACLs or write permissions. The next minimal step is to make an existing full-read operator token available securely to the local importer and rerun `validate` against this plan. If any full-dataset revision changed, take a new verified backup and replan; preserve owner edits and all earlier artifacts.

Before uploads, the owner must separately verify rights/participant consent and approve making the 287 originals publicly accessible. Before draft creation, separately approve the exact 11-draft set and pause concurrent writers. Resume never supplies approval implicitly. After an authorized import, run exact after-verification and obtain owner review of genuine content, captions/alt text, rights, crops and publication fields before publication. Cleanup of the two test stories and retained duplicates remains an independently reviewed and authorized future action; no deletion executor exists.

Continue the existing launch sequence after content acceptance: security/credential review, fresh backups, SEO/AEO and canonical/contact checks, performance, final responsive and real-device QA, owner acceptance, verified payment/donation destination, then separately authorized Worker deployment and official-domain cutover with Hostinger/DNS rollback evidence. No unrelated redesign is included.

## Follow-up: authenticated handoff and commit review

The owner configured `SANITY_REPAIR_TOKEN` in a separate PowerShell session. It is not inherited by this Codex process; its value was neither requested nor retrieved. Authenticated validation and full-dataset freshness/ACL confirmation therefore remain pending. Run the documented `validate` command in that existing session, retaining its private receipt. No new authenticated outcome or full-access assertion is recorded here.

A fresh offline precommit preflight reverified the saved backup, all recovered originals, reproducible plan hash, 12 byte-identical reuses, preservation of every before document, the 11 proposed draft IDs, and existing/proposed strong local references. Results: 100 documents, 20 backed-up originals, 299 recovered images, 287 uploads, 12 reuses, 11 drafts, three preserved albums, zero unresolved strong references and zero draft ID collisions. This is local evidence, not a current production export. Evidence and exact next-phase operations are saved only under the ignored run directory (`precommit-preflight.json` and `next-operations.md`). Rights/consent and separate write-phase approvals remain required. The code commit does not authorize or certify a live migration.

# Historical importer patch verification — 2026-11-11

Scope: additive CLI/import engine, fixture tests, package scripts and operator documentation only. No Studio schema/UI, website design, deployment configuration or existing content files changed. No production requests, uploads, mutations, publications, deletions, commits or pushes were performed. All write responses used injected mocks. The real CLI integration subprocess explicitly blocked network access.

Runtime: Node **24.22.2** (temporary worker tooling), project-locked tsx and dependencies installed with lifecycle scripts disabled. No full build, Studio build or browser matrix was run.

| Check                                                                                                                | Result                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run test:historical-import`                                                                                     | 18 passing, including Node 24 + tsx subprocess, mocked CLI lifecycle and corrupted checkpoint rejection |
| `npm run test:cms`                                                                                                   | 35 passing                                                                                              |
| `node --test tests-cms/photo-recovery.test.mjs tests-cms/production-plan.test.mjs tests-cms/production-tsx.test.mjs` | 20 passing                                                                                              |
| `npm run lint`                                                                                                       | Passed                                                                                                  |
| `npm run typecheck`                                                                                                  | Passed, including Next route type generation                                                            |
| `git diff --check`                                                                                                   | Passed for tracked diff; new sources formatted with project Prettier                                    |

Safety coverage includes exact phase approvals, dry-run defaults, original SHA256/SHA1/size/format/dimensions, inventory/association integrity, backed-up reusable SHA256 identity, conflicting asset IDs, duplicate slugs and ambiguous album matches, preservation of edited Updates/crops/captions/references, ordered new draft photographs, bounded HTTP 429 retries, permission failures, HTTP 5xx/timeouts/lost responses, persisted intent before requests, owner revision drift and transaction guards, exact successful-outcome reconciliation, idempotent reruns, checkpoint hash chains and exclusive run locks.

Remaining caller-side gates:

- Independent review of this final patch before integration. This bounded snapshot job did not launch a second worker/reviewer; remote delegation skills/quota tooling were unavailable here.
- Verify the private backup/recovered originals and expected 14/307/299 inventory on the caller machine. Those private inputs were absent remotely, so actual production counts and proposed 287/12 upload/reuse split were not recertified.
- Confirm full-read authentication scope, current dataset/revisions and owner-approved matches. Export equality cannot establish ACL completeness on its own.
- Obtain separate public-photo and unpublished-draft approvals before either write phase. Pause concurrent editing; cross-document slug uniqueness cannot be locked globally by Sanity's API.
- Any heavy production/Studio build or browser regression run belongs through the lab `ld` dispatcher and owning workflow. Only the system linker named `ld` was on this worker's PATH; the lab dispatcher was unavailable.

See [the operator procedure](../HISTORICAL-IMPORT.md) for exact Windows PowerShell commands. Start with local `plan` and authenticated read-only `validate`; the patch itself authorizes no migration.

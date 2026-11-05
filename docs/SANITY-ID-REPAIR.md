# One-time private-path ID repair

The tooling defaults to read-only inventory. The separately authorized live repair completed on 2026-11-04 (America/Toronto); see [execution and validation evidence](validation/SANITY-ID-REPAIR-2026-11-04.md). Do not rerun a new repair against the retained legacy copies. Target is pinned to `6jpdhhxg/production`, API `2026-11-01`; environment variables cannot redirect it. The website remains tokenless. Nothing here changes Workers, deployment settings, DNS, schemas or Studio permissions.

The earlier seed importer is deliberately unsuitable for this repair: it reads Git content, rather than current Studio edits. Do not run `sanity:migrate:write`. The existing `sanity-backup.tar.gz` is left untouched and is not accepted as this tool's fresh, verified backup.

## Contract and review

`npm run sanity:repair` defaults to authenticated **read-only inventory**. Supply an existing operator credential through server-only `SANITY_REPAIR_TOKEN`, using your approved local secret mechanism. Never paste credentials into commands/history, Git, a public variable, Studio configuration or the Worker. No credential creation, permission change or token rotation is performed. The credential must have unrestricted dataset read access, including private paths, drafts, assets and non-website documents. Review its existing role in the project before proceeding: a successful export alone cannot prove an ACL-filtered credential saw every document. Limited type/path read credentials are unsuitable.

The inventory reports IDs, revisions, sourceIds, slugs/history, every nested reference and current/expected anonymous content counts. Planning blockers are reported alongside the inventory. The actual expected counts come from current data, never from the old 32-document seed or fixtures. Six published legacy Programs produce six public Programs; extra owner documents remain extra owner documents. Draft-only Programs are **not** published. Media document counts are separate from approved public photos and derived Gallery collections.

The repair:

- Clones supported dotted-ID content documents into deterministic `mvf-<base64url(original published ID)>` root IDs, using the same identity function as commit `c400839`. Only the historical importer ID/type pairs are eligible; unknown private paths abort so intentionally private owner content cannot be accidentally exposed. Repository seed data supplies this identity allowlist only, never repair field values. Drafts use `drafts.<same root ID>`; draft-only records remain draft-only. Root IDs reserve room for a draft prefix. Assets and their binaries are never uploaded, cloned, patched or deleted.
- Copies the **current exported documents**, including unknown owner fields, Portable Text, slugs/history, dates, sourceIds, image crop/hotspot, approval, publication and consent fields. It copies creation timestamps; Sanity owns revisions and may advance update timestamps. Missing/empty sourceId on a cloned Program/Event/Journal/media record is explicitly filled with the old published ID to retain the adapter's existing fallback identity. Existing nonempty sourceIds are unchanged; invalid values or inconsistent pair identities abort.
- Recursively remaps local `_ref` values anywhere in the new graph, including Site Settings and its draft, featured content, Journal/Event/Program/media relationships, arrays and nested block annotations. Array order, `_key`, weak-reference metadata and all other fields stay intact. Cross-dataset references and ordinary strings containing IDs are unchanged.
- Patches only affected reference-bearing fields on existing root documents, guarded by `ifRevisionID`. Also submits revision-guarded no-op patches (unset a known-absent guard field) for existing non-system content, including legacy sources, in the **same atomic transaction** as creates. Those guards may advance system revision/update metadata but leave authored values intact. Assets/system documents are never patched. Reserved `_.` ACL, retention and schema records are backed up and compared unchanged, treated as opaque data, and excluded from reference remapping and revision-guard mutations; unknown private-path content still aborts. Every candidate ID is created with `create`, never replace/upsert.
- Aborts on either occupied target counterpart, duplicate logical sourceIds/slugs/history across unrelated identities, pair mismatches, dangling strong references, public-to-draft references, unsupported private-path types, release versions, dataset drift, oversized transactions, expired backup or failed permissions. It does not guess collision winners or silently adopt an identical existing target. Pre-existing missing weak references remain inventoried warnings; they are not invented or repaired.
- Leaves the original legacy documents and their original authored reference graph in place as retained copies. The new graph and all existing root inbound references use the new IDs. Old private-path content remains invisible to anonymous reads. **Studio can show both copies and its slug validators can flag the retained legacy copies. Keep editing paused, clearly identify the new IDs, and separately approve cleanup before normal authoring resumes.** There is no automatic legacy deletion or schema workaround.

All artifacts contain private raw drafts/content. Keep them on a private disk with appropriate filesystem access and archive them securely outside Git. In-repository directories are restricted to ignored `.tmp/sanity-repair/<new-run>`. The tool never overwrites an existing backup directory. Asset downloads are restricted to this project's HTTPS Sanity CDN path, reject pre-existing queries, URL credentials, unexpected ports and redirects. Original images use the authenticated `dlRaw` endpoint: ordinary CDN image responses (including `dl`) can be processed and fail the original size/SHA-1 checks. The token is sent only to the validated project image path for that original download; ordinary file downloads remain tokenless. See [Sanity's image download parameters](https://www.sanity.io/docs/content-lake/image-urls). It verifies original size/SHA-1 when available, records SHA-256, and rechecks the complete dataset revisions after downloading. Every subsequent command rechecks raw document and asset hashes. A backup must be at most **two hours** old for planning/permission checks/writes; verification may use the original backup later.

Sanity's [Export API](https://www.sanity.io/docs/http-reference/export) includes drafts, releases and assets with authenticated access. The standard [CLI export](https://www.sanity.io/docs/content-lake/exporting-data) can also create an additional raw archive with asset binaries. The [Mutation API](https://www.sanity.io/docs/http-reference/mutation) supports non-executing `dryRun` and revision guards. No mutation endpoint is called by inventory, backup, dry-run planning or verification.

## Commands: read-only preparation

From the repository root in PowerShell, on `feat/sanity-cms`, with dependencies installed and `SANITY_REPAIR_TOKEN` supplied securely:

```powershell
git status --short
git branch --show-current
npm run sanity:repair -- --inventory
New-Item -ItemType Directory -Force .tmp/sanity-repair | Out-Null
$repairDir = Join-Path (Get-Location) ('.tmp/sanity-repair/' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
npm run sanity:repair -- --backup --dir "$repairDir"
npm run sanity:repair -- --dry-run --dir "$repairDir"
```

Pause all Studio editing, integrations/imports and other dataset writers **before backup**, and keep them paused through verification. Check each exit code; stop immediately on any failure. `--backup` writes only local raw `documents.ndjson`, original asset files and `backup.json`; it performs no remote mutations. Inspect every `plan.json` entry (`changes`, complete create/patch `mutations`, `active`, `expected`, counts, unresolved weak references and cleanup candidates). Preserve the exact plan hash with the backup. The dry-run compares a fresh full export with the backup, so it cannot plan from stale owner content.

An optional additional standard recovery archive, run from `studio/`, using the existing authenticated CLI session (no login/permission change required by this tooling):

```powershell
Push-Location studio
npx sanity dataset export production "<PRIVATE_ABSOLUTE_PATH>/production-before-id-repair.tar.gz" --raw
Pop-Location
```

Do not pass `--no-assets` or `--no-drafts`. Retain CLI warnings and inspect archive contents (`tar -tzf <archive>`), including raw documents and asset binaries. A restore drill requires a separately authorized dataset; never restore over production to test a backup. The custom hash-verified backup remains mandatory for this repair even if an additional CLI archive exists.

## Permission preflight: non-executing

Only after reviewing the plan and full-read credential role, validate the **exact planned transaction** on Sanity's server without executing it:

```powershell
npm run sanity:repair -- --check-permissions --dir "$repairDir"
```

This sends `POST /data/mutate/production?dryRun=true`, validates create/update permissions and revision guards, rechecks dataset revisions, and records `permissions.json`. It does not persist mutations. An authorization or validation error aborts; do not change permissions as part of this task. The receipt is bound to this plan and credential, expires after **15 minutes**, and cannot substitute for explicit confirmation. The exact live transaction passed server dry-run validation before the authorized repair; its private permission receipt is retained with the backup.

## Future repair: requires separate explicit authorization

**Do not run the following write command during preparation.** After the owner explicitly authorizes this particular reviewed plan, manually copy the entire `REPAIR 6jpdhhxg/production <planHash>` confirmation printed by dry-run:

```powershell
$env:SANITY_REPAIR_CONFIRM = 'REPAIR 6jpdhhxg/production <REVIEWED_PLAN_HASH>'
npm run sanity:repair -- --repair --dir "$repairDir"
Remove-Item Env:SANITY_REPAIR_CONFIRM
```

There is one atomic transaction, no batching, asset upload or delete. The command revalidates all backup hashes, exact plan hash, live dataset state, confirmation and recent same-credential permission receipt, then performs another server `dryRun=true` immediately before the sole `dryRun=false` request. It records `receipt.json` and checks the resulting full dataset against the plan. The site can begin serving repaired published data immediately; this is a real publication/access change even without a Worker deployment.

An interrupted HTTP response can mean the transaction committed. Retain the original backup/plan/permission receipt and use `--verify` first. An exact already-applied state makes a retry with the same fresh backup/confirmation a no-op, even if a process stopped before writing its receipt. Any different target, owner edit, missing document, partial graph or unrelated dataset change aborts without overwriting. After timeout/expiry, use read-only verification, not a forced retry. If source content changes before a transaction, take a new backup and repeat review; if both graphs now exist or they diverge, stop for manual reconciliation rather than generating a replacement plan.

## Verification after an authorized repair

While editing remains paused:

```powershell
npm run sanity:repair -- --verify --dir "$repairDir"
npm run sanity:audit:public
npm run test:cms
npm run test:cms-preview:live
```

`--verify` checks the full authenticated dataset, including unchanged retained copies/assets and new published/draft documents, against every expected authored field (excluding server revision/update metadata). It independently compares the exact anonymously returned published content, follows public references with the tokenless Doc API, and runs the actual content adapter and Journal/Gallery derivation. Review `verification.json`: raw public counts, mapped Programs/Events/Journal, approved media and stable collection IDs/photos. Missing weak references are reported; unexpected permission-denied references fail. Existing approval restrictions remain effective even if public media document counts increase.

The existing live browser command runs a **local** Wrangler preview against the real public dataset; it neither deploys nor writes data. If the validated preview bundle is not present, prepare it with `npm run cf:build:cms-preview` and `npm run cf:dry-run:cms-preview` first. Those are local builds/dry runs, not deployment. This task does not edit their settings.

Also inspect the already deployed CMS preview in a clean tokenless browser: Programs list/detail and navigation, Events list/detail, Journal list/detail/history redirects, Gallery collections and photo fallback, featured links, SEO and sitemap. Check phone and desktop widths. Confirm approved/enabled images appear with the original crop/hotspot, and pending/rejected/disabled or missing photos use the existing safe fallback. Use the exact slugs in the reviewed plan. Desktop emulation does not replace real-device testing. Do not edit/unpublish live content just to run these checks under this authorization.

## Separate cleanup plan (no executable deletion)

1. Keep the original backup, reviewed plan, receipt and verification report privately. Take a **second** complete backup before any separately authorized cleanup. No asset deletion is needed.
2. Review exactly `plan.cleanupCandidates` (old published/draft IDs only). Compare every retained authored field/revision with the original backup; reconcile any later owner edits into the corresponding new record manually with separate approval. Never infer a broad prefix/type query is safe.
3. Inspect **all** current raw incoming references, including drafts, unknown types and any newly added release versions. References from retained legacy candidates form the old graph; any reference from outside that exact candidate set blocks deletion until separately reviewed. Check every new published/draft pair, slug/history, Site Settings feature and Journal/Gallery relationship again.
4. Identify the root copies as the authoring records. Review Studio's temporary duplicate rows/slug warnings and confirm they arise only from retained legacy copies. Obtain separate explicit approval for a concrete ID/revision deletion list; no such command is supplied or executed by this tool.
5. A future cleanup implementation should revision-guard and atomically delete only the approved old graph, respecting strong-reference dependencies. Never delete by type, wildcard, all drafts, asset ID, or a stale receipt. Then re-run anonymous audit, full integrity/reference checks and clean CMS browser checks before resuming authoring. Retain backups; a history restore/rollback is separately approved work, never an automatic replacement of the dataset.

## Preparation validation

The regression suite covers six inaccessible Programs becoming six public root records, current edits/unknown fields, nested weak/strong and cross-dataset references, settings drafts, published/draft pairs and draft-only records, unchanged asset/crop/approval fields, Journal/Gallery identities, occupied target counterparts, slug/sourceId collisions, owner edits and concurrent additions, stale/missing confirmation or permissions, denied server validation, idempotent retries, corrupt/incomplete backups and path traversal. It never uses a real credential or executes a live mutation.

The initial preparation had no configured repair credential and could not run authenticated inventory/preflight. During the separately authorized execution, an existing credential was entered through masked local input, its full-path ACL was verified read-only, and inventory, permission preflight, repair and exact post-repair verification completed successfully. Public counts are now 6 Programs, 3 Events, 3 Journal entries, 7 FAQs, 12 media documents and 1 settings singleton, with no unreadable references. All 12 media records remain pending, disabled and consent-unconfirmed; zero photos/collections are exposed. All 31 legacy records remain.

Preparation checks on 2026-11-04: **24 CMS tests, 4 desktop/mobile workerd browser tests and the SVG source regression check pass**. Lint, application and Studio TypeScript checks, Studio schema validation (zero errors/warnings), Studio build, isolated Next.js/OpenNext CMS preview build, bundle validation and Wrangler deployment dry run pass. OpenNext reports its usual Windows support warning; no deployment was performed. The tokenless live audit fails on the expected existing private-path references. No authenticated live inventory, mutation permission preflight or repair was run; no repair credential was configured.

Execution follow-up: the sandbox blocked native Node requests with `EACCES`, producing the original `fetch failed` message on the query/export API. The identical GET requests succeeded from the approved network-enabled terminal. The tool now reports the exact request URL and underlying network error without credential headers. Three further regression tests cover raw original downloads, reserved system records and safe network diagnostics (27 CMS tests total).

# Production preparation validation

Throwaway `feat/sanity-cms` snapshot; patch only. No commits, pushes, Sanity mutations/deletions, deployments or domain operations. No existing regression tests removed. No external LLM API spending or delegated workers. Caller must independently review the patch before integration.

## Completed

- Read-only HTTPS comparison of eight legacy resources; evidence and decoded source copies retained. Gallery script/index is unchanged after whitespace normalization.
- Tokenless published Sanity audit: 6 Programs, 3 Events, 5 Updates, 14 media, 7 FAQs, 1 settings; no unreadable published references. Exact observed IDs/revisions recorded separately. Private inbound references remain unknown.
- Targeted existing content/duplicate/repair tests plus new production planner/config/redirect tests: **33 passed**, zero failed. Six new tests check pending photo proposals without mutation, preserved crop, occupied proposal IDs, incomplete exports/asset cleanup rejection, full nested weak inbound reporting, draft archives without invented dates, exact legacy redirects and isolation configuration rejection.
- Application TypeScript: `tsc --noEmit --incremental false` passed. This is typechecking, not Next route generation or a build.
- Targeted ESLint for new scripts (explicitly unignored), Worker helpers and tests passed; one inherited unused local in the copied build script was removed afterward. New scripts formatted with repository Prettier.
- New production build script syntax checked with `node --check`. Configuration validator exercised locally by tests; no Wrangler server operation was run.

The worker default Node was 18; checks used a temporary official Node 22.22.0 runtime under ignored `.tmp/toolchain`. Root dependencies installed with `npm ci` and temporary cache. No system environment changed. No Studio dependencies were installed.

## Blocked or deferred — not passed

- **Authenticated migration/cleanup dry-run**: no full-read credential available. Current drafts/private dotted IDs/revisions and all inbound references cannot be certified. Public counts must never stand in for an authenticated export.
- Existing `sanity-backup.tar.gz` contains zero-byte data.ndjson, empty assets metadata and no image files; unusable for recovery. Fresh verified raw + original asset backup required.
- **Studio type/schema/build**, **Next route generation/build**, **OpenNext production build**, **Wrangler bundle/dry-run** and **compiled Worker/browser tests** were not run. These require the caller's `ld` workflow and a representative content review first. No built bundle exists in this snapshot. See the launch checklist for exact commands and scenarios.
- Full raw import/deletion verification and restore rehearsal require later explicit authorization and a separate safe target; no live executor is supplied.
- Independent Codex review/integration remains with the caller. This worker made no nested worker calls and cannot commit/push the read-only Git snapshot.

Launch stays blocked until these checks, owner content/rights acceptance and a separately approved cutover are complete. The premium site design and live demo/CMS preview were not altered.

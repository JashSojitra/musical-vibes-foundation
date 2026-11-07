# Owner CMS redesign validation

Validated in the caller's throwaway snapshot with Node 22.23.4. No commits, pushes, deployment, live Sanity mutations, permission changes or demo changes were performed. The snapshot has a detached HEAD; the caller must review/apply this patch only on `feat/sanity-cms`.

Implemented:

- Seven owner navigation entries, with Homepage and contact settings sharing the existing singleton. Optional story fields are collapsed.
- Native multi-image story arrays, ordering, single cover validation, optional descriptions/captions and decorative images. New stories receive an address automatically; existing addresses and redirect checks remain intact.
- One batch rights confirmation, cleared whenever the photo input changes. Unconfirmed uploads fail closed. Existing Photos retain their separate approval and visibility requirements.
- Shared published-story Journal/Gallery projection, optional Gallery placement and homepage story selection. Homepage hero, copy, CTA, Programs and Events use existing layout components.
- Offline dotted-ID candidate inventory; no automatic merge, deletion or repair.
- Original heavily edited files are retained under `archive/owner-cms-originals/`.

Checks:

- ESLint: passed.
- Next route generation and TypeScript: passed.
- Studio TypeScript: passed.
- Studio build: passed.
- Studio schema validation: zero errors, zero warnings.
- CMS unit/regression suite: 30 passed.
- Next production and OpenNext build: passed.
- Separate CMS preview Next/OpenNext build and Wrangler local dry-run: passed.
- CMS Worker/browser integration: six passed, desktop and mobile, including a 24-photo update without an Event, owner homepage selections, cover selection, Gallery derivation and rights withdrawal.
- Studio lockfile repaired by adding missing CLI peer dependency entries; `npm ci --dry-run` passes. Existing locked package versions and platform metadata are preserved.

The full existing Worker/browser suite passed: 105 passed, 11 skipped (desktop, tablet, mobile and small mobile). Actual signed-in Studio bulk uploads and the rights-reset input were not exercised against production because this task prohibits live data changes. The code uses Sanity's native upload/array editor; schema, types and build checks cover integration statically.

Independent Codex review was attempted but could not initialize its app-server client because the worker's Codex state filesystem is read-only. Independent review remains for the caller before integration.

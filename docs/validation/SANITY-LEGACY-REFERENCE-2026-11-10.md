# Remaining legacy reference: read-only diagnosis and proposed correction

Target: `6jpdhhxg/production`, API `2026-11-01`. Reported failure: Actions run `42911931099`, commit `dc7ce802`, branch `feat/sanity-cms`.

Anonymous published query and Doc API checks on 2026-11-10 identify exactly one inaccessible local reference among 36 public content documents (6 Programs, 3 Events, 5 Updates, 14 Photos, 1 Settings, 7 FAQs):

| Source | Value |
| --- | --- |
| Document | `5616f846-7b1b-4264-9c96-e76c0fe846e6` |
| Type/title | `journalEntry` / `Test 8th november` |
| URL | `/updates/test-8th-november` |
| Created / updated | `2026-11-09T00:32:43Z` / `2026-11-09T00:37:14Z` |
| Observed revision | `Weiss0T6IziVTCaiuSa2NZ` |
| Field | `event._ref` |
| Inaccessible target | `event.seniors-club-christmas-2025` (Doc API reason `permission`) |
| Public counterpart | `mvf-ZXZlbnQuc2VuaW9ycy1jbHViLWNocmlzdG1hcy0yMDI1` |

This is a newly authored UUID Update, created after the November 4 ID migration, rather than the retained legacy Update graph. The public counterpart has `sourceId: event.seniors-club-christmas-2025`, slug `seniors-club-christmas-2025`, and title `A celebration in good company`. Its image/gallery references use public IDs. The old ID encodes to this same public ID under `publicContentId`. The unfiltered Studio Related event picker allowed the legacy target to be selected. Public reads establish the current inbound source, but cannot establish who selected it or inspect private drafts/retained owner edits. No authenticated inventory was available in this job.

The existing one-time `planRepair` intentionally aborts when a public counterpart already exists. Do **not** rerun the bulk ID repair or seed importer: all legacy copies were retained, and their public counterparts already exist. No clone, replacement, deletion, URL change, or image reupload is needed for this failure.

## Separate approval required: proposed mutation only

First obtain a fresh authenticated backup with the existing repair backup workflow, including drafts and original assets. Inspect the source, its draft (`drafts.5616f846-7b1b-4264-9c96-e76c0fe846e6`), target, and all inbound references. Preserve every other field and any owner edits. If the published revision differs, stop and review the new record; do not silently substitute a revision. A draft, if present, requires separate inspection and a separately reviewed revision-guarded patch of the same field **only if it has the same bad reference**. Never publish or replace a draft as part of this correction.

After explicit approval, the proposed published-only transaction body is:

```json
{
  "mutations": [
    {
      "patch": {
        "id": "5616f846-7b1b-4264-9c96-e76c0fe846e6",
        "ifRevisionID": "Weiss0T6IziVTCaiuSa2NZ",
        "set": {
          "event._ref": "mvf-ZXZlbnQuc2VuaW9ycy1jbHViLWNocmlzdG1hcy0yMDI1"
        }
      }
    }
  ]
}
```

Use the owning authenticated workflow, server dry-run, and exact approved revision before any write. This document is not approval. The patch changes only the reference leaf, retaining reference metadata, photographs, body, dates, slugs, other relationships, and unknown fields. Retained duplicates remain untouched. Verify the resulting authored-field diff and backup integrity after any separately approved execution.

## Prevention and verification

All Studio content-reference pickers now filter for root IDs and normal root drafts; their field validation rejects dotted reference targets, including pasted legacy references. Normal new records and drafts of root records remain selectable. Existing invalid references receive a validation error without automatic modification. Image asset fields remain Sanity image fields. These changes take effect in the hosted Studio only after a separately authorized Studio release.

The anonymous audit still fails for this live dataset. It now checks **all** local reference IDs (including missing root IDs), batches Doc API requests, and reports owning document, revision and exact field path. External dataset references are excluded from local resolution. No token or permission workaround was introduced, and the live test's empty-omission assertion is unchanged.

Worker checks: 34 targeted CMS tests passed across content adapters, duplicates, public IDs, repair safeguards, deployment configuration and new reference validation/origin tests. One repair test initially needed the absent ignored `.tmp` directory; it passed after creating that directory. Studio TypeScript passed. Content tests cover published/draft isolation, event dates, Gallery relationships, approved media, embedded images, asset existence projection and old-slug lookup. Source inspection confirmed `/updates/[slug]` remains dynamic and redirects previous slugs, `/journal` redirects to `/updates`, and `/journal/[slug]` resolves the adapter's canonical Update slug. The actual Sanity query API accepted the new picker filter and returned the three public Events. Anonymous audit reproduced the exact permission failure above.

Not run here: full Next/OpenNext or Studio builds, generated-bundle validation, Wrangler dry-run and browser suites; this snapshot has no CMS preview bundle. Independent remote review was not run from this worker. The caller should obtain independent patch review and run builds through `ld`, using Node 22.14+ (below 25): `studio:validate`, `studio:build`, `cf:build:cms-preview`, `cf:validate:cms-preview`, `cf:dry-run:cms-preview`, and the preview browser suites. After the separately approved dataset correction, rerun `sanity:audit:public` and `test:cms-preview:live`, including the affected Update/Event links, images, Journal redirects and Gallery on desktop/mobile. Keep the anonymous audit blocking deployment until it passes. Nothing was committed, deployed, written to Sanity, deleted, or changed in DNS.

# Publishing workflow patch — 2026-11-10

Snapshot only, intended for `feat/sanity-cms`. No commit, push, deployment, token access, production mutation, document creation, permission changes or content migration performed.

## Changes

- Studio uses the official observable Sanity asset upload API and native array patches. One picker accepts 20+ files, uploads sequentially, shows local thumbnails/progress/errors, retries failures and preserves existing keyed images. Native image tiles retain editing, removal and drag ordering. Cover radios patch keyed fields; unset cover uses the first image. Descriptions/captions remain optional.
- Embedded photos follow published Update visibility. The obsolete rights field is hidden/read-only to preserve stored data without unknown-field warnings; its reset behavior and public gate are removed. Legacy media approval and publication flags remain mandatory.
- `/updates` and `/updates/[slug]` are canonical, including metadata/sitemap/structured data/navigation. `/journal` permanently redirects; old article URLs resolve stored slug history directly to the current Update address. Stored IDs/types/slugs and collection IDs remain unchanged.
- Update listings and homepage cards show photo thumbnails with neutral no-image treatment. Articles show the selected cover once and the remaining ordered images. Context-only alt fallbacks explicitly say a description was not provided; decorative images have empty alt.
- Multiple Updates can share an Event. Article/Event/Gallery links derive from the published snapshot. Collection removal, image removal/reordering and unpublication require no duplicate documents/assets. Homepage settings and existing design components remain in use.

## Read-only production diagnosis

Anonymous published API reads of `6jpdhhxg / production` on 2026-11-10 returned four Updates, all with `storyPhotos: null`. The owner test Update `test-8th-november` references two existing media records: `06195726-d7cc-45df-b0f8-9772367129bc` and `2bbaa698-b9c9-494f-a0d4-1bb0618dd5c3`. Their assets exist, but both records are `editorialApproval: pending` and `publicationEnabled: false`. Hiding these images is the required legacy protection, not an embedded-array shape failure. No permissions were changed. Future embedded uploads would also have been incorrectly hidden by the removed batch checkbox gate.

The public audit found an unreadable dotted reference `event.seniors-club-christmas-2025` on that test Update (`permission`). Repaired archive Updates reference `mvf-*` records. No IDs or references were rewritten. Public queries cannot inventory protected dotted duplicate documents; use the existing offline `sanity-duplicates.ts` against a privately held export to detect retained duplicates. Do not remove them.

Public response projections are recorded in `tests-cms/fixtures/published-*.json`; regression tests preserve the actual legacy payload behavior. Embedded-upload regression coverage is synthetic because no published embedded payload was available. Private drafts were not accessed.

## Executed checks

Using Node 22.22.0 (the host default Node 18 cannot run this project's dependencies):

- ESLint: passed.
- Next route type generation + TypeScript: passed.
- Studio TypeScript: passed.
- CMS tests: 32 passed (includes captured published payload, draft/future visibility, legacy approval, cover/order/removal, two recaps, Gallery/Event relationship and unpublication).
- Chromium fixture (`npm run test:studio-upload`): passed. Exercises the actual Studio input with a mocked Sanity transport: one 24-file selection, an injected failure/retry, existing-image preservation, asset reference persistence and exactly one chosen cover. No authentication or uploads to production. Native Studio drag/drop and document persistence are outside this mock.
- `sanity schema validate`: attempted, blocked by installed optional native binding failure. CLI exits successfully despite printing the error; **not a schema-validation pass**.
- Public API audit: correctly reports the unreadable legacy Event reference described above.

## Caller checks and release steps

Do not deploy until the caller reviews/integrates the patch and completes validation. Heavy builds/test runs must use the project's `lab-dispatch` skill and `ld`:

1. With the supported Node version and complete platform-native dependencies, run Studio schema validation/build, Next build, OpenNext build and the relevant Workers/CMS-preview browser tests. Updated browser assertions cover canonical routes, legacy redirects, embedded checkbox independence, 23 remaining gallery images, and unpublication. These build-dependent browser tests were **not run** in this memory-limited snapshot.
2. In an authenticated local/test Studio, verify a real 20+ image selection persists after reload; native drag ordering, optional image edits, cover selection, Publish/republish and Unpublish. Verify mobile/desktop list, homepage, article, Event and Gallery rendering. The fixture does not substitute for this authenticated check. Do not use production writes for testing without separate authorization.
3. Obtain independent review of the final patch. No additional remote worker/review was launched from this bounded job.
4. After approval, redeploy **both Studio and the CMS-mode OpenNext Worker**, using the existing project deployment workflow. No dataset migration, separate Gallery creation, reupload of existing photos, DNS change or dependency upgrade is needed. Existing pending legacy photos still require their ordinary explicit owner review before display.

The Studio schema/build native-binding issue and authenticated end-to-end validation remain release blockers. The legacy test Update's inaccessible Event relationship remains an owner/maintainer content issue, preserved intentionally.

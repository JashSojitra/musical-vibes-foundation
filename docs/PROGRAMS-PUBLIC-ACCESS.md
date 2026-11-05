# CMS preview: inaccessible imported content

## Reproduction and root cause

The deployed `/programs` response and clean Chromium desktop/mobile sessions show zero program rows and zero program navigation links. Cache-busted requests give the same result, with `Cache-Control: no-store`, no Age/ETag and fresh response dates. Events/Journal have no public collections/articles either.

The exact supplied count URL, requested without credentials, returns `result: 0`:

```text
https://6jpdhhxg.api.sanity.io/v2026-11-01/data/query/production?query=count(%2A%5B_type%3D%3D%22program%22%5D)
```

Explicit published/raw perspectives and API versions 1, 2021-10-21, 2025-02-19 and 2026-11-01 also return zero anonymously readable Programs. The Worker's exact multi-type query returns only Site Settings. A browser/Studio session returning six is therefore using a different access context; the query URL alone does not establish anonymous visibility.

The original importer used `program.healing-through-music`, `event.diwali-celebrations-2025`, `journal.event...`, `media.song`, and `faq.001` as Sanity `_id` values. **This was an implementation error.** Sanity interprets periods as path separators, and anonymous public-dataset access is restricted to root IDs. See [Sanity IDs and paths](https://www.sanity.io/docs/content-lake/ids).

The public Doc API explicitly reports `reason: permission` for those referenced IDs, while returning `siteSettings`. Site Settings still contains the dotted program/event references. Thus the missing documents are filtered by Sanity before SSR or `mapSanity` sees them. The existing published perspective, project/dataset/version contract, slug mapping and no-store strategy are not responsible for dropping six returned records. Switching to raw perspective, purging caches or inserting local fallback content would not repair access.

The repository/runtime contract remains tokenless `6jpdhhxg/production`, API version `2026-11-01`, published-only reads. Direct remote binding/secret inspection was unavailable locally because no Cloudflare API credential is configured; no credentials were requested, created or changed. Public deployed responses and actual tokenless dataset/Doc API calls establish the read boundary failure independently.

## Repository correction (no live migration)

- Future import plans use deterministic root-safe `mvf-<base64url(source ID)>` storage IDs. Existing logical IDs stay in `sourceId`, preserving route slugs and stable Journal/Gallery identity. References use the corresponding root storage IDs. Site Settings stays `siteSettings`.
- The importer refuses existing legacy IDs/references before uploading or writing. It does **not** silently clone existing data under new IDs or repair references. Do not use `sanity:migrate:write` to fix this dataset.
- New regression tests reproduce six stored dotted-ID Programs becoming zero under anonymous ID rules, then verify six root-ID Programs map correctly with unchanged logical IDs/slugs. The actual dry-run manifest is checked for all 32 public-safe IDs and valid references.
- Fixture HTTP responses now apply anonymous ID filtering. Public fixture IDs and stable `sourceId` values verify Programs, Events, Journal, navigation and Gallery without assuming private documents are readable.
- `npm run sanity:audit:public` detects permission-denied references in the real dataset. The live browser smoke check now rejects this failure instead of considering HTTP 200 with an empty CMS a successful content validation.

## Validation and remaining blocker

Lint, TypeScript, the isolated Next.js/OpenNext build and Wrangler dry run pass. All **14 CMS/unit tests**, **4 workerd browser tests**, and the SVG source guard pass. The workerd tests verify Programs, Events, Journal, navigation and Gallery with root-safe IDs and actual anonymous-access filtering, not unrestricted fixtures.

The real public audit and **both live desktop/mobile smoke tests fail at the new permission check**: Programs/Events/Journal/media/FAQs are not anonymously readable, and five featured references are permission-denied. This is the real unresolved data-access condition, not a passing live-content verification. Clean browser checks against the actual deployed Worker also still show zero Programs/Journal entries/navigation program links. Existing deployed content cannot be made visible by a code-only redeployment under the constraints forbidding migrations, content edits and token changes.

Resolving existing storage IDs and references requires a separately authorized, backed-up data repair, or a separately approved authenticated read design. Neither was performed. The original untracked backup remains untouched. No Worker deployment, Sanity mutation, token/permission change or DNS change occurred.

After a separately authorized access/data repair makes the public audit pass, the exact manual redeployment is:

```bash
npm run sanity:audit:public
gh workflow run deploy.yml --repo JashSojitra/musical-vibes-foundation --ref feat/sanity-cms -f cms_preview=musical-vibes-foundation-cms-preview
```

The guarded workflow will stop at the strengthened live smoke check while the current data-access failure remains. Redeploying the existing private-path data alone will still show zero Programs.

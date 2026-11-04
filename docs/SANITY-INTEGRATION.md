# Sanity integration

The separate `studio/` package edits public dataset `production` in project `6jpdhhxg`. It is a Sanity Studio, not another Next.js app. `studio/schemas/index.ts` defines Journal, Events, Programs, Media Library (ordinary mediaItem documents, not Sanity's paid Media Library product), the Site Settings singleton and FAQs. Managed Sanity authentication is the only editor login.

## Source and publication policy

`CONTENT_SOURCE=local` selects the existing demo; an unconfigured legacy demo also remains local while cutover is pending. Once public Sanity configuration is present, omitting the source mode is an error, preventing accidental stale-local output from a CMS build. `CONTENT_SOURCE=sanity` selects the complete CMS snapshot. There is no error fallback, local/CMS union, generated Journal seed or local photograph substitution in CMS mode. An unavailable CMS fails visibly; a missing settings singleton fails with an actionable error. Neutral placeholders preserve layouts when a referenced public photograph is unavailable.

The official `@sanity/client` reads the published perspective server-side. Defense in depth also removes draft/release IDs. Journal dates use UTC days, exclude future/invalid dates, and remain separate from date-only event dates. Stable IDs/source IDs resolve references. Missing references are ignored, unknown article/event/program routes return 404, and previous slugs redirect permanently to the current slug. Studio validates slug collisions and requires preservation of the last published slug when it changes. Keep the complete previous-address list when renaming again.

Portable Text supports paragraphs, headings, quotes, lists, bold, italic and safe links in the existing editorial containers. Media uses the Sanity image CDN, original dimensions, crop/hotspot and a maximum source width of 1920; Next Image still supplies responsive widths through the existing Cloudflare image integration. Remote images are restricted to this project's production dataset. Only media with approval `approved`, visibility enabled, alt text and a resolvable image asset enters the public model. Page introductions, navigation, programs, event imagery and homepage photographs follow the same rule. Removed imagery gets a neutral placeholder where layout requires one; Gallery simply removes it.

The existing `createContentAdapter` derives Gallery collections from event-related published Journal entries. Collection IDs remain `journal-collection.<stable-journal-id>`; photographs are shared references. No gallery document type or second archive exists. Empty collections disappear. Standalone archive photos remain an explicit media flag; story-only photos default to false. Events previews the same collections and event detail pages link to related Journal entries.

## Refresh strategy and Cloudflare

CMS mode calls Next's `connection()` before reading, uses `cache: no-store`, and sets `useCdn: false` on the Sanity client. React `cache()` only deduplicates a snapshot within a render/request. All content routes, metadata reads, sitemap and robots therefore use request-time data in CMS builds. Dynamic slug routes accept newly published addresses without a rebuild. Local builds retain static generation and the existing static-assets incremental cache.

This deliberately uses **no persistent data/HTML cache and no webhook endpoint**. The next document request after publication, rename, unpublication or approval withdrawal reads Content Lake again. A page already open in someone's browser needs a refresh; cached browser assets and already downloaded public image URLs are not revoked. Do not add a Cloudflare Cache Everything rule to CMS pages. `SANITY_REVALIDATE_SECRET` is not consumed and no webhook needs configuring. No untested webhook invalidation is claimed.

[OpenNext documents that SSR works without caching configuration](https://opennext.js.org/cloudflare/caching). This avoids R2/KV/Durable Object bindings, cache-tag stores, queues and extra infrastructure. The tradeoff is one published snapshot query per server render (deduplicated within the request), additional latency and direct API quota use. Monitor Sanity usage as traffic grows. Consider tested bounded caching only if traffic warrants it; permission withdrawal must remain a release gate.

## Environment placement

| Variable | Local website / future website build | Cloudflare Workers runtime | Studio host |
| --- | --- | --- | --- |
| `CONTENT_SOURCE` | `local` for demo; `sanity` for CMS build | Same value as build | Not used |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `6jpdhhxg` | Same public value | Not used |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` | Same public value | Not used |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2026-11-01` (fixed, reviewed date) | Same public value | Not used |
| `SANITY_STUDIO_PROJECT_ID` | Not used | Not used | `6jpdhhxg` |
| `SANITY_STUDIO_DATASET` | Not used | Not used | `production` |
| `SANITY_API_WRITE_TOKEN` | Migration process only, temporary | **Never** | **Never** |

Copy root `.env.example` to ignored `.env.local`; copy `studio/.env.example` to ignored `studio/.env.local` as needed. Next configuration fixes the non-secret `CONTENT_SOURCE` per build, keeping static routing and runtime reads consistent. Switching a deployed local build to CMS requires a separately approved new CMS-mode build/deployment; a runtime variable alone cannot switch it. The demo build script explicitly fixes local mode even if the operator's shell is configured for Sanity. Public-prefixed Next variables are also substituted at build time; set them in the build environment as well as runtime. No read token, authenticated preview or custom preview login is implemented/required for public published reads. Optional preview tokens and secrets must not be added to public variables. A future preview implementation must be server-only and authenticated.

## Manual setup and cutover (not performed)

1. Confirm the project and public dataset in Sanity Manage. Confirm Free plan limits after the trial and invite the owner using managed authentication. Free currently provides Administrator and Viewer roles; an editing owner needs Administrator. Do not assume Growth Editor/custom roles exist. Only invite trusted editors because Administrator has broad project access.
2. Install with `npm ci` in the repository and `npm ci --prefix studio`. Run `npm --prefix studio run dev` for the owner interface at localhost:3333. Add precisely that origin to project API CORS, with credentials for Studio authentication. Server-side website reads do not need browser CORS or a write token.
3. Follow [SANITY-MIGRATION.md](SANITY-MIGRATION.md): back up, dry-run, explicitly write, verify, review permissions, then enable approved media. Keep the current demo in local mode throughout.
4. Re-run `npm run studio:validate`, `npm --prefix studio run typecheck`, and `npm run studio:build`. When separately authorized, run `npm --prefix studio run deploy`, authenticate, and choose an available `*.sanity.studio` hostname. Sanity-hosted Studio is the intended free hosting option. Add only the actual chosen HTTPS Studio origin to CORS with credentials. No deployment command has been executed by this integration.
5. Prepare a separately approved preview build using all CMS build variables above. Test the publishing checklist below in an actual Workers preview against the migrated dataset; then approve production cutover separately. Do not change DNS, credentials or existing hosting to test this branch.
6. Give the owner the Studio URL and [owner guide](SANITY-OWNER-GUIDE.md), revoke the migration token, retain private backups and monitor monthly API/asset usage.

## Validation and acceptance

Commands: `npm run lint`, `npm run typecheck`, `npm run test:cms`, `npm run sanity:migrate:dry`, `npm run build`, `npm run cf:build`, `npm --prefix studio run typecheck`, `npm run studio:validate`, `npm run studio:build`. Start `npm run start` for browser tests; `npx playwright test --config playwright.migration.config.ts` exercises the existing visitor suite. `npm run test:workers` launches local workerd and tests the same visitor flows. See [validation report](SANITY-VALIDATION.md) for actual results and boundaries.

Before live cutover, explicitly test on Workers: publish an event story with approved photos; see it in Journal, Gallery, homepage, Events and sitemap; follow links both ways; edit/reorder photos; rename with slug history and test 308 redirects; withdraw approval; unpublish/re-publish; check old/new slugs and 404s; check future publication, missing refs and empty collections; check a new program/event route; and inspect desktop/phone rendering, CDN image sizes and response Cache-Control. Check the sitemap after every transition. This live mutation cycle is pending migration authorization, not implied by local-mode browser tests.

The implementation uses public documents/assets, ordinary drafts and manual publication only. It does not depend on scheduled publishing, Content Releases, custom roles, private datasets, paid plugins or added paid infrastructure. [Sanity's current Free plan](https://www.sanity.io/pricing) has finite user, request, asset and bandwidth quotas; review Manage periodically. Uploaded assets and editorial documents must contain no sensitive personal data or private consent evidence. Editorial approval controls website display, not asset confidentiality.

Studio's scoped transitive overrides patch CLI tooling (`js-yaml`, `smol-toml`, `undici`, `minimatch`). Revisit them when Sanity updates its dependencies; verify schema/build before removing them.

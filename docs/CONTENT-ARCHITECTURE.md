# Content architecture — Release 4

## Working local demo

The typed adapter in `src/lib/journal.ts` is the public boundary for Journal and Gallery data. It reads the existing typed local foundation content. Three archive notes are migrated from documented 2025 event records without creating a second event archive or uploading any photographs again. Their Journal publication date is **November 3, 2026**, the date of this demo migration; gathering dates remain separate and visible. These are not invented current weekly updates.

`JournalEntry` supports `event`, `update` and `news` content. `journalSeed` supplies the archive notes for the current demo. The adapter accepts arbitrary typed Journal entries, so later local notes need not be tied to a historical event. Source edits become visible when the local app rebuilds; there is no publishing dashboard or live CMS connection.

### Local entities and relationships

| Entity | Identity and fields |
| --- | --- |
| Journal entry | Stable `id`; unique route `slug`; title, excerpt, paragraphs; `status`; `publishedAt`; kind; optional `eventId`; `programIds`; ordered `photoIds`. |
| Event | Stable `id`, route slug, actual gathering date/status, existing description and image references. Upcoming events drive the Events attendance section. Past event routes remain available for compatibility and supply the migration facts. |
| Program | Stable `id` independent of its route slug; existing program content and imagery. Journal references resolve by ID. |
| Media | One existing asset record per stable ID; image path, dimensions, alt text, caption, source and focal position; editorial `publicationStatus` and `approval`; original consent status retained. |
| Gallery collection | A read-time projection, not another persisted archive table: `journal-collection.<journal.id>`, the Journal title, approved photo references, and a link to the current Journal slug. |

The standalone collection `standalone.community-archive` preserves existing Gallery photographs using an explicit `standaloneGallery` flag. New Journal-only photos use `false`, so an approved asset attached only to a draft article cannot leak into the standalone archive. An image may belong to both a published article collection and the standalone archive, but both reference the same record and binary. The all-photographs Gallery uses a deduplicated union of eligible standalone and published collection references.

### Public visibility

- A Journal note must be `published`, have a valid publication-date shape and a publication date no later than the current UTC date. Draft, unpublished and future-dated notes are excluded from public lists, detail resolution, static params and the sitemap.
- A photo must be `publicationStatus: published` and `approval: approved` before the Journal/Gallery adapter exposes it. Missing references are ignored and duplicate photo IDs are removed.
- Only published event-related entries with an event ID and at least one eligible photograph produce a derived collection. Plain news or updates do not create empty Gallery collections.
- Title, slug, photo-list, media-approval and publication-state changes are reflected by a fresh adapter projection. Collection IDs remain stable across title/slug changes.
- An unknown Gallery query ID falls back to the complete public archive. `/gallery?collection=<stable-id>` selects a collection; the canonical URL stays `/gallery`.
- If no collections exist, the Events teaser still renders its direct Gallery CTA without invented imagery. If only standalone content exists, that collection remains eligible for the teaser.

**Editorial visibility is not a consent claim.** The retained archive is marked visible/approved for this local demo because it is the existing site material requested for preservation. The original `consent: unconfirmed` value is unchanged. Owner verification of permissions remains a launch requirement. Existing unrelated program/editorial pages retain their current asset usage; a future CMS migration must apply the owner-approved media policy consistently across every page.

## Future Sanity model — planned, not configured

Prefer Sanity Content Lake as the primary content store, with Studio as the owner's eventual editing interface. Do not add a separate SQL database for the current editorial requirements. Sanity documents have stable identifiers suitable for these relationships; see [documents](https://www.sanity.io/docs/content-lake/documents).

Suggested document schemas:

```text
journalEntry
  _id, _type
  title, slug, excerpt, body (Portable Text)
  kind: event | update | news
  publishedAt
  event: reference(event), optional
  programs: array(reference(program))
  photos: ordered array(reference(mediaItem))

event
  _id, title, slug
  startsAt, endsAt?, location?, attendance/status information
  description, programs: array(reference(program))

program
  _id, title, slug, category, body and existing program fields

mediaItem
  _id, image: reference to a Sanity image asset
  alt, caption, source/provenance, crop/hotspot
  editorialApproval: pending | approved | rejected
  publicationEnabled
  standaloneGallery: boolean
  consent/rights review information and owner verification
```

Keep the image binary in Sanity's asset store once. Use references to the same `mediaItem` from Journal and standalone Gallery content; never upload another copy to create a collection. Import stable local IDs through a deterministic migration map and retain a source/export manifest.

Do **not** create a `communityArchive` dataset, a materialized document per derived Journal collection, or Events-only preview fields. Query Journal + media, derive collection objects in the adapter, then reuse those objects for Gallery, article links and the Events teaser.

### Publication and slugs

Future public reads must use the published perspective. Sanity separates a draft from its published counterpart; editing a draft does not replace the public version until publication. The local `status` union simulates those outcomes; map it at the adapter boundary rather than exposing raw draft IDs. See [drafts and versions](https://www.sanity.io/docs/content-lake/drafts-and-versions).

Use permanent IDs for relationships and collection query IDs. Slugs are unique human-readable route keys, not relationship identifiers. On slug changes, retain a previous-slugs/redirect strategy and invalidate both old and new URLs. Never match on title. Validate required alt text, event/program references, publication dates and media permissions before publishing. A published article may retain its text if every image is withdrawn, but its empty derived collection must disappear.

## Caching and revalidation

Today, static local Journal/home/Events outputs refresh on rebuild. Gallery resolves its query on request. There is no external cache, webhook endpoint or live owner action in this demo.

For Sanity, fetch the published perspective server-side and keep preview/draft access separate and authenticated. Introduce cache tags keyed by Journal ID, media ID and shared collection projection. A signed, idempotent publication/unpublication/media-change webhook should invalidate affected Journal routes, `/journal`, homepage previews, `/gallery`, `/events` and the sitemap. Apply the same invalidation for title/slug changes and media approval revocation, not just article publication. Use bounded TTL recovery for missed notifications and prioritize permission withdrawal. [Sanity webhooks](https://www.sanity.io/docs/content-lake/webhooks) supply the future notification mechanism; none is configured now.

## Image delivery

The demo keeps existing curated WebP files and Next Image responsive sizes, lazy loading and priority only where useful. The Journal/Gallery projection passes references, not copied image files.

Future delivery should retain asset dimensions and crop/hotspot metadata and request bounded responsive widths from Sanity's CDN. Use format negotiation for browser images and avoid upscaling small originals. Pin a predictable crawler-friendly format for social preview images. See [Sanity image transformations](https://www.sanity.io/docs/apis-and-sdks/image-urls). This is a delivery plan, not a configured remote-image domain or CDN integration.

## Owner workflow and operational considerations

1. Write a Journal draft; choose an event relation only when it actually describes an event, and link relevant programs.
2. Select existing media references or upload a new source once. Supply accurate alt/caption/source metadata and verify rights before editorial approval.
3. Preview the article, its derived collection and linked program context on desktop and phone. Check the actual event date separately from publication date.
4. Publish in Studio. The adapter exposes the article and eligible Gallery collection after cache revalidation; Events automatically previews the same collections.
5. Unpublish or withdraw media approval when needed. Revalidation removes the corresponding public projection. Review asset delivery/caches separately if a binary must be withdrawn from public availability.

No owner dashboard is built in Release 4. Future Studio access, roles, preview authentication and webhook credentials require separate setup.

Keep the local data/media manifest and release tags in Git. For Sanity, schedule regular dataset exports with asset references and separately preserve required original assets; store backups privately, define retention with the owner and test a restore before relying on the process. Export both IDs and slug history so restored relations are deterministic.

Storage consists of small editorial documents plus the image asset store/CDN. Monitor upload sizes, asset duplication, transformation requests and bandwidth as the archive grows. A separate database would only be justified by a concrete later requirement such as transactional bookings; it is not needed for Journal, Gallery or event teasers.

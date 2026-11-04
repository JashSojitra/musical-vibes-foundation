# Release 4 validation

## Implemented scope

The approved visual system, cinematic homepage hero, Three.js scene, GSAP story/program interactions, authentic assets and multi-page architecture are retained.

- The arrow-only desktop trigger is now **More**, retaining the Programs panel. It supports hover, click, ArrowDown, Tab, Escape and outside dismissal. Mobile uses an explicit More program disclosure inside the existing menu. Journal appears in desktop/mobile navigation and the footer; parent-route active states are retained.
- A branded message/contact shortcut links directly to `/contact`, has a 50px touch target, accounts for mobile safe areas, hides on Contact and while modal dialogs are open, and respects reduced motion. Its label appears on desktop hover/focus rather than covering reading text at rest. The new mobile Journal reading layouts reserve corner space around it.
- `/journal` and three archive-detail pages include a featured note, recent notes, photography, publication dates, distinct gathering dates, related programs, collection links, canonical/Open Graph/Article metadata and sitemap entries.
- Gallery collections derive from published event-related Journal entries using stable IDs and existing approved photo records. Title/slug/photo/status changes feed the same projection. Existing standalone photos remain available. A Journal-only photo cannot appear through the standalone Gallery while its entry is a draft.
- Events preserves the exact archive heading **Good times. Beautiful memories.**, its original introductory text and typography. Independently maintained featured archive/cards are removed from that page and replaced with a compact Gallery-derived preview and the direct **Explore our memories** CTA. There is no new archive dataset or Events-preview-only CMS field.
- The homepage's former event-archive preview is now the latest published Journal preview. The hero and signature sections retain the approved design.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; 26 generated pages including Journal |
| `npx playwright test --config playwright.release4.config.ts` | 56 passed across four viewport projects, including the content-model cases and previous premium/Stage A regressions |
| Prettier and Git whitespace checks | Passed |

The Release 4 configuration uses 1440×1000 desktop, 768×1024 tablet, 390×844 mobile and 360×800 small-mobile viewports. Screenshot capture uses a 1000px desktop/tablet height and an 844px phone height, at DPR 1, against the optimized local production build.

Coverage includes:

- All 21 public page/program/event/Journal URLs, canonical metadata, descriptions, headings, navigation and floating Contact visibility/target size. Unknown Journal slugs return 404.
- More hover, pointer travel into the panel, click toggling, keyboard entry, Escape/focus restoration, mobile disclosure and Journal navigation.
- Journal → Gallery collection → Journal round-trips, matching titles by stable collection relation, related program links, and Events → Gallery navigation.
- Draft/unpublished/future-dated exclusion, missing and duplicate image references, approval withdrawal, standalone preservation, Journal-only draft-photo isolation, title/slug/photo changes and empty collections. Model tests use isolated fixtures, not fabricated public content.
- Existing WebGL initialization, pause/resume, reduced-motion preference changes, unavailable-WebGL artwork, desktop pinned cards and tablet/mobile in-flow layouts.
- Existing community album, Gallery filtering/lightbox keyboard controls, contact validation and FAQ behavior.
- Real image decoding during screenshot capture and browser error/horizontal overflow checks at all four widths.

Raw results: [automated test report](validation/release4/test-results.json), [capture report](validation/release4/capture-results.json).

## Actual screenshots reviewed

| View | Desktop | Tablet | Mobile | Small mobile |
| --- | --- | --- | --- | --- |
| Preserved hero / Contact shortcut | [1440](validation/release4/1440-home.png) | [768](validation/release4/768-home.png) | [390](validation/release4/390-home.png) | [360](validation/release4/360-home.png) |
| More / mobile navigation | [1440](validation/release4/1440-more.png) | [768](validation/release4/768-more.png) | [390](validation/release4/390-more.png) | [360](validation/release4/360-more.png) |
| Homepage Journal preview | [1440](validation/release4/1440-home-journal.png) | [768](validation/release4/768-home-journal.png) | [390](validation/release4/390-home-journal.png) | [360](validation/release4/360-home-journal.png) |
| Journal index | [1440](validation/release4/1440-journal-full.png) | [768](validation/release4/768-journal-full.png) | [390](validation/release4/390-journal-full.png) | [360](validation/release4/360-journal-full.png) |
| Journal article | [1440](validation/release4/1440-article-full.png) | [768](validation/release4/768-article-full.png) | [390](validation/release4/390-article-full.png) | [360](validation/release4/360-article-full.png) |
| Events Gallery teaser | [1440](validation/release4/1440-events-gallery.png) | [768](validation/release4/768-events-gallery.png) | [390](validation/release4/390-events-gallery.png) | [360](validation/release4/360-events-gallery.png) |
| Selected Gallery collection | [1440](validation/release4/1440-gallery.png) | [768](validation/release4/768-gallery.png) | [390](validation/release4/390-gallery.png) | [360](validation/release4/360-gallery.png) |

There are 48 production screenshot artifacts. The initial visual pass led to tighter face-aware collection crops, a smaller unobtrusive Contact control, mobile reading gutters, and a fix for Escape dismissal after pointer-only opening. The content review also gated new Journal/Gallery cover art and article social images through the public adapter and added text-only layouts when images are withdrawn.

## Demo versus future functionality

The Journal notes are truthful migrations of the existing 2025 event archive. November 3, 2026 is their Journal-note publication date, not a fabricated historical event/publication date. There are no invented upcoming events or weekly announcements.

The automatic relationships work in the typed local adapter. Editing local source and rebuilding updates all projections. Sanity Studio, owner publishing, authenticated previews, external webhooks and live cache invalidation are future work, not a working feature of this demo. See [content architecture](CONTENT-ARCHITECTURE.md) and [demo readiness](DEMO-READINESS.md).

Archive-photo resolution/lighting remains authentic. Consent status remains unconfirmed and must be reviewed before public launch. Browser verification used Chrome viewport emulation; physical phones, Safari/Firefox and low-end GPU/frame-rate performance were not tested.

No push, deployment, hosting/DNS change, Sanity configuration, separate database or owner dashboard was introduced.

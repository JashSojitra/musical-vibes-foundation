# Release 2 architecture

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Overview and signature sculpture |
| `/about` | Story, mission, values, people served |
| `/programs` | Numbered program explorer |
| `/programs/healing-through-music` | Music program |
| `/programs/meditation-and-yoga` | Mindful living program |
| `/programs/senior-engagement-activities` | Senior engagement program |
| `/programs/nutrition-and-health-guidance` | Nutrition program |
| `/programs/online-workshops-and-talks` | Learning program |
| `/programs/food-drives-for-the-needy` | Food support program |
| `/events` | Upcoming status and historical archive |
| `/events/seniors-club-christmas-2025` | December 8, 2025 archive |
| `/events/diwali-celebrations-2025` | October 16, 2025 archive |
| `/events/seniors-club-picnic-2025` | August 21, 2025 archive |
| `/gallery` | Filterable photographic archive |
| `/get-involved` | Participation and support paths |
| `/contact` | Verified details and email preparation |
| `/faq` | Searchable answers |

Unknown routes and unknown detail slugs return a designed 404. The sitemap lists implemented destinations only. Historical event location is omitted where it is not verified. The picnic location comes from the original event flyer.

## Content boundary

- `src/types/content.ts`: explicit `SiteContent`, `Program`, `CommunityEvent`, `MediaAsset`, `FAQ`, and settings contracts.
- `src/data/content.ts`: verified/adapted local text and structured program/event records.
- `src/data/media.ts`: curated media IDs, descriptive alternatives, source URLs, dimensions, contextual captions, focal positions, and unconfirmed consent status.
- `src/lib/content.ts`: asynchronous server-side adapter functions. Pages consume this interface rather than a CMS client.
- `src/lib/metadata.ts`: page-specific metadata builder and shared Organization data.

These are local records, not a configured Sanity project. No CMS credentials, studio, client library, schema installation, or remote data writes were introduced.

## Rendering and interaction

`app/layout.tsx` owns the skip link, shared header, main landmark, motion boundary, Organization structured data, and footer. Page content and detail pages render on the server. Interactive client islands are limited to navigation, program previews, gallery/lightbox, FAQ search, contact validation, and the two visual studies.

`Motion` observes pathname changes, cleans up GSAP contexts, and places focus on the main content after client navigation. The header uses route links and active states. Desktop program disclosure supports Escape and focus departure. The mobile menu and gallery use native dialogs for modal semantics and focus containment. Gallery close restores the triggering button.

The scene is split into a lightweight `sound-sculpture.tsx` loader/fallback and dynamically imported `sound-scene.tsx`. A small WebGL2 support probe is released immediately; reduced-motion users skip it and the renderer import. No WebGL code is required by interior page components. The demand render loop invalidates while active, then stops when paused or offscreen; the canvas remains mounted offscreen to avoid recreating its resources on each scroll. Materials are disposed on teardown; Fiber owns geometry/canvas lifecycle. Static artwork and all meaningful content remain available without WebGL.

The SVG rhythm study uses deterministic, rounded coordinates so server and browser output match. Its three states are labelled visual interpretations, not audio measurements.

## Contact delivery

The form validates locally, then exposes a `mailto:` draft link. It makes no API request, stores no message, and never claims successful delivery. A real submission service is required before replacing this explicit email-draft workflow with a Send action. The launch implementation needs server validation, spam/rate controls, error handling, delivery observability, and an approved privacy/retention policy.

## Tooling and dependencies

Three.js, React Three Fiber, and Drei provide the requested scene. Playwright is a development dependency for isolated route, keyboard, responsive, and interaction tests. Prettier formats the new source. Sharp generates local photo derivatives. A compatible PostCSS override patches the existing stack; no framework major-version migration was needed.

Run the test suite against a running local server using `npx playwright test`. The configuration uses installed Chrome on this Windows workstation, supports `PLAYWRIGHT_BROWSER_PATH`, and otherwise uses a Playwright browser installation. Browser tests never use the owner's open tabs or submit external messages.

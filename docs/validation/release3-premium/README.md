# Release 3 — premium redesign review

This pass expands Stage A into a complete homepage composition and a shared visual system for internal page openings, navigation, program browsing, gallery filters, forms and editorial surfaces. Routes, organizational content, the original logo, the archive photography and SEO metadata are retained.

## References actually inspected

The documentation **and registry source** for all four supplied components were read directly. No reference component was installed or pasted into the application.

| Reference | What was adapted |
| --- | --- |
| [Sticky Scroll Cards](https://componentry.dev/docs/components/sticky-scroll-cards), [source](https://componentry.dev/r/sticky-scroll-cards.json) | The homepage program journey uses sticky, overlapping image-and-content cards with GSAP scroll scaling. It uses the existing native page scroll rather than adding Lenis or Framer Motion. At tablet/phone widths and with reduced motion, cards return to normal document flow. |
| [Layered Stack](https://componentry.dev/docs/components/layered-stack), [source](https://componentry.dev/r/layered-stack.json) | The community album uses three authentic photographs, persistent layers, deterministic poses and a spring-like transform transition. Previous/Next buttons work with pointer, touch and keyboard; the front photograph opens the existing gallery. |
| [Magnetic Dock](https://componentry.dev/docs/components/magnetic-dock), [source](https://componentry.dev/r/magnetic-dock.json) | Restrained pointer-responsive navigation labels inside stable link hit areas, inset active states, a floating glass header, and a redesigned Programs panel. No desktop icon dock, magnifying layout or generic app icons. |
| [Music Player](https://componentry.dev/docs/components/music-player), [source](https://componentry.dev/r/music-player.json) | Inspected and intentionally omitted. No authentic recording was supplied, so there is no pretend player, unrelated music, vinyl widget or autoplay. |

Kage remains the benchmark for depth, authored framing and visual continuity. The existing Three.js/GSAP implementation is retained and framed as an atmospheric score around real community photographs. Stageshow's framing, hierarchy, strong stills and width-specific composition principles continue to guide the page; no Stageshow kit dependency is used.

## Palette and typography

The foundation logo inspired a richer material system, rather than a single beige/dark-purple pair:

| Token | Colour | Role |
| --- | --- | --- |
| Plum | `#32143e` | Navigation actions and deep branded surfaces |
| Deep aubergine | `#1f102b` | Cinematic ground |
| Royal purple | `#5d3380` | Elevated colour family and state treatments |
| Muted orchid | `#bd9bc6` | Editorial accents and lighter supporting surfaces |
| Champagne | `#e3c594` | Primary invitation and restrained highlights |
| Warm ivory | `#faf7f4` | Paper and reading surfaces |
| Charcoal ink | `#2a1b31` | Body copy and light-surface contrast |

Instrument Serif is self-hosted in regular and italic styles, with the SIL Open Font License retained in `public/fonts`. No external font request is required at runtime. Display spacing and scale were adjusted after screenshot review.

## Main changes

- A compact floating header with blur, controlled borders and highlights, magnetic label response, proper route states, a framed Programs panel with all six routes, keyboard ArrowDown/Escape behavior, and a two-column mobile menu with an expandable program list.
- A new editorial hero: larger custom typography, layered archive photographs, atmospheric Three.js ribbons, a pause control, and a three-part chapter index. The ribbons fade behind copy to protect readability.
- A warm orchid/ivory community story, with a leading circle photograph, a subordinate overlapping picnic photograph and the original mission content.
- A new program journey covering the real Music, Meditation and Yoga, and Senior Engagement content, followed by direct links to the other three programs.
- A new community album showing Diwali, the summer picnic and Christmas archive imagery with dated captions and deliberate depth.
- Shared photographed chapter openings for About, Programs, Events, Gallery, Get Involved, Contact and FAQ; program/event detail openings, program hover states, gallery filters, forms and footer surfaces follow the same system.

## Production screenshots

| View | 1440px desktop | 768px tablet | 390px phone |
| --- | --- | --- | --- |
| Hero/header | [Desktop](1440-hero.png) | [Tablet](768-hero.png) | [Phone](390-hero.png) |
| Open navigation | [Programs panel](1440-navigation.png) | [Tablet menu](768-navigation.png) | [Phone menu](390-navigation.png) |
| Community story | [Desktop](1440-story-full.png) | [Tablet](768-story-full.png) | [Phone](390-story-full.png) |
| Program journey | [First card](1440-journey.png), [stacked state](1440-journey-step-1.png), [third card](1440-journey-step-2.png) | [Tablet flow](768-journey-full.png) | [Phone flow](390-journey-full.png) |
| Community album | [Desktop](1440-memories-full.png) | [Tablet](768-memories-full.png) | [Phone](390-memories-full.png) |
| About opening | [Desktop](1440-about.png) | [Tablet](768-about.png) | [Phone](390-about.png) |
| Programs opening | [Desktop](1440-programs.png) | [Tablet](768-programs.png) | [Phone](390-programs.png) |
| Gallery opening | [Desktop](1440-gallery.png) | [Tablet](768-gallery.png) | [Phone](390-gallery.png) |
| Contact opening | [Desktop](1440-contact.png) | [Tablet](768-contact.png) | [Phone](390-contact.png) |
| Reduced motion | [Desktop](1440-reduced.png) | [Tablet](768-reduced.png) | [Phone](390-reduced.png) |

[Full phone homepage](390-homepage-full.png). Additional captures include Events, Get Involved, FAQ, a program detail page, and the second and third album states at every width.

Final screenshots use the optimized production app in local Chrome at DPR 1. Desktop/tablet viewports are 1000px high; the phone viewport is 844px high. These are browser viewport emulations, not physical device tests.

## Tests and visual refinements

`npm run lint`, `npm run typecheck`, `npm run build`, Prettier and Git whitespace checks passed. The production build generated all 22 pages. The combined browser suite passed **27 tests** across all three viewport sizes, covering:

- Desktop stacking geometry, tablet/mobile document flow and reduced-motion changes.
- Album buttons, keyboard operation, cycling and the gallery link.
- Desktop dropdown keyboard navigation, mobile program disclosure, focus restoration and route states.
- Real WebGL, pause/resume, reduced motion and unavailable-WebGL fallback.
- Gallery filters/lightbox, contact validation and FAQ search/expansion.
- All 17 existing page, program and event routes, their canonical metadata and horizontal overflow.

See [test results](test-results.json) and [capture results](capture-results.json).

Visual refinements from actual captures: moved the tablet background photograph clear of the headline, gave the mobile collage its own vertical composition, reduced ribbon glare and masked it away from the copy, enlarged and respaced the new display face, tightened the mobile navigation label/arrow spacing, and retained complete readable captions in the album.

During QA, a leftover workspace development process was found rewriting `.next` manifests while production was running. It caused intermittent RSC navigation failures and a missing development script on the dynamic Contact page. The conflicting processes were stopped and production was rebuilt and verified on its own.

## Remaining visual weaknesses and limits

- The original archive includes uneven resolution, room lighting and ordinary community-hall backgrounds. Some program images remain softer than the hero photographs; no synthetic replacements or invented documentary images were introduced.
- The phone hero intentionally unfolds over a scroll rather than squeezing both photographs and the chapter index into one screen.
- Internal page bodies preserve their real editorial content and working structures. They share the new surfaces and hierarchy; they are not all bespoke interactive narratives.
- Safari, Firefox, physical touch devices and low-end GPU/frame-rate performance have not been checked. No independent designer review is claimed.

Reproduce locally with one app server running:

```sh
npm run build
npm run start
npx playwright test --config playwright.premium.config.ts
node scripts/capture-premium.mjs
```

No push, deployment, hosting/DNS modification or Sanity configuration was performed. Existing untracked agent skills and their lock file remain outside the implementation commit.

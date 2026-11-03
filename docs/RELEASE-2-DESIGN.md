# Release 2 — The Art of Connection

## Creative direction

Music creates connections we feel before we can describe them. The new site translates that idea into an editorial, photographic experience with three interwoven ribbons as its signature sculpture. Gold, rose, and sage emerge from the original logo's warmth; deep plum gives the artwork and photography a quiet stage. Ivory interiors, expressive serif typography, and generous spacing keep the experience welcoming and readable.

The original logo is unchanged. No stock or generated people, quotes, teams, statistics, credentials, or current events have been introduced.

## From a landing page to a website

Release 1 concentrated every task in one scrolling document. Its header linked to anchors, all programs were described on the homepage, and there were no separate browsing or detail journeys. Release 2 gives visitors stable destinations, active navigation, a program submenu, breadcrumbs, related links, and a complete footer.

The homepage now gives an overview: photographic/sculptural welcome, concise mission, three selected program compositions, a community photograph, an interactive visual rhythm study, selected historical gatherings, and participation paths. Two clear hero actions lead to Programs and Get Involved.

## Page direction

- **About:** a photographic essay, oversized mission statement, real values, an arched community portrait, and a shared-circle composition. No unverified leadership section.
- **Programs:** six numbered editorial rows, with preview photography responding to pointer and keyboard focus. Each program has a dedicated chapter page, distinct colour treatment, contextual photograph, real description, focus areas, and enquiry action.
- **Events:** a calm upcoming-events empty state followed by a featured memory and historical archive. Three detail pages preserve dates from original album labels. No registration, invented schedules, or unsupported Event schema.
- **Gallery:** twelve curated photographs with deliberately varied proportions. Meaningful Music, Seniors Club, and Celebrations filters lead into a native fullscreen lightbox with arrow-key navigation and restored opener focus.
- **Get Involved:** distinct treatments for volunteering, supporting initiatives, collaboration, and participation. Contributions are arranged through conversation; no payment link is invented.
- **Contact:** practical contact details and an accessible email-preparation form. Validation helps visitors compose a message; opening and sending the draft remain explicit user actions.
- **FAQ:** searchable, native disclosures based on known foundation information.

## Motion and 3D

One lazy-loaded WebGL canvas lives in the homepage hero. Three procedural ribbons and 96 points create a sound-inspired sculpture. A small custom shader shapes the ribbons; pointer movement adjusts perspective and a labelled energy slider gives keyboard users an equivalent way to reshape the artwork. Motion can be paused. The sculpture is explicitly a **visual simulation**, with no audio playback, microphone, recording, or upload.

Reduced-motion users see static SVG artwork and do not load the scene. An SVG remains available during loading and when WebGL is unavailable. Intersection and document-visibility checks suspend the active render loop offscreen. The GPU budget is approximately 5,200 ribbon vertices, three ribbon meshes, one points draw, DPR capped at 1.35, no shadows, no postprocessing, and no external 3D assets.

GSAP handles page entrances, reading-progress rules, restrained section movement, partial image masks, menu entrances, program previews, and visual-rhythm changes. Content never depends on opacity animations to become readable. Native scrolling stays in control. Animation contexts revert on route changes and reduced-motion changes.

## Reused photography

The five Release 1 selections remain. Seven additional derivatives come from the previously reviewed 41-photo sample: a microphone conversation, a Seniors Club room, a Diwali portrait, an October speaker, a June singer, a picnic table, and a March gathering. Originals remain intact; mappings are in `docs/legacy-snapshot/release2-curated-manifest.json` and `src/data/media.ts`.

There are no verified yoga, nutrition, online-workshop, or food-drive-specific photographs. Detail pages use different community archive images with explicit contextual captions, rather than presenting them as documentary evidence of those particular activities. Rights and participant consent remain a publication requirement.

## References and licensing

- [Codrops: audio visualizer](https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/): studied the separation of a visual scene, shader deformation, and interaction state. No source, music, or generated imagery was copied.
- [Codrops: Trionn architecture](https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/): informed separation of DOM storytelling, WebGL, and responsive animation responsibilities. Lenis and audio effects were not added.
- [Soundscape](https://github.com/kai-claw/soundscape): studied the ribbon concept, accessibility controls, and rendering tiers. Its [MIT licence](https://raw.githubusercontent.com/kai-claw/soundscape/main/LICENSE) was verified; no repository code was imported.
- [Assetmaker / Facet visualizer](https://assetmaker-nine.vercel.app/audio-visualizer): the web reader could not fetch the supplied URL, but isolated browser inspection succeeded. Studied its frequency-ring presentation, sensitivity control, and distinction between simulated and microphone modes. The page identifies itself as MIT; no component code or assets were integrated. Our ribbon geometry and shaders are original, and we avoid silent changes from microphone input to simulation.
- [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Canvas](https://r3f.docs.pmnd.rs/api/canvas), and [Drei AdaptiveDpr](https://drei.docs.pmnd.rs/performances/adaptive-dpr) were checked for the scene implementation. Three.js, Fiber, and Drei package licences are retained in their installed distributions. GSAP remains the existing project dependency; no premium plugin was added.

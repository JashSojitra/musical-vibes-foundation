# Release 3 — Stage A rehearsal

Direction: **The Living Symphony**. Only the shared navigation, homepage hero, and immediately following community story were redesigned.

## References and adaptation

Read the installed `.agents/skills/stageshow/SKILL.md` and its craft, framing, motion, rehearse, review and verify references. Applied intentional crops, a leading image with a subordinate overlapping image, purposeful motion, complete still frames and a separately composed phone layout. This is a real foundation website, so no faux product UI, Stageshow kit or copied example components were introduced. Its `.ss-stage` film gates do not apply; the host was captured using its existing Playwright and Sharp dependencies instead. No Stageshow gate or independent reviewer pass is claimed.

Kage's supplied JSON and standalone HTML were retrieved for source inspection. Its atmospheric layering, restrained chrome and continuous editorial ground informed the direction. No source, temple imagery, iframe or standalone landing-page document was embedded. The Codrops reference informed the relationship between layered Three.js geometry, shader lighting and atmospheric particles; no audio controls or playback were added.

## Composition and motion

- Desktop: editorial heading on the left; authentic June 2025 performer image on the right, blended into the environment. Open champagne ribbons traverse the foreground with subdued highlights and depth. A quieter caption anchors the photograph.
- Phone: vertical composition, shorter headline, photograph below the introduction and actions, lower ribbon placement and reduced ribbon opacity. The performer's face stays readable in the captured animation frames.
- The community circle leads the story; the smaller picnic photograph overlaps its lower edge. Mission content is retained. Shorter phone travel preserves reading space.
- GSAP gives the hero photograph slight scroll depth and advances the story images at different rates. There is no scroll hijacking or pinned reading sequence. Layout and motion preferences are observed through GSAP matchMedia, with cleanup on navigation.
- The WebGL scene uses demand rendering, a capped DPR, time clamping, offscreen/document visibility suspension and pause/resume. Reduced motion or unavailable WebGL shows complete static ribbon artwork and authentic photography.

## Captured and reviewed

Final images are in [`docs/validation/release3-stage-a`](../../../docs/validation/release3-stage-a/). Captured from the **production build** in headless local Chrome, at 1440 × 1000 and 390 × 844 CSS pixels, DPR 1.

At each width: four moving hero frames separated by approximately 1.8 seconds (plus capture time), story entry, three subsequent scroll positions, paused WebGL, open navigation, reduced motion, a full Stage A WebGL still and a full reduced-motion poster. Motion contact sheets show the four hero frames in reading order. These are representative samples, not a frame-by-frame or physical-device performance audit.

Refinements from the actual screenshots: removed a hard photo boundary, reduced ribbon glare, lowered the mobile ribbon field, repositioned the mobile photograph to reveal the face below the actions, tightened photo overlap, reduced grain, and fixed the copy wrapper intercepting the pause button. Final captures report no browser errors and no horizontal overflow at either width.

## Validation

- `npm run lint` — passed. Agent tooling is excluded from application lint scope; installed skill examples were initially being linted as website source.
- `npm run typecheck` — passed.
- `npm run build` — passed, all 22 generated pages completed.
- `npx playwright test --config playwright.stage-a.config.ts` — 10 passed, desktop and mobile. Covers real WebGL, pause/resume, story anchor, keyboard navigation and focus restoration, all six program links, reduced-motion preference changes, missing WebGL, and 17 existing page/program/event routes with metadata and overflow checks.
- Prettier and `git diff --check` — passed.

## Remaining weaknesses and limits

- The authentic archive photographs retain ordinary hall lighting, equipment and room backgrounds. They are intentionally preserved rather than replaced with artificial or unrelated imagery.
- The phone picnic image is supporting context; individual faces are smaller than in the lead photograph.
- The unchanged lower homepage returns to the Release 2 palette. Its transition is visible and belongs to a later stage.
- Safari, Firefox, physical phones and GPU/frame-rate performance on low-end hardware were not checked. Full animation seam analysis and independent visual review were not performed.

No dependency additions, content-model/CMS changes, hosting, DNS, deployment or remote Git operations were performed. Existing agent skills and the skills lock file were left outside the implementation commit.

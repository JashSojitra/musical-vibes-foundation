# Release 2 validation

Validated locally on November 3, 2026 with Node.js 24, Next.js 15.5.29, React 19.3.1, TypeScript 5.9.3, Three.js 0.187.0, React Three Fiber 9.8.2, and Drei 10.7.9.

## Result

The complete visitor flow is implemented: arrive → understand the foundation → explore programs and their detail pages → browse historical events and photography → participate or prepare a contact email. All meaningful content is server-rendered; the experience does not require WebGL or animation to navigate.

| Check | Final result |
| --- | --- |
| ESLint | Passed, no source warnings or errors. Temporary QA artifacts and generated files are excluded. |
| TypeScript | `npm run typecheck` passed. Production build type validation passed. |
| Formatting | `npm run format:check` passed. |
| Production build | Passed. Homepage and interior pages prerendered; six program and three event detail pages generated. Contact is server-rendered to preserve enquiry query context. |
| Browser suite | **22 passed, 2 intentionally skipped** in 36.4 seconds against the final production process. The two skips avoid duplicating the explicit WebGL initialization test on tablet and mobile; their responsive page checks, reduced-motion checks, and WebGL-failure checks still run. |
| Route coverage | All **17 routes** visited at **1440 × 1000**, **768 × 1024**, and **390 × 844**: 51 route/viewport combinations. |
| HTTP/resource audit | All 17 sitemap destinations and **67 linked local resources** returned 200. Three unknown routes, including unknown program/event slugs, returned 404. |
| Logo integrity | Original PNG checksum matches Release 1 exactly. |
| Production dependency audit | `npm audit --omit=dev` reports zero vulnerabilities. |

## Browser behaviour verified

- Exactly one visible H1, meaningful main content, page-specific description and canonical URL on every route.
- No horizontal overflow at any requested viewport size; all images have alternative text. Photography was decoded before full-page capture, so broken image delivery fails the test.
- Skip link and main-content focus; desktop submenu disclosure and Escape; mobile modal open, Escape close, restored trigger focus, and route navigation.
- All six program detail destinations and keyboard/focus preview behaviour; logo returns Home.
- Gallery category filters, native fullscreen dialog, previous/next arrow keys, Escape close, and restored photo-button focus.
- Contact required-field validation, focused first invalid field, a prepared mailto draft, and explicit confirmation that nothing has been sent. No external message was transmitted.
- FAQ search, empty results, clear search, and keyboard disclosure activation.
- Reduced-motion preference: static artwork, no canvas, and visible meaningful content.
- Actual WebGL canvas initialization, no shader/hydration errors, and a working pause control.
- Deliberately unavailable WebGL: still artwork and working route navigation on all three viewport sizes.
- Final route visits produced no browser console errors or page errors.

The connected browser integration could not initialize reliably in this session. QA used an isolated, headless installed Chrome instance through Playwright; the owner's open browser tabs were untouched.

## Visual review and refinements

Full-page screenshots cover all eight main pages and representative program/event details at each requested width. The desktop hero also has a focused screenshot with the real sculpture rendered and paused. Artifacts are in `docs/validation/release2/`.

Reviewed the typography, spacing, original-logo treatment, photo crops, program index, archive compositions, responsive form, and shared footer across the screenshot set. The visual pass corrected a rotated program-arrow overflow on mobile, clipped tablet artwork controls, a responsive heading-space issue, and an image mask that affected its caption. The final mask targets only the image frame.

Testing also corrected floating-point differences in SVG paths by rounding coordinates consistently, and removed a fallback side effect that marked supported WebGL unavailable too early. A small capability probe now runs before the renderer import and immediately releases its context. The actual scene has a separate error boundary and context-loss fallback.

## Performance evidence and limits

Next reports approximately **114 kB First Load JS** for Home, compared with approximately 110 kB for Release 1. Interior pages report approximately 111–113 kB. The Three.js scene is a separate dynamic import, with no external model/texture downloads, shadows, or postprocessing. The scene uses three ribbons, 96 points, about 5,200 ribbon vertices, capped DPR, demand rendering, an offscreen/visibility pause, explicit pause controls, and teardown disposal.

These are build and implementation observations, not field Core Web Vitals or Lighthouse scores. Real low-end phones, Safari/iOS, assistive technology, and an extended battery/GPU soak test were not available in this local pass. Keyboard behaviour and reduced-motion/WebGL fallbacks were exercised automatically; no claim of a complete accessibility certification is made.

The full development dependency audit retains 14 moderate findings in the lint tooling dependency tree. Production dependencies are clean after the compatible PostCSS patch. No forced, unrelated major-version lint downgrade was applied.

## Outstanding editorial and launch requirements

- Confirm image rights, participant consent, current program terminology and availability, and any future event schedule.
- Obtain activity-specific yoga, nutrition, online-workshop, and food-support photos if desired. Current contextual archive captions do not imply those images document the specific program.
- Approve team identities/biographies before adding leadership content. No invented team, testimonials, statistics, or milestones are present.
- Connect a real submission backend before changing the explicit email-draft workflow to a Send action. See the architecture document for validation, spam controls, privacy, and delivery requirements.
- No online donation flow or payment destination has been invented.
- Sanity remains unconfigured. No DNS/hosting changes, production deployment, or remote push occurred.

## Reproduce

```bash
npm ci
npm run lint
npm run typecheck
npm run format:check
npm run build
npm start
```

With the production server running in another terminal:

```bash
npm run test:browser
npm run verify:routes
```

Use the existing Chrome installation or configure a Playwright browser as described in README. QA servers are stopped at handoff. The raw browser report and HTTP audit are retained alongside the screenshots.

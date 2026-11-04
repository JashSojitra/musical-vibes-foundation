# Release 3 — Stage A review

The Living Symphony: compact navigation, cinematic Three.js hero, and an immediate community story. Authentic assets, mission copy, routes and metadata are retained. The rest of the homepage and other page bodies retain their existing design.

## Screenshots

| Review | 1440px desktop | 390px mobile |
| --- | --- | --- |
| Hero and navigation | [Desktop hero](1440-hero-frame-0.png) | [Mobile hero](390-hero-frame-0.png) |
| Complete Stage A, paused WebGL | [Desktop](1440-stage-a.png) | [Mobile](390-stage-a.png) |
| Representative animation frames | [Contact sheet](1440-motion-contact-sheet.jpg) | [Contact sheet](390-motion-contact-sheet.jpg) |
| Story entry | [Desktop story](1440-story.png) | [Mobile story](390-story.png) |
| Open navigation | [Programs dropdown](1440-navigation.png) | [Mobile menu](390-navigation.png) |
| Reduced-motion poster | [Desktop](1440-stage-a-poster.png) | [Mobile](390-stage-a-poster.png) |

Separate scroll-0.25, scroll-0.5 and scroll-0.75 captures show the story progression. All final screenshots were taken from `next start` after a successful production build in Chrome, using the displayed CSS viewport sizes.

## Checks

Lint, TypeScript, production build, Prettier and Git whitespace checks passed. The Stage A Playwright suite passed **10/10 tests**, covering desktop/mobile behavior, keyboard navigation, real WebGL, motion controls, preference changes, fallback rendering, existing routes and SEO metadata. See [test results](test-results.json) and [capture results](capture-results.json).

Reproduce against a local app at `http://127.0.0.1:3000`:

```sh
npx playwright test --config playwright.stage-a.config.ts
node scripts/capture-stage-a.mjs
node scripts/stage-a-contact-sheets.mjs
```

## Remaining visual weaknesses

The archive photography retains ordinary hall lighting and room backgrounds. The mobile picnic image works as context rather than a close-up. The transition into the unchanged lower homepage returns to the earlier palette; that work is outside Stage A.

This was Chrome desktop and phone viewport emulation, not physical-device, Safari/Firefox or low-end GPU testing. Frames are representative samples rather than a continuous animation audit. See the [full rehearsal record](../../../src/components/experience/REHEARSAL.md).

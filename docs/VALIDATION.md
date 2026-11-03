# Validation — November 3, 2026

## Scope and result

The visitor story is: arrive at the homepage → understand the foundation → explore all six programs → view authentic archive imagery → contact the foundation through existing email or phone. Content comes from the local content adapter and renders on the server. There are no external APIs, forms, payments, CMS credentials, or database boundaries to validate.

## Project checks

| Check | Result |
| --- | --- |
| Installed dependency resolution | Existing Next.js 15.5.29, React 19.3.1, TypeScript 5.9.3, GSAP 3.15.0 installation builds successfully. Sharp is now a declared development dependency for asset tooling. Lockfile retained. |
| Baseline production build | Passed before redesign. No installation or TypeScript blocker found. |
| ESLint | Passed with no warnings after adding the missing ESLint 9 flat config and excluding generated Next declarations. |
| TypeScript | `npm run typecheck` passed; production build also performs TypeScript validation. |
| Redesigned production build | Passed; homepage, robots, and sitemap statically prerendered. Homepage First Load JS approximately 110 kB, as reported by Next. GSAP loads separately as an enhancement. This is not a measured Lighthouse score. |
| Production startup | `next start` ready on localhost; homepage HTTP 200. |
| Image delivery | All five curated images return 200. Next Image optimization returns 200; the 1080-pixel hero response was approximately 206 kB. |
| Source integrity | Original logo SHA-256 exactly matches the collector manifest. |
| Metadata | One H1, canonical URL, Organization / WebSite / FAQ JSON-LD, all six programs, public email and telephone checked in server-rendered HTML. |
| Crawl endpoints | robots.txt and sitemap.xml return 200. Unknown route returns 404. Sitemap includes only implemented homepage route. |

Raw HTTP verification is in `validation/runtime-checks.json`.

## Browser checks

- Reviewed the desktop hero, original logo treatment, story-to-program transition, and music chapter in Brave.
- Verified the primary program anchor and mobile menu open, close, and section navigation.
- Verified native program FAQ expansion returns the real email and phone instructions.
- Read DOM dimensions at 1920, 585, and 390 CSS-pixel widths. Document scroll width stayed within the viewport at each size; no horizontal overflow was detected.
- Reviewed the mobile hero at 585 and 390 pixels. Fixed text joining around responsive line breaks and program intro alignment.
- Internal fragment links resolve to existing section IDs. All images visible in the desktop hero loaded successfully.
- No browser JavaScript errors observed. An initial development warning about Next Image quality configuration was corrected in `next.config.ts`.
- Removed opacity-dependent GSAP entrances after narrow-viewport review showed paused animation frames could leave text invisible. Movement now enhances content that is always visible.

## Accessibility and motion implementation

Server-rendered landmarks, one H1 and ordered heading levels, skip link, descriptive image alternatives, visible focus styles, a native FAQ disclosure pattern, and an Escape-close mobile menu are included. GSAP responds to `prefers-reduced-motion`, and CSS disables smooth scrolling and transitions for that preference. Navigation and native FAQs do not require animation. No pinned scrolling, autoplay media, or WebGL is used.

Reduced-motion and no-JavaScript fallbacks were inspected in code and server output; a full OS preference matrix and assistive-technology audit were not performed. No automated axe, Lighthouse, real-device, or Core Web Vitals score is claimed. Narrow-viewport screenshot capture was intermittently blank in the browser tool; DOM and interaction checks continued to work, and a fresh top-of-page mobile view was visually inspected. Full mobile section-by-section visual QA remains a follow-up before launch.

## Delivery boundaries

This milestone covers the homepage. Additional page routes remain in the broader build plan. Image rights and participant consent require confirmation before publication. No upcoming events, testimonials, metrics, medical credentials, or donation endpoints were invented. Sanity, production deployment, DNS/hosting changes, and remote pushes were not performed.

Use `npm run dev` to review locally at http://localhost:3000. QA servers are stopped at handoff.

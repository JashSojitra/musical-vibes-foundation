# Cross-platform navigation arrows

This is an isolated UI repair based on `origin/main` (`82a6f6b`), on `fix/cross-platform-icons`, in `.tmp/cross-platform-icons`. The original checkout remains on `feat/sanity-cms` at `8bccf33`; it was clean before work began and was not switched, stashed, reset, rebased, merged or edited. No Sanity implementation, configuration, dependencies, schemas or content changes are included here. Nothing was deployed.

`ArrowIcon` draws five directions with SVG paths, `stroke="currentColor"`, a 24×24 viewBox and 1em dimensions. It is decorative (`aria-hidden`, `focusable=false`). Existing wrappers continue to control font size, colour, spacing, hover translation and rotation. Buttons and links retain their meaningful labels and handlers. No icon dependency was added.

Decorative arrows were replaced in header/mobile navigation, shared CTAs, program rows, cards, photograph controls, Gallery collections, Journal relations, contact actions, FAQ clear-search and the footer. Events and other routes inherit the shared component. The Gallery's written left/right keyboard instructions remain intentional text. Unrelated stars, plus signs, close marks, content and emoji are unchanged.

## Validation

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass, production Next.js build.
- `npx playwright test --config playwright.icons.config.ts`: **17 passed, 7 intentional skips**. Chromium and WebKit at **360×800, 390×844, 768×1024 and 1440×1000**. Android Pixel 5, iPhone SE/13 and iPad Mini profiles provide touch/mobile emulation. Source checking runs once; the seven redundant source-check cases are intentionally skipped.
- Existing `premium.spec.ts`, `release4.spec.ts` and `stage-a.spec.ts`: **56 passed**, across desktop, tablet, 390px mobile and 360px small mobile. These verify navigation, keyboard focus, Journal/Gallery/Events journeys, routes, motion and reduced-motion/WebGL fallback.
- Standalone lightweight source guard: **1 passed** with `npx playwright test tests/icons.spec.ts --grep "UI source" --project=desktop`. This takes no browser fixture or running website. It rejects literal/escaped navigation arrows and common arrow entities in UI source, with a single explicit exception for the Gallery keyboard instructions.

The cross-engine checks visit 13 public page/collection routes per profile. They inspect rendered UI text, SVG dimensions and bounds, inherited stroke attributes, decorative accessibility, horizontal overflow, functional mobile/desktop navigation, program links, Gallery next/previous controls, focus restoration and reduced-motion controls. Gallery navigation targets remain at least 44px; existing memory controls remain 43px. SVGs do not create or shrink touch targets. iPhone-profile menu and memory-control screenshots were visually inspected: SVG marks use the intended gold/plum colours, with no emoji tiles or clipped navigation icons.

The initial matrix run completed its UI assertions but one WebKit desktop case failed during trace cleanup when a separate test process cleared the shared artifact directory. The icon config now uses its own output directory; the clean rerun is the authoritative result. Generated screenshots and JSON reports live under ignored `docs/validation/icons/`; temporary test configurations/logs remain uncommitted.

**Limitations:** desktop Playwright device profiles and Windows WebKit are approximations, not physical Android/iPhone/iPad Safari sessions. Real-device visual checks remain recommended before a separately authorized deployment. No deployment or Cloudflare infrastructure work was performed.

## Exact changed files

1. `src/components/arrow-icon.tsx` — reusable decorative SVG.
2. `src/components/ui.tsx` — shared animated Arrow wrapper.
3. `src/components/navigation.tsx` — desktop and mobile menu arrows.
4. `src/components/program-explorer.tsx` — program-row marks.
5. `src/components/gallery-explorer.tsx` — expand/previous/next marks.
6. `src/components/gallery-preview.tsx` — collection-card marks.
7. `src/components/experience/community-memories.tsx` — previous/next marks.
8. `src/components/contact-form.tsx` — email actions.
9. `src/components/faq-explorer.tsx` — clear-search action.
10. `src/components/footer.tsx` — back-to-content mark.
11. `src/app/contact/page.tsx` — contact-channel marks.
12. `src/app/gallery/page.tsx` — Journal story link.
13. `src/app/get-involved/page.tsx` — decorative partnership mark.
14. `src/app/journal/[slug]/page.tsx` — related-program marks.
15. `src/app/globals.css` — em-sized SVG alignment rule.
16. `tests/icons.spec.ts` — source, geometry and interaction regression checks.
17. `playwright.icons.config.ts` — isolated cross-engine/device matrix.
18. `docs/CROSS-PLATFORM-ICONS.md` — this report.

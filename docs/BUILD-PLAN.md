# Implementation sequence

## Current local milestone — November 3, 2026

The first complete homepage direction is implemented for review, including original branding, authentic photography, six program presentations, GSAP choreography, mobile navigation, FAQ, contact links, and SEO metadata. See [HOMEPAGE-DIRECTION.md](HOMEPAGE-DIRECTION.md), [ASSET-AUDIT.md](ASSET-AUDIT.md), and [VALIDATION.md](VALIDATION.md). Three.js has been intentionally deferred. Sanity, additional page routes, deployment, and DNS/hosting work have not started. The phases below remain the broader roadmap, not a claim that all phase-two routes are finished.

## Phase 1 — foundation (this starter)
- Next.js App Router, TypeScript, responsive cinematic page, GSAP ScrollTrigger reveals and parallax
- Current content and links inventoried; automatic read-only legacy asset collector
- Motion reduced for accessibility; do not claim non-existing services or impact statistics

## Phase 2 — visual production
- Replace placeholder typographic music art with art-directed brand imagery and licensed photography
- Add purposeful GSAP chapter transitions, gallery layout, responsive page transitions
- Selectively add Three.js / React Three Fiber scene (lazy loaded, performance budgets, accessible fallback), not generic effect overload
- Add complete About, Programs, Gallery, Events, Get Involved, Contact pages
- Implement meaningful events call-to-action; mobile and keyboard behavior; automated contrast/performance checks

## Phase 3 — editorial layer
- Sanity schemas: `siteSettings`, `program`, `event`, `galleryAlbum`, `galleryImage`, `teamMember`, `testimonial` (only if approved), `seo`
- Draft preview, validation, image alt text and crop metadata, editor guide
- Cache revalidation / webhook and proper image optimization

## Phase 4 — launch
- Technical SEO, Organization and Event structured data (actual events only), canonical URLs, sitemap, robots, social preview, FAQ where substantiated
- Accessibility and Core Web Vitals review; preview approval; Cloudflare deployment
- Only after approval: coordinate GoDaddy DNS switch from existing Hostinger site; keep rollback plan

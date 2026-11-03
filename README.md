# Musical Vibes Foundation — homepage redesign

A local Next.js App Router implementation with TypeScript, authentic legacy photography, and GSAP / ScrollTrigger enhancements. No Sanity configuration, hosting changes, deployment, or remote push.

## Develop and review

Use Node.js 22 or newer and npm. This workspace was validated with Node.js 24.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Navigation links lead to homepage sections; program enquiries use the foundation's existing public email. The full About, individual Program, and archive routes remain a later phase.

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

Build before starting the production server. Avoid building and running the development server concurrently because both use `.next/`.

## Design and content

- [Homepage direction](docs/HOMEPAGE-DIRECTION.md): visual identity, narrative, motion, and content architecture.
- [Asset audit](docs/ASSET-AUDIT.md): provenance, selections, classifications, missing assets, and consent questions.
- [Validation report](docs/VALIDATION.md): completed checks and remaining verification limits.
- [Content audit](docs/CONTENT-AUDIT.md) and [build plan](docs/BUILD-PLAN.md): source inventory and broader roadmap.

`src/data/site.ts` holds content. `src/lib/content.ts` is the server-side adapter boundary for later Sanity integration. `home.tsx` renders the document on the server; client components handle navigation and optional motion. Metadata, Organization / WebSite / FAQ structured data, robots, and sitemap are included.

The original `public/assets/legacy/logo.png` is preserved unchanged. Five optimized WebP derivatives provide real community imagery. Originals, source HTML, the gallery script, manifests, and a contact sheet are retained for audit. No photos, testimonials, upcoming events, or impact statistics have been fabricated.

## Asset collection and reproduction

The initial Python collector snapshots HTML and directly linked media:

```bash
python -m pip install -r scripts/requirements.txt
python scripts/collect_legacy.py
```

The galleries require their separate JavaScript index. The Node sampler retrieves that index and up to three original photos per album from the same public foundation domain, without executing the legacy code or downloading video:

```bash
node scripts/collect-gallery.mjs
node scripts/index-galleries.mjs
npm run assets:audit
npm run assets:curate
```

Collection requires network access. Existing local artifacts can be reviewed without recollecting. Source album dates are historical labels, not current event listings. Reuse permission and participant consent require confirmation before publication.

## Review and launch policy

Local commits use the existing Git identity. Do not push until the owner reviews the work. Do not change DNS, hosting, or deploy to production. Confirm image consent, program wording, credentials, current schedules, and any future donation destination before launch.

# Musical Vibes Foundation — Release 2

**The Art of Connection:** a complete Next.js App Router website built around authentic community photography, editorial typography, GSAP choreography, and one original Three.js ribbon sculpture.

## Run locally

Use Node.js 22+ and npm. This workspace was validated with Node.js 24.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Stop the development server before building; both use `.next/`.

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Pages

Home, About, Programs, Events, Gallery, Get Involved, Contact, and FAQ are real routes. All six programs have detail pages. Three historical gatherings have event pages. No confirmed upcoming schedule has been supplied; the upcoming section has a helpful empty state.

The shared header provides active navigation, a program submenu, and a modal mobile menu. The gallery includes category filters and a fullscreen keyboard-controlled lightbox. Contact enquiries validate locally and explicitly prepare an email draft; nothing is silently submitted or stored.

## Browser and HTTP verification

Run against a local production server:

```bash
npm run test:browser
npm run verify:routes
```

The Playwright configuration checks 1440px desktop, 768px tablet, and 390px mobile. It uses installed Chrome at the standard Windows path when present. On other machines, install a supported Playwright browser with `npx playwright install chromium`, or set `PLAYWRIGHT_BROWSER_PATH` to your browser executable. Tests use a separate browser profile and never interact with your open tabs or send external messages.

## Architecture

- `src/types/content.ts`: stable typed content models.
- `src/data/content.ts` and `media.ts`: real local records and media provenance.
- `src/lib/content.ts`: server-side adapter boundary for a future CMS.
- `src/app/`: route pages and page-specific metadata.
- `src/components/experience/`: lazy-loaded sculpture and visual rhythm study.
- `tests/site.spec.ts`: browser interaction, keyboard, responsive, reduced-motion, and WebGL-failure tests.

All meaningful text is server-rendered. Reduced-motion visitors receive still artwork without loading the scene. WebGL failure retains a static illustration and working navigation. No microphone, recording, audio playback, or upload is included.

## Design and validation

- [Release 2 design](docs/RELEASE-2-DESIGN.md)
- [Release 2 architecture](docs/RELEASE-2-ARCHITECTURE.md)
- [Release 2 validation](docs/RELEASE-2-VALIDATION.md)
- [Future Sanity plan](docs/SANITY-INTEGRATION-PLAN.md)
- [Asset audit](docs/ASSET-AUDIT.md)

Original source pages, photographs, manifests, and the contact sheet remain in the repository. The original logo is unchanged. Twelve curated images are used in this release. The two image-curation scripts reproduce their derivatives:

```bash
npm run assets:curate
npm run assets:curate:release2
```

See the [asset audit](docs/ASSET-AUDIT.md) for collection instructions, source rights, unsuitable assets, and missing program-specific photography.

## Publication boundaries

No Sanity project, client, studio, or credentials are configured. No deployment, DNS or hosting change, or GitHub push is authorised in this release. Commits use the existing local Git identity. Before launch, confirm participant consent and photo rights, current program details, the event schedule, and whether to replace the explicit email-draft workflow with a real submission backend.

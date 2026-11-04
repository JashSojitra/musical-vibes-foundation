# Foundation favicon

The previous layout explicitly referenced `/assets/favicon.png`, but the public demo build replaces its generated `/assets` directory with approved photos and the original logo. That favicon was absent from the upload. The root `/favicon.ico` fallback was also missing. This was an asset-packaging/path problem, not evidence of a browser-cache failure.

The favicon now uses Next.js App Router file conventions: `src/app/favicon.ico` (16, 32 and 48 pixel RGBA frames), `src/app/icon.png` (32 pixels) and `src/app/apple-icon.png` (180 pixels). A separate transparent 16 pixel PNG lives at `public/favicon-16x16.png`. Next.js generates the icon links and content-based cache-busting queries; the obsolete metadata and PNG are removed.

All sizes derive directly from `public/assets/legacy/logo.png`: crop x=25, y=10, width=285, height=322, excluding the entire wordmark. Proportional resizing onto a transparent square preserves the original hands, clef, colours and proportions. Regenerate with `node scripts/generate-favicons.mjs` using the existing Sharp dependency. No artwork is redrawn.

Validation:

- Lint, TypeScript and Next.js/OpenNext demo production build passed.
- `validate:ci -- --built` passed; the packaged demo includes the ICO as a static asset and the PNG/Apple routes in its prerendered route cache. The photo allowlist is unchanged.
- All 12 relevant browser tests passed across desktop, tablet, mobile and small mobile in local Cloudflare workerd. They cover metadata, successful icon responses, MIME types, byte equality, transparent corners, visible artwork, Chromium ICO decoding, demo security headers and exclusion of raw archive photos.
- Chromium-rendered ICO screenshots are attached to the favicon tests in the local Playwright report. The generated Apple icon and browser-rendered ICO were visually inspected.

No deployment was run. The next normal demo deployment will publish these assets; an already-open browser tab may need reopening to refresh its cached favicon.

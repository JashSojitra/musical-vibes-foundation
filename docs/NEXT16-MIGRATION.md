# Next.js 16 migration and adapter decision

Branch: `migration/next16-cloudflare`, based on `c228711d5e02363f68d2c52156fdf68adfd5cac0`. Working Next.js 15 remains on `main`. No push, deployment, domain/DNS or account settings change is included.

Follow-up: the owner published migration commit `e7d7683`, which passed [Linux CI](https://github.com/JashSojitra/musical-vibes-foundation/actions/runs/41783105319). The current staging-only CI preparation and manual launch instructions are in [STAGING-LAUNCH.md](STAGING-LAUNCH.md); this report otherwise records the original migration evaluation.

## Framework changes

- Next.js and `eslint-config-next`: **16.4.5**, the stable npm `latest` checked during this migration; React/React DOM **19.3.1**, React types **19.3.0**. Versions are pinned and the npm lockfile is retained. Do not use canary releases for production.
- Adopted Next 16's native ESLint flat exports. The independent `eslint .` script remains required because `next build` no longer runs lint. TypeScript accepted Next's generated `react-jsx` and `.next/dev/types` changes. Evaluation/build folders are excluded from typechecking.
- Ran the official pinned `@next/codemod@16.4.5 next-async-request-api src --dry`: **40 unmodified, zero errors**. All dynamic route `params` and Contact/Gallery `searchParams` already await promises. No middleware, deprecated synchronous request APIs, custom webpack configuration, legacy image loader, PPR or unstable cache APIs needed migration.
- The default **Turbopack** production build passes. No webpack fallback, React Compiler, Cache Components, experimental adapter API or unrelated refactor was introduced.
- Preserved image quality allowlist `[75, 85]`, local fonts, routes, metadata and the client-only WebGL boundary. Required responsive image transformations and invalid-quality rejection are covered by runtime tests.
- The new React hooks lint rule identified Gallery's imperative body-scroll mutation. Scroll locking now lives in a selected-photo effect that restores the previous overflow value on close/unmount. Dialog behavior and approved styling are unchanged.

The official [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) informed the request API, lint, image and Turbopack review. No visual CSS, photography or editorial content was changed.

## Adapter comparison on this application

| Evidence                 | Next.js 16 + OpenNext                                                 | Next.js 16 API + vinext                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions evaluated       | `@opennextjs/cloudflare` 1.20.16; Wrangler 4.157.0                    | vinext 1.4.3; `@vinext/cloudflare` 1.3.3; Vite 8.3.0                                                                                                                                                                              |
| Compilation              | Adapts the real Next 16.4.5 Turbopack output; successful Worker build | Successful isolated Vite/RSC Worker build                                                                                                                                                                                         |
| Local runtime            | Wrangler/workerd, port 3002, local ASSETS + IMAGES                    | Cloudflare Vite preview/workerd, port 3001, local ASSETS + IMAGES                                                                                                                                                                 |
| Compatibility scan       | Adapter peer range explicitly accepts Next 16.4.5                     | `vinext check`: 96%, 11 supported, one partial (`images`), no reported issues; scan does not certify all application libraries                                                                                                    |
| Images                   | 640px transformation and disallowed quality rejection pass            | Same image acceptance test passes in Workers preview; prerender logs warned of optimizer fallback without an IMAGES binding in the prerender Node process                                                                         |
| Toolchain constraints    | Native Windows support warning; Linux CI/WSL recommended              | Generated `@cloudflare/vite-plugin` 2 beta and `cf` beta; `cf` required Node ^22.23 / ^24.22 / ^26.12, newer than local Node 24.14.1. Build and preview ran despite the install engine warning. Source-map warnings also emitted. |
| Production configuration | Selected; only OpenNext configuration and dependencies are committed  | Isolated under ignored `.tmp/vinext-evaluation`; no vinext dependency, Vite config or second adapter in production                                                                                                                |

**Decision: use OpenNext.** Both candidates can build and serve this application locally. OpenNext preserves upstream Next.js rendering/caching semantics and gives the future Sanity integration fewer framework substitutions to validate. Its existing adapter maintenance path, native Next build and the tested runtime outweigh vinext's build speed for this foundation. This is a maintenance judgment supported by application tests, not a claim that vinext cannot work.

Cloudflare currently recommends vinext and labels it beta in its [Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/); its [OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) still documents supported SSR, dynamic routing and Images integration. The [vinext project's own comparison](https://github.com/cloudflare/vinext#why) describes OpenNext as the more mature option. Revisit the decision when vinext's deployment tooling and required content workflows have stable, verified coverage.

## Verification and limits

The native Next production server, selected OpenNext Workers preview and isolated vinext Workers preview each passed **97 browser/model cases**, with three intentional legacy skips, at 1440, 768, 390 and 360px: **291 passing cases across three targets**. Each target was tested in two selections: 68 Release 4/migration cases plus 29 passing legacy cases (three redundant non-desktop WebGL cases deliberately skip). The committed combined configuration includes all 100 cases. This covers every current route, navigation, Journal/Gallery publication relationships, Contact's unsent email state, image resizing, metadata/sitemap, hydration/console checks, GSAP, Three.js, reduced motion and no-WebGL fallback. Real screenshots and representative animation frames for native Next and OpenNext are retained locally under `docs/validation/migration/`; see its validation report for evidence and limits.

The older test file needed a configurable base URL and an FAQ-scoped summary selector because the mobile More disclosure also contains a summary. These were stale test assumptions, corrected without changing the application. Legacy screenshot output is separated by runtime to avoid collisions.

Wrangler's original local dry run bundled 149 static assets and a Worker of approximately **1,149 KiB gzip**. This confirms local packaging, not production CPU time, account entitlements, internet delivery or live Cloudflare behavior. Windows emits an upstream support warning. The migration baseline later passed Linux CI as linked above; follow-up commits must pass independently.

For the configuration, environment contract, staging gates and rollback steps, use [deployment readiness](DEPLOYMENT-READINESS.md). For residual build-tool advisories, use [dependency security](DEPENDENCY-SECURITY.md).

## Retaining the fallback

Do not reset or rewrite `main`. To run the previous working framework, stop local servers and switch to `main`, then run `npm ci`, `npm run build`, and `npm run start`. Migration work remains committed on its dedicated branch. Merge only after reviewing the local evidence and a successful Linux CI run; stage the Worker before approving a public production launch.

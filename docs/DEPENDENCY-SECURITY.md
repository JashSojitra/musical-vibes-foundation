# Dependency security assessment

Assessed during the Next.js 16 migration. Detailed npm audit JSON remains ignored under `.tmp/`; repeat these commands before release because advisories change:

```powershell
npm ci
npm audit --omit=dev
npm audit --audit-level=high
npm audit
```

## Results

| Scope                                           | Result                                   |
| ----------------------------------------------- | ---------------------------------------- |
| Baseline Next 15 tree                           | 14 moderate findings, zero high/critical |
| Initial Next 16 + OpenNext tooling              | 26 findings: 16 moderate, 10 high        |
| Final full tree                                 | **16 moderate, zero high/critical**      |
| Final production dependency tree (`--omit=dev`) | **Zero reported vulnerabilities**        |

An npm advisory count includes affected parents, not just distinct vulnerabilities. A clean production dependency audit does not prove the generated Worker or all application code is vulnerability-free.

## Applied fixes

- Pinned stable Next.js / matching lint config 16.4.5 and supported React / React DOM 19.3.1. Do not downgrade to npm's suggested ancient `eslint` 4 / `eslint-config-next` 0.2 / OpenNext 0.3 versions to silence the audit.
- Updated Wrangler from 4.148.0 to **4.157.0**, replacing vulnerable Miniflare `undici` and `sharp` resolutions with patched versions (undici 7.30.1, sharp 0.35.5).
- Scoped `glob` **14.0.3** overrides to OpenNext and `@node-minify/core`. These cross parent-declared major ranges, so they are explicit maintenance exceptions, not automatic upgrades. The import/API usage was reviewed and the entire OpenNext build, dry run and Workers browser suite pass with them.
- Scoped `adm-zip` **0.6.1** to `rclone.js` 0.6.6 to remove archive extraction/allocation findings. Its used constructor, `getEntries` and `extractEntryTo` interfaces were exercised with a local archive fixture. No global archive shim or dependency downgrade was introduced.
- Retained the existing PostCSS override. Lockfile versions, exact adapter pins and weekly Dependabot proposals provide a reviewable update path. Remove overrides when compatible upstream releases include the fixes.

## Remaining lint-tool risk

All 16 remaining moderate findings trace to [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), a minimatch pattern-amplification advisory. The patched major is 11; lint packages still depend on 3/10 (and bundled Next lint tooling on earlier majors). The advisory describes attacker-controlled glob patterns and optimization-level amplification. Here these packages process repository-controlled lint/type configuration during builds, not website requests.

A global minimatch 11 override would break legacy callable CommonJS consumers and is not an acceptable blind fix. Keep CI free of untrusted secret-bearing contexts, never run PR code with deployment secrets, and use dependency PRs to adopt compatible upstream fixes. Reassess before accepting a newly introduced high/critical finding or a runtime finding. The CI workflow fails on any production advisory and any full-tree high/critical advisory; moderate exceptions remain visible, not suppressed with an audit allowlist.

The clean install also warns that ESLint **9.39.5** is no longer supported. ESLint 10.14.0 was evaluated with a dry-run dependency resolution: current latest `eslint-plugin-react` 7.37.5, `eslint-plugin-import` 2.32.0 and `eslint-plugin-jsx-a11y` 6.10.2 still declare support only through ESLint 9, and npm reports peer overrides for 10. Forcing that unsupported combination would undermine the migration's maintenance goal. Retain the matching Next lint ecosystem temporarily, track this as an explicit tooling maintenance limitation, and move to ESLint 10 when those plugins/Next configuration support it. It is not an application runtime vulnerability or a reason to revert the validated Next.js 16 migration.

OpenNext/Wrangler are build dependencies. Deployment credentials are available only to the explicit deployment step after checks and environment approval, not to npm install/build/test steps. Workflows use pinned official Action SHAs; Dependabot proposes updates. Environment files, private keys, tool state and generated bundles remain ignored. No tokens, Sanity credentials or Cloudflare account IDs are committed.

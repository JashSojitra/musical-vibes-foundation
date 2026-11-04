import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".open-next-demo/**",
    ".open-next-staging/**",
    ".open-next-cms-preview/**",
    ".wrangler/**",
    "node_modules/**",
    "studio/node_modules/**",
    "studio/dist/**",
    "studio/.sanity/**",
    ".agents/**",
    ".codex/**",
    "docs/legacy-snapshot/**",
    "scripts/**",
    "next-env.d.ts",
    ".tmp/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

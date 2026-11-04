import { defineConfig } from "@playwright/test";
import release4 from "./playwright.release4.config";
const workerConfig = process.env.WORKER_CONFIG || "wrangler.jsonc";
if (!["wrangler.jsonc", "wrangler.staging.jsonc"].includes(workerConfig)) {
  throw new Error("Unknown local Worker configuration");
}

const target = process.env.VERIFICATION_TARGET || "next16";
const suiteSuffix =
  process.env.VERIFICATION_SUITE === "legacy" ? "-legacy" : "";
if (!["next16", "opennext", "vinext"].includes(target)) {
  throw new Error("Unknown verification target");
}
export default defineConfig({
  ...release4,
  outputDir: `test-results/migration-${target}`,
  webServer:
    process.env.START_WORKER_PREVIEW === "1"
      ? {
          command: `npm run cf:preview -- --config ${workerConfig} --port 3002`,
          url: "http://127.0.0.1:3002",
          timeout: 120000,
          reuseExistingServer: !process.env.CI,
        }
      : undefined,
  testMatch: [
    "staging.spec.ts",
    "site.spec.ts",
    "release4.spec.ts",
    "stage-a.spec.ts",
    "premium.spec.ts",
    "migration.spec.ts",
  ],
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    [
      "json",
      {
        outputFile: `docs/validation/migration/${target}${suiteSuffix}-tests.json`,
      },
    ],
  ],
});

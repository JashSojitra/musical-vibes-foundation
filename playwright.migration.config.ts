import { defineConfig } from "@playwright/test";
import release4 from "./playwright.release4.config";

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
          command: "npm run cf:preview -- --port 3002",
          url: "http://127.0.0.1:3002",
          timeout: 120000,
          reuseExistingServer: !process.env.CI,
        }
      : undefined,
  testMatch: [
    "site.spec.ts",
    "release4.spec.ts",
    "stage-a.spec.ts",
    "premium.spec.ts",
    "migration.spec.ts",
  ],
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: `docs/validation/migration/${target}${suiteSuffix}-tests.json`,
      },
    ],
  ],
});

import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: ["stage-a.spec.ts", "premium.spec.ts"],
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "docs/validation/release3-premium/test-results.json" },
    ],
  ],
});

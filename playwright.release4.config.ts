import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: ["release4.spec.ts", "stage-a.spec.ts", "premium.spec.ts"],
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/validation/release4/test-results.json" }],
  ],
  projects: [
    ...(base.projects ?? []),
    { name: "small-mobile", use: { viewport: { width: 360, height: 800 } } },
  ],
});

import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "stage-a.spec.ts",
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "docs/validation/release3-stage-a/test-results.json" },
    ],
  ],
  projects: base.projects?.filter((project) => project.name !== "tablet"),
});

import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "cms-preview-live.spec.ts",
  outputDir: "test-results/cms-preview-live",
  workers: 1,
  timeout: 60000,
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/validation/cms-preview/live-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3012",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run cf:preview:cms-preview",
    url: "http://127.0.0.1:3012/assets/image-unavailable.svg",
    timeout: 120000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } },
    },
  ],
});

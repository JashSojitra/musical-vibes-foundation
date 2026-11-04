import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "cms-preview.spec.ts",
  outputDir: "test-results/cms-preview",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/validation/cms-preview/results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3013",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/cms-preview-test-server.mjs",
    url: "http://127.0.0.1:3013/__queries",
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

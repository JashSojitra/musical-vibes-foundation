import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "icons.spec.ts",
  outputDir: "test-results/icons",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/validation/icons/results.json" }],
  ],
  use: {
    baseURL: process.env.VERIFY_BASE_URL || "http://127.0.0.1:3010",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3010",
    url: "http://127.0.0.1:3010",
    reuseExistingServer: false,
    timeout: 60000,
  },
  projects: ["chromium", "webkit"].flatMap((browserName) => [
    {
      name: `${browserName}-360`,
      use: {
        ...devices[browserName === "webkit" ? "iPhone SE" : "Pixel 5"],
        browserName: browserName as "chromium" | "webkit",
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: `${browserName}-390`,
      use: {
        ...devices[browserName === "webkit" ? "iPhone 13" : "Pixel 5"],
        browserName: browserName as "chromium" | "webkit",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: `${browserName}-768`,
      use: {
        ...devices["iPad Mini"],
        browserName: browserName as "chromium" | "webkit",
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: `${browserName}-desktop`,
      use: {
        browserName: browserName as "chromium" | "webkit",
        viewport: { width: 1440, height: 1000 },
      },
    },
  ]),
});

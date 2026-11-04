import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const child = spawn(
  process.execPath,
  [
    require.resolve("@playwright/test/cli"),
    "test",
    "--config",
    "playwright.migration.config.ts",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VERIFY_BASE_URL: "http://127.0.0.1:3002",
      VERIFICATION_TARGET: "opennext",
      START_WORKER_PREVIEW: "1",
    },
  },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

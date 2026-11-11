import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import {
  validateBundle,
  configFile,
  workerName,
} from "./production-config.mjs";
const [command, ...extra] = process.argv.slice(2);
if (!["dry-run", "deploy"].includes(command) || extra.length)
  throw Error("Only dry-run or deploy; no target overrides");
const receipt = validateBundle();
// Route attachment stays a separate, explicitly approved cutover operation.
if (
  command === "deploy" &&
  (process.env.PRODUCTION_CONFIRM !==
    `DEPLOY ${workerName} ${receipt.artifactHash}` ||
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.PRODUCTION_ACCOUNT_CONFIRM !==
      process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_API_TOKEN)
)
  throw Error(
    "Explicit artifact-hash confirmation and scoped production account credentials required; see docs/PRODUCTION-LAUNCH.md",
  );
const env = {
  ...process.env,
  OPEN_NEXT_DEPLOY: "true",
  WRANGLER_SEND_METRICS: "false",
};
for (const key of [
  "CLOUDFLARE_ENV",
  "WRANGLER_ENV",
  "SANITY_REPAIR_TOKEN",
  "SANITY_API_WRITE_TOKEN",
])
  delete env[key];
const require = createRequire(import.meta.url);
const child = spawn(
  process.execPath,
  [
    resolve(require.resolve("wrangler/package.json"), "../bin/wrangler.js"),
    "deploy",
    "--config",
    configFile,
    ...(command === "dry-run"
      ? ["--dry-run", "--outdir", ".tmp/production-dry-run"]
      : []),
  ],
  { stdio: "inherit", env },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

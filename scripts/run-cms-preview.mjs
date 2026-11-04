import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import {
  validateBundle,
  configFile,
  workerName,
} from "./cms-preview-config.mjs";

const [command, ...extra] = process.argv.slice(2);
if (!["preview", "deploy", "dry-run"].includes(command) || extra.length)
  throw new Error(
    "Use preview, dry-run or deploy; target overrides are not accepted.",
  );
validateBundle();
if (command === "deploy" && process.env.CMS_PREVIEW_CONFIRM !== workerName)
  throw new Error(
    `Set CMS_PREVIEW_CONFIRM=${workerName} for an explicit deployment.`,
  );
const require = createRequire(import.meta.url);
const env = { ...process.env };
delete env.CLOUDFLARE_ENV;
delete env.WRANGLER_ENV;
const child = spawn(
  process.execPath,
  [
    resolve(require.resolve("wrangler/package.json"), "../bin/wrangler.js"),
    command === "preview" ? "dev" : "deploy",
    "--config",
    configFile,
    ...(command === "preview"
      ? ["--local", "--port", "3012"]
      : command === "dry-run"
        ? ["--dry-run", "--outdir", ".tmp/cms-preview-dry-run"]
        : []),
  ],
  {
    stdio: "inherit",
    env: {
      ...env,
      OPEN_NEXT_DEPLOY: "true",
      WRANGLER_SEND_METRICS: "false",
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

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { stagingHeaders } from "../cloudflare/staging-headers.mjs";
import { CACHE_DIR } from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
const require = createRequire(import.meta.url);
const cli = resolve(
  require.resolve("@opennextjs/cloudflare"),
  "../../cli/index.js",
);
const result = spawnSync(
  process.execPath,
  [cli, "build", "--config", "wrangler.staging.jsonc"],
  { stdio: "inherit", env: process.env },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
// Keep staging policies out of the ordinary production output.
const stagingOutput = resolve(".open-next-staging");
if (
  dirname(stagingOutput) !== process.cwd() ||
  basename(stagingOutput) !== ".open-next-staging"
) {
  throw new Error(
    "Refusing to replace a path outside the generated staging directory",
  );
}
rmSync(stagingOutput, { recursive: true, force: true });
cpSync(resolve(".open-next"), stagingOutput, { recursive: true });
// OpenNext normally materializes this during preview/deploy in its default output.
// Populate the isolated ASSETS bundle now so staging keeps its prerendered cache.
cpSync(
  resolve(".open-next/cache"),
  resolve(stagingOutput, "assets", CACHE_DIR),
  { recursive: true },
);
// Static assets bypass the Worker: apply the same staging-only headers there.
const file = resolve(stagingOutput, "assets/_headers");
const base = readFileSync("public/_headers", "utf8");
writeFileSync(
  file,
  base +
    "\n/*\n" +
    Object.entries(stagingHeaders)
      .map(([name, value]) => `  ${name}: ${value}`)
      .join("\n") +
    "\n",
);

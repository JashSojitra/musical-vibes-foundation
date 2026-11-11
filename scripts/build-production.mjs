import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  cpSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { resolve } from "node:path";
import { CACHE_DIR } from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

import {
  root,
  staging,
  output,
  configFile,
  workerName,
  publicVars,
  validateConfig,
  managedDirectory,
  digest,
  validateBundle,
  artifactHash,
} from "./production-config.mjs";

validateConfig();
mkdirSync(resolve(root, ".tmp"), { recursive: true });
rmSync(managedDirectory(staging), { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
// Explicit allowlist: never copy env files, credentials, Studio state or dataset backups.
for (const path of [
  "src",
  "public",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "next-env.d.ts",
  "postcss.config.mjs",
  "open-next.config.ts",
  configFile,
]) {
  cpSync(resolve(root, path), resolve(staging, path), { recursive: true });
}
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !/^(SANITY_|NEXT_PUBLIC_SANITY_|CLOUDFLARE_|GITHUB_TOKEN$|GH_TOKEN$|CONTENT_SOURCE$)/i.test(
        key,
      ),
  ),
);
Object.assign(env, publicVars, {
  NEXT_TELEMETRY_DISABLED: "1",
  WRANGLER_SEND_METRICS: "false",
});
function run(file, args) {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: staging,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const npmCli =
  process.env.npm_execpath ||
  resolve(process.execPath, "../node_modules/npm/bin/npm-cli.js");
run(npmCli, ["ci", "--no-audit", "--no-fund"]);
const mirrorRequire = createRequire(resolve(staging, "package.json"));
const cli = resolve(
  mirrorRequire.resolve("@opennextjs/cloudflare"),
  "../../cli/index.js",
);
run(cli, ["build", "--config", configFile]);
const nextConfig = JSON.parse(
  readFileSync(resolve(staging, ".next/required-server-files.json"), "utf8"),
);
if (nextConfig.config.env.CONTENT_SOURCE !== "sanity")
  throw new Error("Preview build is not configured for Sanity");
const prerender = JSON.parse(
  readFileSync(resolve(staging, ".next/prerender-manifest.json"), "utf8"),
);
if (
  Object.keys(prerender.routes).some(
    (path) =>
      ![
        "/icon.png",
        "/apple-icon.png",
        "/favicon.ico",
        "/_global-error",
      ].includes(path),
  )
)
  throw new Error("Unexpected static CMS content route");
rmSync(managedDirectory(output), { recursive: true, force: true });
cpSync(resolve(staging, ".open-next"), output, { recursive: true });
const publicAssets = resolve(output, "assets/assets");
// This path is inside the verified generated output, never the source public/ directory.
rmSync(publicAssets, { recursive: true, force: true });
for (const file of ["assets/legacy/logo.png", "assets/image-unavailable.svg"]) {
  mkdirSync(resolve(output, "assets", file, ".."), { recursive: true });
  cpSync(resolve(root, "public", file), resolve(output, "assets", file));
}
if (existsSync(resolve(output, "cache")))
  cpSync(resolve(output, "cache"), resolve(output, "assets", CACHE_DIR), {
    recursive: true,
  });
writeFileSync(
  resolve(output, "assets/_headers"),
  readFileSync("public/_headers", "utf8"),
);
writeFileSync(
  resolve(output, "production-build.json"),
  JSON.stringify(
    {
      worker: workerName,
      publicVars,
      configHash: digest(readFileSync(configFile)),
      wrapperHash: digest(readFileSync("cloudflare/production-worker.mjs")),
      routingHash: digest(readFileSync("cloudflare/production-routing.mjs")),
      artifactHash: artifactHash(),
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
validateBundle();
console.log(
  `Built ${workerName} in ${output}. Existing .next, .open-next and .open-next-demo were not replaced.`,
);

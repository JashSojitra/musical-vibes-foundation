import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { demoHeaders } from "../cloudflare/demo-headers.mjs";
import { CACHE_DIR } from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import { publicDemoAssetPaths, publicDemoMedia } from "./public-demo-media.mjs";
const require = createRequire(import.meta.url);
const cli = resolve(
  require.resolve("@opennextjs/cloudflare"),
  "../../cli/index.js",
);
const result = spawnSync(
  process.execPath,
  [cli, "build", "--config", "wrangler.demo.jsonc"],
  { stdio: "inherit", env: { ...process.env, CONTENT_SOURCE: "local" } },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
// Keep demo policies out of the ordinary production output.
const demoOutput = resolve(".open-next-demo");
if (
  dirname(demoOutput) !== process.cwd() ||
  basename(demoOutput) !== ".open-next-demo"
) {
  throw new Error(
    "Refusing to replace a path outside the generated demo directory",
  );
}
rmSync(demoOutput, { recursive: true, force: true });
cpSync(resolve(".open-next"), demoOutput, { recursive: true });
// Exclude unused originals from the upload without deleting source assets.
const photoDirectory = resolve(demoOutput, "assets/assets");
if (dirname(photoDirectory) !== resolve(demoOutput, "assets"))
  throw new Error("Invalid generated photo directory");
rmSync(photoDirectory, { recursive: true, force: true });
for (const path of publicDemoAssetPaths) {
  const target = resolve(demoOutput, "assets", path.slice(1));
  mkdirSync(dirname(target), { recursive: true });
  cpSync(resolve("public", path.slice(1)), target);
}
console.log(
  `Demo media: ${publicDemoMedia.length} published/approved photographs and the authentic logo; unused originals excluded.`,
);
// OpenNext normally materializes this during preview/deploy in its default output.
// Populate the isolated ASSETS bundle now so demo keeps its prerendered cache.
cpSync(resolve(".open-next/cache"), resolve(demoOutput, "assets", CACHE_DIR), {
  recursive: true,
});
// Static assets bypass the Worker: apply the same demo-only headers there.
const file = resolve(demoOutput, "assets/_headers");
const base = readFileSync("public/_headers", "utf8");
writeFileSync(
  file,
  base +
    "\n/*\n" +
    Object.entries(demoHeaders)
      .map(([name, value]) => `  ${name}: ${value}`)
      .join("\n") +
    "\n",
);

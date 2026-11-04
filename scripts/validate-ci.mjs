import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { CACHE_DIR } from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import { relative, resolve } from "node:path";
import { publicDemoAssetPaths } from "./public-demo-media.mjs";

const source = readFileSync("wrangler.demo.jsonc", "utf8");
const { config, error } = ts.parseConfigFileTextToJson(
  "wrangler.demo.jsonc",
  source,
);
assert.equal(error, undefined, "Demo config must be valid JSONC");
assert.equal(config.name, "musical-vibes-foundation-demo");
assert.equal(config.main, "cloudflare/demo-worker.mjs");
assert.deepEqual(
  config.routes,
  [],
  "Demo cannot attach a domain or zone route",
);
for (const key of [
  "env",
  "account_id",
  "zone_id",
  "route",
  "services",
  "r2_buckets",
  "kv_namespaces",
  "d1_databases",
  "durable_objects",
]) {
  assert.equal(
    config[key],
    undefined,
    `Unexpected demo binding/target: ${key}`,
  );
}
assert.equal(config.workers_dev, true);
assert.equal(config.preview_urls, false);
assert.equal(config.vars.DEPLOYMENT_ENV, "demo");
assert.equal(config.images.binding, "IMAGES");
assert.equal(config.assets.binding, "ASSETS");
assert.equal(config.assets.directory, ".open-next-demo/assets");

const ci = readFileSync(".github/workflows/validate.yml", "utf8");
assert(
  !/\bsecrets\s*[.[]/.test(ci),
  "Validation CI must never require deployment secrets",
);
assert(
  !/pull_request_target/.test(ci),
  "Do not run untrusted PR code in a privileged trigger",
);
const deploy = readFileSync(".github/workflows/deploy.yml", "utf8");
assert(
  !/^\s*environment:/m.test(deploy),
  "Public demo must not require environment approval",
);
assert(deploy.includes("needs: verify"));
assert(deploy.includes("github.ref == 'refs/heads/main'"));
assert(
  !/production|inputs\.target/.test(deploy),
  "This workflow must have no production deployment target",
);
assert(deploy.includes("secrets.CLOUDFLARE_API_TOKEN"));
assert(deploy.includes("secrets.CLOUDFLARE_ACCOUNT_ID"));
assert(deploy.includes("npm run cf:deploy:demo"));
if (process.argv.includes("--built")) {
  const root = resolve(".open-next-demo/assets");
  const assets = readdirSync(resolve(root, "assets"), {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map(
      (entry) =>
        "/" +
        relative(root, resolve(entry.parentPath, entry.name)).replaceAll(
          "\\",
          "/",
        ),
    );
  assert.deepEqual(
    assets.sort(),
    [...publicDemoAssetPaths].sort(),
    "Demo contains an unapproved/missing photo asset",
  );
  assert.equal(
    readFileSync(".open-next/assets/_headers", "utf8"),
    readFileSync("public/_headers", "utf8"),
    "Demo must not change ordinary output headers",
  );
  assert(
    readFileSync(".open-next-demo/assets/_headers", "utf8").includes(
      "X-Robots-Tag: noindex, nofollow",
    ),
  );
  const cache = readdirSync(`.open-next-demo/assets/${CACHE_DIR}`, {
    recursive: true,
  });
  assert(
    cache.some((file) => file.endsWith(".cache")),
    "Demo ASSETS must include the prerendered incremental cache",
  );
  console.log("Separated demo headers and prerendered cache packaging passed.");
}
console.log(
  "CI secret boundary and demo target checks passed. Run pinned actionlint for full workflow syntax validation.",
);

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { CACHE_DIR } from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const source = readFileSync("wrangler.staging.jsonc", "utf8");
const { config, error } = ts.parseConfigFileTextToJson(
  "wrangler.staging.jsonc",
  source,
);
assert.equal(error, undefined, "Staging config must be valid JSONC");
assert.equal(config.name, "musical-vibes-foundation-staging");
assert.equal(config.main, "cloudflare/staging-worker.mjs");
assert.deepEqual(
  config.routes,
  [],
  "Staging cannot attach a domain or zone route",
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
    `Unexpected staging binding/target: ${key}`,
  );
}
assert.equal(config.workers_dev, true);
assert.equal(config.preview_urls, false);
assert.equal(config.vars.DEPLOYMENT_ENV, "staging");
assert.equal(config.images.binding, "IMAGES");
assert.equal(config.assets.binding, "ASSETS");
assert.equal(config.assets.directory, ".open-next-staging/assets");

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
assert(deploy.includes("environment: staging"));
assert(deploy.includes("needs: verify"));
assert(deploy.includes("github.ref == 'refs/heads/main'"));
assert(
  !/production|inputs\.target/.test(deploy),
  "This workflow must have no production deployment target",
);
assert(deploy.includes("CLOUDFLARE_STAGING_API_TOKEN"));
assert(deploy.includes("npm run cf:deploy:staging"));
if (process.argv.includes("--built")) {
  assert.equal(
    readFileSync(".open-next/assets/_headers", "utf8"),
    readFileSync("public/_headers", "utf8"),
    "Staging must not change ordinary output headers",
  );
  assert(
    readFileSync(".open-next-staging/assets/_headers", "utf8").includes(
      "X-Robots-Tag: noindex, nofollow",
    ),
  );
  const cache = readdirSync(`.open-next-staging/assets/${CACHE_DIR}`, {
    recursive: true,
  });
  assert(
    cache.some((file) => file.endsWith(".cache")),
    "Staging ASSETS must include the prerendered incremental cache",
  );
  console.log(
    "Separated staging headers and prerendered cache packaging passed.",
  );
}
console.log(
  "CI secret boundary and staging target checks passed. Run pinned actionlint for full workflow syntax validation.",
);

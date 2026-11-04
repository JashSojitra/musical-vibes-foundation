import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateConfig,
  workerName,
  publicVars,
} from "../scripts/cms-preview-config.mjs";
import { readFileSync } from "node:fs";

test("CMS preview has a fixed separate target, public read configuration and no routes", () => {
  const config = validateConfig();
  assert.equal(config.name, workerName);
  assert.equal(config.vars.CONTENT_SOURCE, "sanity");
  assert.equal(
    config.vars.NEXT_PUBLIC_SANITY_API_VERSION,
    publicVars.NEXT_PUBLIC_SANITY_API_VERSION,
  );
  for (const patch of [
    { name: "musical-vibes-foundation-demo" },
    { name: "musical-vibes-foundation" },
    { routes: ["www.musicalvibesfoundation.com/*"] },
    { route: "example.org/*" },
    { assets: { binding: "ASSETS", directory: ".open-next-demo/assets" } },
    { vars: { ...config.vars, SANITY_API_WRITE_TOKEN: "forbidden" } },
    { vars: { ...config.vars, CONTENT_SOURCE: "local" } },
    { env: { production: { name: "musical-vibes-foundation" } } },
  ])
    assert.throws(() => validateConfig({ ...config, ...patch }));
});

test("CMS preview deploy path is manual, branch-guarded and uses only Cloudflare credentials", () => {
  const entry = readFileSync(".github/workflows/deploy.yml", "utf8");
  const preview = readFileSync(
    ".github/workflows/deploy-cms-preview.yml",
    "utf8",
  );
  assert.match(entry, /workflow_dispatch:/);
  assert.match(entry, /refs\/heads\/feat\/sanity-cms/);
  assert.match(entry, /uses: \.\/\.github\/workflows\/deploy-cms-preview.yml/);
  assert.match(preview, /workflow_call:/);
  assert.doesNotMatch(preview, /^\s*(push|pull_request|schedule):/m);
  assert.match(preview, /CMS_PREVIEW_CONFIRM/);
  assert.doesNotMatch(
    preview,
    /SANITY_.*TOKEN|cf:deploy:demo|wrangler\.demo\.jsonc/,
  );
});

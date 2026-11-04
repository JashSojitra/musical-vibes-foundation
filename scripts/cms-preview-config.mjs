import assert from "node:assert/strict";
import {
  readFileSync,
  existsSync,
  lstatSync,
  realpathSync,
  readdirSync,
} from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { createHash } from "node:crypto";
import ts from "typescript";

export const root = process.cwd();
export const configFile = "wrangler.cms-preview.jsonc";
export const workerName = "musical-vibes-foundation-cms-preview";
export const output = resolve(root, ".open-next-cms-preview");
export const staging = resolve(root, ".tmp/cms-preview-build");
export const publicVars = {
  CONTENT_SOURCE: "sanity",
  NEXT_PUBLIC_SANITY_PROJECT_ID: "6jpdhhxg",
  NEXT_PUBLIC_SANITY_DATASET: "production",
  NEXT_PUBLIC_SANITY_API_VERSION: "2026-11-01",
};
export function validateConfig(input) {
  const parsed = ts.parseConfigFileTextToJson(
    configFile,
    readFileSync(configFile, "utf8"),
  );
  assert.equal(parsed.error, undefined);
  const config = input || parsed.config;
  assert.deepEqual(
    Object.keys(config).sort(),
    [
      "$schema",
      "name",
      "main",
      "compatibility_date",
      "compatibility_flags",
      "workers_dev",
      "preview_urls",
      "routes",
      "assets",
      "images",
      "vars",
      "observability",
      "upload_source_maps",
    ].sort(),
  );
  assert.equal(config.name, workerName);
  assert.equal(config.main, "cloudflare/cms-preview-worker.mjs");
  assert.deepEqual(config.routes, []);
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.assets, {
    directory: ".open-next-cms-preview/assets",
    binding: "ASSETS",
  });
  assert.deepEqual(config.images, { binding: "IMAGES" });
  assert.deepEqual(config.vars, {
    DEPLOYMENT_ENV: "cms-preview",
    ...publicVars,
  });
  assert.equal(config.compatibility_date, "2026-11-03");
  assert.deepEqual(config.compatibility_flags, [
    "nodejs_compat",
    "global_fetch_strictly_public",
  ]);
  return config;
}
// Resolve and reject symlinks before any recursive replacement of our two generated directories.
export function managedDirectory(path) {
  assert.ok(
    [output, staging].includes(path),
    `Unmanaged generated path: ${path}`,
  );
  assert.equal(realpathSync(dirname(path)), dirname(path));
  if (existsSync(path)) assert.equal(lstatSync(path).isSymbolicLink(), false);
  return path;
}
export const digest = (data) => createHash("sha256").update(data).digest("hex");
export function artifactHash(directory = output) {
  const hash = createHash("sha256");
  function walk(path) {
    for (const item of readdirSync(path, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const file = resolve(path, item.name);
      if (item.isDirectory()) walk(file);
      else if (item.name !== "cms-preview-build.json")
        hash
          .update(relative(directory, file).replaceAll("\\", "/"))
          .update(readFileSync(file));
    }
  }
  walk(directory);
  return hash.digest("hex");
}
export function validateBundle() {
  validateConfig();
  const receipt = JSON.parse(
    readFileSync(resolve(output, "cms-preview-build.json"), "utf8"),
  );
  assert.equal(receipt.worker, workerName);
  assert.deepEqual(receipt.publicVars, publicVars);
  assert.equal(receipt.configHash, digest(readFileSync(configFile)));
  assert.equal(
    receipt.wrapperHash,
    digest(readFileSync("cloudflare/cms-preview-worker.mjs")),
    "Worker wrapper changed; rebuild CMS preview",
  );
  assert.equal(
    receipt.artifactHash,
    artifactHash(),
    "CMS preview bundle changed or came from another build; rebuild",
  );
  const required = [
    "worker.js",
    "assets/assets/legacy/logo.png",
    "assets/assets/image-unavailable.svg",
  ];
  required.forEach((file) =>
    assert.ok(
      existsSync(resolve(output, file)),
      `Missing CMS preview artifact: ${file}`,
    ),
  );
  assert.equal(existsSync(resolve(output, "assets/assets/curated")), false);
  assert.match(
    readFileSync(resolve(output, "assets/_headers"), "utf8"),
    /X-Robots-Tag: noindex, nofollow/,
  );
  return receipt;
}

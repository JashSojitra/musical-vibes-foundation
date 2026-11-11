import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { inventory, inspect } from "../scripts/recover-photos.mjs";

const root = resolve(import.meta.dirname, "..");
const tsx = join(root, "node_modules/tsx/dist/cli.mjs");
const run = (args, env = {}) =>
  spawnSync(process.execPath, args, {
    cwd: root,
    env: { ...process.env, SANITY_REPAIR_TOKEN: "", NODE_OPTIONS: "", ...env },
    encoding: "utf8",
    timeout: 30_000,
  });
const output = (result) => `${result.stdout}\n${result.stderr}`;

test("tsx CommonJS imports expose photo libraries without executing their CLIs", () => {
  const result = run([
    tsx,
    "--eval",
    `
    const assert = require('node:assert/strict');
    const recovery = require('./scripts/recover-photos.mjs');
    const photos = require('./scripts/photo-import-plan.mjs');
    for (const name of ['recover', 'inventory', 'inspect', 'sha', 'sourceURL'])
      assert.equal(typeof recovery[name], 'function');
    for (const name of ['photoPlan', 'verifiedPhotoPlan'])
      assert.equal(typeof photos[name], 'function');
    console.log('imported');
  `,
  ]);
  assert.equal(result.status, 0, output(result));
  assert.equal(result.stdout.trim(), "imported");
});

test("standalone photo CLIs still validate arguments under Node and tsx", () => {
  for (const script of ["recover-photos.mjs", "photo-import-plan.mjs"]) {
    for (const prefix of [[], [tsx]]) {
      const args = script === "recover-photos.mjs" ? ["--invalid"] : [];
      const result = run([...prefix, `scripts/${script}`, ...args]);
      assert.equal(result.status, 1, output(result));
      assert.match(result.stderr, /Only --offline|Usage: npm run photos:plan/);
      assert.doesNotMatch(result.stderr, /top-level await|TransformError/);
    }
  }
});

test("standalone recovery and proposal CLIs complete offline with fixture originals", async () => {
  await mkdir(join(root, ".tmp"), { recursive: true });
  const dir = await mkdtemp(join(root, ".tmp/photo-cli-regression-"));
  const photoDir = join(dir, ".tmp/photo-recovery");
  const indexDir = join(dir, "docs/legacy-snapshot");
  await mkdir(join(photoDir, "objects"), { recursive: true });
  await mkdir(indexDir, { recursive: true });
  const albums = [
    {
      title: "Fixture",
      photos: ["../assets/fixture.jpg"],
      videos: [],
      malformed: [],
    },
  ];
  const bytes = Buffer.from(
    "ffd8ffc00011080002000303012200021100031100ffd9",
    "hex",
  );
  const metadata = inspect(bytes);
  const local = `objects/${metadata.sha256}.bin`;
  await writeFile(join(photoDir, local), bytes);
  await writeFile(
    join(photoDir, "inventory.json"),
    JSON.stringify({
      format: 1,
      photos: inventory(albums).map((row) => ({
        ...row,
        ...metadata,
        local,
        status: "success",
      })),
    }),
  );
  await writeFile(join(indexDir, "gallery-index.json"), JSON.stringify(albums));
  await writeFile(join(indexDir, "gallery-manifest.json"), "[]");
  await writeFile(
    join(dir, "documents.ndjson"),
    JSON.stringify({ _id: "owner", _rev: "r1", _type: "siteSettings" }) + "\n",
  );
  for (const prefix of [[], [tsx]]) {
    for (const [script, args] of [
      ["recover-photos.mjs", ["--offline"]],
      ["photo-import-plan.mjs", [join(dir, "documents.ndjson")]],
    ]) {
      const result = spawnSync(
        process.execPath,
        [...prefix, join(root, "scripts", script), ...args],
        {
          cwd: dir,
          env: { ...process.env, SANITY_REPAIR_TOKEN: "", NODE_OPTIONS: "" },
          encoding: "utf8",
          timeout: 30_000,
        },
      );
      assert.equal(result.status, 0, output(result));
    }
  }
  const report = JSON.parse(
    await readFile(join(photoDir, "report.json"), "utf8"),
  );
  assert.equal(report.successful, 1);
  assert.equal(report.failed, 0);
  const proposals = (await readdir(photoDir)).filter((name) =>
    name.startsWith("proposal-"),
  );
  assert.equal(proposals.length, 2);
  for (const name of proposals) {
    const proposal = JSON.parse(await readFile(join(photoDir, name), "utf8"));
    assert.equal(proposal.imports.length, 1);
    assert.equal(proposal.albumProposals[0].album, "Fixture");
  }
});

test("actual npm production planner validates private fixture backup and recovered binaries with GET only", async () => {
  // Everything is synthetic and ignored; never load operator backups or credentials.
  await mkdir(join(root, ".tmp"), { recursive: true });
  const dir = await mkdtemp(join(root, ".tmp/planner-regression-"));
  const photoDir = join(dir, "photos");
  await mkdir(join(photoDir, "objects"), { recursive: true });
  const bytes = Buffer.from(
    "ffd8ffc00011080002000303012200021100031100ffd9",
    "hex",
  );
  const metadata = inspect(bytes);
  const local = `objects/${metadata.sha256}.bin`;
  await writeFile(join(photoDir, local), bytes);
  const albums = JSON.parse(
    await readFile(
      join(root, "docs/legacy-snapshot/gallery-index.json"),
      "utf8",
    ),
  );
  await writeFile(
    join(photoDir, "inventory.json"),
    JSON.stringify({
      format: 1,
      photos: inventory(albums).map((row) => ({
        ...row,
        ...metadata,
        local,
        status: "success",
      })),
    }),
  );
  const docs = [
    { _id: "fixture-owner", _rev: "r1", _type: "siteSettings" },
    {
      _id: `image-${metadata.sha1}-3x2-jpg`,
      _rev: "r1",
      _type: "sanity.imageAsset",
      sha1hash: metadata.sha1,
      size: bytes.length,
    },
  ].sort((a, b) => a._id.localeCompare(b._id));
  const stable = (value) =>
    JSON.stringify(value, (_key, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((key) => [key, v[key]]),
          )
        : v,
    );
  const documentsHash = createHash("sha256").update(stable(docs)).digest("hex");
  const target = {
    projectId: "6jpdhhxg",
    dataset: "production",
    apiVersion: "2026-11-01",
  };
  await writeFile(
    join(dir, "documents.ndjson"),
    docs.map((d) => JSON.stringify(d)).join("\n") + "\n",
  );
  await writeFile(join(dir, "asset.bin"), bytes);
  await writeFile(
    join(dir, "export.ndjson"),
    docs.map((d) => JSON.stringify(d)).join("\n") + "\n",
  );
  await writeFile(
    join(dir, "backup.json"),
    JSON.stringify({
      version: 1,
      target,
      createdAt: new Date().toISOString(),
      documentsHash,
      assets: [
        {
          id: docs[1]._id,
          file: "asset.bin",
          bytes: bytes.length,
          sha256: metadata.sha256,
        },
      ],
    }),
  );
  const preload = join(dir, "export-fixture.mjs");
  await writeFile(
    preload,
    `
    import assert from 'node:assert/strict';
    import { readFile } from 'node:fs/promises';
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://6jpdhhxg.api.sanity.io/v2026-11-01/data/export/production');
      assert.equal(options.method || 'GET', 'GET');
      assert.equal(options.headers.Authorization, 'Bearer fixture-token');
      return new Response(await readFile(new URL('./export.ndjson', import.meta.url), 'utf8'));
    };
  `,
  );
  const env = {
    SANITY_REPAIR_TOKEN: "fixture-token",
    NODE_OPTIONS: `--import=${pathToFileURL(preload).href}`,
  };
  const args = ["run", "production:content:plan", "--", dir, "-", photoDir];
  // npm_execpath avoids invoking npm.cmd directly on the operator's Windows host.
  const npmCli = process.env.npm_execpath;
  const result = spawnSync(
    npmCli ? process.execPath : "npm",
    npmCli ? [npmCli, ...args] : args,
    {
      cwd: root,
      env: { ...process.env, ...env },
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  assert.equal(result.status, 0, output(result));
  const report = JSON.parse(
    await readFile(join(dir, "production-plan.json"), "utf8"),
  );
  assert.equal(report.backupHash, documentsHash);
  assert.equal(report.historicalPhotoMigration.imports.length, 1);
  assert.equal(
    report.historicalPhotoMigration.imports[0].action,
    "reuse-existing-asset",
  );
  assert.equal(
    report.historicalPhotoMigration.albumProposals.length,
    albums.length,
  );
  const again = run(
    [tsx, "scripts/production-content-audit.ts", dir, "-", photoDir],
    env,
  );
  assert.equal(again.status, 1, output(again));
  assert.match(again.stderr, /EEXIST/);
  assert.deepEqual(
    JSON.parse(await readFile(join(dir, "production-plan.json"), "utf8")),
    report,
  );
  await writeFile(join(photoDir, local), Buffer.from("corrupted fixture"));
  const corrupt = run(
    [tsx, "scripts/production-content-audit.ts", dir, "-", photoDir],
    env,
  );
  assert.equal(corrupt.status, 1, output(corrupt));
  assert.match(
    corrupt.stderr,
    /Unsupported or invalid image|integrity mismatch/,
  );
  await writeFile(join(photoDir, local), bytes);
  await writeFile(
    join(dir, "export.ndjson"),
    docs.map((d) => JSON.stringify({ ...d, _rev: "changed" })).join("\n") +
      "\n",
  );
  const changedDataset = run(
    [tsx, "scripts/production-content-audit.ts", dir, "-", photoDir],
    env,
  );
  assert.equal(changedDataset.status, 1, output(changedDataset));
  assert.match(changedDataset.stderr, /Dataset drift/);
  await writeFile(
    join(dir, "documents.ndjson"),
    JSON.stringify({ ...docs[0], _rev: "changed" }) + "\n",
  );
  const drift = run(
    [tsx, "scripts/production-content-audit.ts", dir, "-", photoDir],
    env,
  );
  assert.equal(drift.status, 1, output(drift));
  assert.match(drift.stderr, /Backup document hash mismatch/);
  const missingToken = run([
    tsx,
    "scripts/production-content-audit.ts",
    dir,
    "-",
    photoDir,
  ]);
  assert.equal(missingToken.status, 1, output(missingToken));
  assert.match(missingToken.stderr, /Missing full-read SANITY_REPAIR_TOKEN/);
});

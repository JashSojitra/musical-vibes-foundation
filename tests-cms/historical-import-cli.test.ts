import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { hash, target } from "../scripts/sanity-repair-plan";
import { recover } from "../scripts/recover-photos.mjs";

test("preload file URLs encode Windows and Linux absolute paths", () => {
  for (const [path, windows, expected] of [
    [
      "C:\\private inputs\\block#network%.mjs",
      true,
      "file:///C:/private%20inputs/block%23network%25.mjs",
    ],
    [
      "/tmp/private inputs/block#network%.mjs",
      false,
      "file:///tmp/private%20inputs/block%23network%25.mjs",
    ],
  ] as const) {
    assert.equal(pathToFileURL(path, { windows }).href, expected);
  }
});

test("Node 24 + tsx entry point plans offline from a real verified backup, never requires private production files", async () => {
  assert.equal(
    Number(process.versions.node.split(".")[0]),
    24,
    "Run this integration check under Node 24",
  );
  await mkdir(".tmp", { recursive: true });
  const root = await mkdtemp(resolve(".tmp/historical-entry-"));
  const backupDir = join(root, "backup"),
    photos = join(root, "photos"),
    run = join(root, "run");
  await mkdir(backupDir);
  await mkdir(photos);
  const docs = [
    {
      _id: "owner",
      _rev: "r",
      _type: "siteSettings",
      title: "Keep owner content",
    },
  ];
  await writeFile(
    join(backupDir, "documents.ndjson"),
    docs.map((d) => JSON.stringify(d)).join("\n"),
  );
  await writeFile(
    join(backupDir, "backup.json"),
    JSON.stringify({
      version: 1,
      target,
      createdAt: new Date().toISOString(),
      documentsHash: hash(docs),
      assets: [],
    }),
  );
  const albums = JSON.parse(
    await readFile("docs/legacy-snapshot/gallery-index.json", "utf8"),
  );
  const bytes = Buffer.from(
    "ffd8ffc00011080002000303012200021100031100ffd9",
    "hex",
  );
  const recovery = await recover({
    dir: photos,
    albums,
    interval: 0,
    concurrency: 2,
    retries: 0,
    fetcher: async () => new Response(bytes),
  });
  assert.equal(
    recovery.failed,
    0,
    "Fixture recovery must finish before the CLI starts",
  );
  assert.equal(recovery.successful, 307);
  const blocker = join(root, "block network#%.mjs");
  await writeFile(
    blocker,
    'globalThis.fetch = async () => { throw Error("NETWORK FORBIDDEN IN CLI TEST"); };',
  );
  const env = { ...process.env, SANITY_REPAIR_TOKEN: "", NODE_OPTIONS: "" };
  const args = ["--backup", backupDir, "--photos", photos, "--run", run];
  const invoke = (mode: string, extras: string[] = []) =>
    spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--import",
        // --import takes a module URL; a Windows drive path is parsed as c:.
        pathToFileURL(blocker).href,
        "scripts/historical-import.ts",
        mode,
        ...args,
        ...extras,
      ],
      { encoding: "utf8", env, timeout: 20000 },
    );
  const result = invoke("plan");
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No network or CMS writes/);
  const plan = JSON.parse(await readFile(join(run, "plan.json"), "utf8"));
  assert.equal(plan.drafts.length, 14);
  assert.equal(plan.imports.length, 1);
  const validate = invoke("validate");
  assert.equal(validate.status, 1); // No credential: fail closed.
  assert.match(validate.stderr, /importer stopped/);
  const illegal = invoke("verify", ["--write"]);
  assert.equal(illegal.status, 1);
  assert.ok(!result.stdout.includes("SANITY_REPAIR_TOKEN"));
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { hash, target } from "../scripts/sanity-repair-plan";

test("cleanup CLI plans offline and refuses unauthenticated writes, public artifacts and unsafe flags", async () => {
  await mkdir(".tmp", { recursive: true });
  const root = await mkdtemp(resolve(".tmp/cleanup-cli-")),
    backup = join(root, "backup"),
    run = join(root, "run");
  await mkdir(backup);
  const docs = [
    {
      _id: "5616f846-7b1b-4264-9c96-e76c0fe846e6",
      _type: "journalEntry",
      _rev: "fixture-test",
    },
    {
      _id: "owner",
      _type: "siteSettings",
      _rev: "owner-revision",
      title: "Keep owner",
    },
  ];
  await writeFile(
    join(backup, "documents.ndjson"),
    docs.map((d) => JSON.stringify(d)).join("\n"),
  );
  await writeFile(
    join(backup, "backup.json"),
    JSON.stringify({
      version: 1,
      target,
      createdAt: new Date().toISOString(),
      documentsHash: hash(docs),
      assets: [],
    }),
  );
  const blocker = join(root, "network #blocked.mjs");
  await writeFile(
    blocker,
    'globalThis.fetch=async()=>{throw Error("NETWORK FORBIDDEN");};',
  );
  const common = ["--backup", backup, "--run", run];
  const invoke = (args: string[]) =>
    spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--import",
        pathToFileURL(blocker).href,
        "scripts/historical-cleanup.ts",
        ...args,
      ],
      {
        encoding: "utf8",
        timeout: 20000,
        env: { ...process.env, SANITY_REPAIR_TOKEN: "", NODE_OPTIONS: "" },
      },
    );
  const planned = invoke(["plan", ...common]);
  assert.ifError(planned.error);
  assert.equal(planned.status, 0, planned.stderr);
  const plan = JSON.parse(await readFile(join(run, "plan.json"), "utf8"));
  assert.equal(plan.deletions.length, 1);
  assert.equal(
    invoke([
      "execute",
      ...common,
      "--write",
      "--confirm",
      `CLEANUP 6jpdhhxg/production ${plan.hash}`,
    ]).status,
    1,
  );
  for (const args of [
    ["verify", ...common, "--write"],
    ["plan", ...common, "--force"],
    ["plan", "--backup", backup, "--run", "public/unsafe"],
    ["plan", ...common, "--run", run],
  ])
    assert.equal(invoke(args).status, 1);
  await assert.rejects(readFile(join(run, "intent.json")), { code: "ENOENT" });
});

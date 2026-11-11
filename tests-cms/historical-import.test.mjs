import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  makePlan,
  validateFiles,
  initialState,
  runPhase,
  digest,
  target,
} from "../scripts/historical-import.mjs";
import {
  sanityAPI,
  parseArgs,
  runCLI,
  verifyReuse,
} from "../scripts/historical-import-cli.mjs";
import {
  recover,
  inventory as recoveryInventory,
} from "../scripts/recover-photos.mjs";
const image = Buffer.from(
  "ffd8ffc00011080002000303012200021100031100ffd9",
  "hex",
);
const doc = (_id, _type, extra = {}) => ({
  _id,
  _type,
  _rev: "rev-" + _id,
  ...extra,
});
const owner = doc("owner", "siteSettings", {
  title: "Owner content",
  nested: { caption: "Keep", crop: { top: 0.3 }, ref: { _ref: "keep" } },
});
const album = (title, paths) => ({
  title,
  photos: paths.map((n) => `../assets/test/${n}.jpg`),
  videos: [],
  malformed: [],
});
async function fixture(extra = []) {
  const dir = await mkdtemp(join(tmpdir(), "mvf-import-"));
  const albums = [album("One", [1, 2]), album("Two", [1])];
  // Two unique binaries, three ordered references.
  await recover({
    dir,
    albums,
    interval: 0,
    retries: 0,
    fetcher: async (url) =>
      new Response(
        url.endsWith("2.jpg")
          ? Buffer.concat([image, Buffer.from("second")])
          : image,
      ),
  });
  const inventory = JSON.parse(
    await readFile(join(dir, "inventory.json"), "utf8"),
  );
  const plan = await makePlan([owner, ...extra], albums, inventory, dir);
  let docs = structuredClone(plan.before),
    serial = 0;
  const counts = { uploads: 0, commits: 0, probes: 0, saves: 0 };
  const api = {
    async export() {
      return structuredClone(docs);
    },
    async upload(bytes, p) {
      counts.uploads++;
      assert.equal(bytes.length, p.bytes);
      docs.push(
        doc(p.assetId, "sanity.imageAsset", {
          sha1hash: p.sha1,
          size: p.bytes,
          metadata: { dimensions: { width: p.width, height: p.height } },
        }),
      );
    },
    async mutate(mutations, dry) {
      if (dry) {
        counts.probes++;
        return;
      }
      counts.commits++;
      for (const m of mutations) {
        if (m.patch) {
          const d = docs.find((d) => d._id === m.patch.id);
          assert.equal(d._rev, m.patch.ifRevisionID);
          d._rev = `guard-${++serial}`;
        } else {
          assert.ok(m.create._id.startsWith("drafts."));
          assert.ok(!docs.some((d) => d._id === m.create._id));
          docs.push({
            ...structuredClone(m.create),
            _rev: `created-${++serial}`,
          });
        }
      }
    },
  };
  const state = initialState(plan),
    saved = [];
  const save = async (s) => {
    counts.saves++;
    saved.push(structuredClone(s));
  };
  const run = (phase, options = {}) =>
    runPhase({
      plan,
      state,
      api,
      save,
      dir,
      phase,
      interval: 0,
      sleep: async () => {},
      ...options,
    });
  const approval = (phase) => ({
    write: true,
    confirmation: `${phase === "upload" ? "PUBLIC-PHOTOS" : "UNPUBLISHED-DRAFTS"} ${target.projectId}/${target.dataset} ${plan.hash}`,
  });
  return {
    dir,
    albums,
    inventory,
    plan,
    state,
    api,
    counts,
    saved,
    run,
    approval,
    get docs() {
      return docs;
    },
    set docs(v) {
      docs = v;
    },
  };
}
test("default dry-run and per-phase exact approval prevent every API write", async () => {
  const f = await fixture();
  await f.run("upload");
  await f.run("create-drafts");
  await f.run("validate");
  await assert.rejects(
    f.run("upload", { write: true, confirmation: "yes" }),
    /approval/,
  );
  await assert.rejects(
    f.run("create-drafts", f.approval("upload")),
    /approval/,
  );
  assert.deepEqual(f.counts, { uploads: 0, commits: 0, probes: 0, saves: 0 });
});
test("ordered original references, preserved metadata, exact receipts and idempotent reruns", async () => {
  const existing = doc("old", "journalEntry", {
    title: "Two",
    sourceId: "legacy-album:Two",
    slug: { current: "edited" },
    storyPhotos: [
      { caption: "Original", crop: { top: 0.4 }, asset: { _ref: "original" } },
    ],
  });
  const f = await fixture([existing]);
  assert.equal(f.plan.drafts.length, 1);
  assert.deepEqual(
    f.plan.drafts[0].storyPhotos.map((p) => p.asset._ref),
    f.inventory.photos.map(
      (p) => f.plan.imports.find((i) => i.sha256 === p.sha256).assetId,
    ),
  );
  assert.equal(f.plan.drafts[0].publishedAt, undefined);
  assert.equal(f.plan.drafts[0].body, undefined);
  await f.run("upload", f.approval("upload"));
  await f.run("create-drafts", f.approval("create-drafts"));
  const commits = f.counts.commits;
  await f.run("upload", f.approval("upload"));
  await f.run("create-drafts", f.approval("create-drafts"));
  assert.equal(f.counts.uploads, 2);
  assert.equal(f.counts.commits, commits);
  assert.equal((await f.run("verify")).drafts, "complete");
  const after = f.docs.find((d) => d._id === existing._id);
  assert.deepEqual(after.storyPhotos, existing.storyPhotos);
  assert.equal(after.slug.current, "edited");
  assert.deepEqual(f.docs.find((d) => d._id === "owner").nested, owner.nested);
  assert.equal(f.state.receipts.length, 3);
  assert.ok(f.saved.some((s) => s.pending?.kind === "create-drafts"));
});
test("partial successful upload resumes from a persisted intent without duplicate POST", async () => {
  const f = await fixture();
  const upload = f.api.upload;
  f.api.upload = async (...args) => {
    await upload(...args);
    throw Error("connection lost after commit");
  };
  await assert.rejects(f.run("upload", f.approval("upload")), /reconcile/);
  assert.equal(f.saved.at(-1).pending.kind, "upload");
  Object.assign(f.state, structuredClone(f.saved.at(-1)));
  f.api.upload = upload;
  await f.run("upload", f.approval("upload"));
  assert.equal(f.counts.uploads, 2);
  assert.equal(f.state.pending, null);
});
test("unknown upload outcome absent from export never retries, including resume", async () => {
  const f = await fixture();
  let calls = 0;
  f.api.upload = async () => {
    calls++;
    throw Error("timeout");
  };
  await assert.rejects(f.run("upload", f.approval("upload")));
  await assert.rejects(
    f.run("upload", f.approval("upload")),
    /Unresolved upload/,
  );
  assert.equal(calls, 1);
});
test("rate rejection is bounded and checkpointed; permission rejection cannot loop", async () => {
  const f = await fixture();
  const upload = f.api.upload;
  let calls = 0;
  f.api.upload = async (...a) => {
    if (++calls === 1) throw Object.assign(Error("rate"), { status: 429 });
    return upload(...a);
  };
  await f.run("upload", f.approval("upload"));
  assert.equal(calls, 3);
  const g = await fixture();
  let denied = 0;
  g.api.upload = async () => {
    denied++;
    throw Object.assign(Error("private token must never escape"), {
      status: 403,
    });
  };
  await assert.rejects(
    g.run("upload", g.approval("upload")),
    /Permission rejected/,
  );
  assert.equal(denied, 1);
  assert.equal(g.state.pending, null);
  const h = await fixture();
  let rateCalls = 0;
  h.api.upload = async () => {
    rateCalls++;
    throw Object.assign(Error(), { status: 429 });
  };
  await assert.rejects(
    h.run("upload", { ...h.approval("upload"), retries: 2 }),
  );
  assert.equal(rateCalls, 3);
});
test("dataset revisions, owner changes and unexpected documents stop before writes", async () => {
  for (const change of [
    (f) => {
      f.docs[0]._rev = "new";
    },
    (f) => {
      f.docs[0].title = "edited";
    },
    (f) => {
      f.docs.push(doc("new", "journalEntry"));
    },
  ]) {
    const f = await fixture();
    change(f);
    await assert.rejects(f.run("upload", f.approval("upload")), /drift/);
    assert.equal(f.counts.uploads, 0);
    assert.equal(f.counts.probes, 0);
  }
});
test("permission dry-run failure, draft preconditions and drift during probe prevent writes", async () => {
  const f = await fixture();
  f.api.mutate = async () => {
    throw Error("permission denied");
  };
  await assert.rejects(f.run("upload", f.approval("upload")));
  assert.equal(f.counts.uploads, 0);
  const g = await fixture();
  await assert.rejects(
    g.run("create-drafts", g.approval("create-drafts")),
    /incomplete/,
  );
  const h = await fixture();
  h.api.mutate = async () => {
    h.docs[0]._rev = "owner-edit";
  };
  await assert.rejects(h.run("upload", h.approval("upload")), /drift/);
  assert.equal(h.counts.uploads, 0);
});
test("ambiguous draft success is adopted once, exact owner-content change blocks reconciliation", async () => {
  const f = await fixture();
  await f.run("upload", f.approval("upload"));
  const mutate = f.api.mutate;
  f.api.mutate = async (ms, dry) => {
    await mutate(ms, dry);
    if (!dry) throw Error("lost response");
  };
  await assert.rejects(f.run("create-drafts", f.approval("create-drafts")));
  await f.run("verify");
  assert.equal(f.counts.commits, 1);
  const g = await fixture();
  await g.run("upload", g.approval("upload"));
  g.api.mutate = async (_ms, dry) => {
    if (!dry) throw Error("unknown");
  };
  await assert.rejects(g.run("create-drafts", g.approval("create-drafts")));
  await assert.rejects(
    g.run("create-drafts", g.approval("create-drafts")),
    /Unresolved draft/,
  );
  assert.equal(g.state.pending.kind, "create-drafts");
  f.state.pending = { kind: "create-drafts" };
  f.docs[0].title = "changed";
  await assert.rejects(f.run("verify"), /Unresolved draft/);
});
test("inventory, hashes, association drift, incomplete files, plan tampering and collisions fail closed", async () => {
  const f = await fixture();
  const bad = structuredClone(f.inventory);
  bad.photos[0].associations[0].order = 30;
  await assert.rejects(makePlan([owner], f.albums, bad, f.dir), /association/);
  bad.photos[0].status = "failed";
  await assert.rejects(makePlan([owner], f.albums, bad, f.dir), /incomplete/);
  const plan = structuredClone(f.plan);
  plan.drafts[0].title = "tampered";
  await assert.rejects(
    validateFiles(plan, f.inventory, f.albums, f.dir),
    /integrity/,
  );
  await writeFile(join(f.dir, f.inventory.photos[0].local), "corrupt");
  await assert.rejects(validateFiles(f.plan, f.inventory, f.albums, f.dir));
  await assert.rejects(
    fixture([
      doc("a", "journalEntry", { slug: { current: "one" } }),
      doc("b", "journalEntry", { slug: { current: "one" } }),
    ]),
    /Duplicate/,
  );
  await assert.rejects(
    fixture([
      doc("a", "journalEntry", { title: "One" }),
      doc("b", "journalEntry", { sourceId: "legacy-album:One" }),
    ]),
    /Ambiguous/,
  );
});
test("existing assets require exact SHA1, dimensions, size and ID, and are reused without POST", async () => {
  const f = await fixture();
  await f.run("upload", f.approval("upload"));
  const reused = await makePlan(f.docs, f.albums, f.inventory, f.dir);
  assert.ok(reused.imports.every((p) => p.action === "reuse-existing-asset"));
  const state = initialState(reused);
  await runPhase({
    plan: reused,
    state,
    dir: f.dir,
    api: { ...f.api, upload: () => assert.fail("duplicate") },
    save: async () => {},
    phase: "upload",
    write: true,
    confirmation: `PUBLIC-PHOTOS ${target.projectId}/${target.dataset} ${reused.hash}`,
  });
  f.docs.find((d) => d._type === "sanity.imageAsset").size++;
  await assert.rejects(
    makePlan(f.docs, f.albums, f.inventory, f.dir),
    /identity/,
  );
});

test("known retained ID-repair copies preserve every owner field without hiding unrelated collisions", async () => {
  const f = await fixture();
  const source = "journal.event.diwali-celebrations-2025";
  const title = "Diwali Celebrations (Oct 16 2025)";
  const sources = [source, source.replace(/^journal\./, "")];
  const copies = sources.flatMap((identity, index) =>
    [identity, `mvf-${Buffer.from(identity).toString("base64url")}`].map(
      (id, copy) =>
        doc(id, index ? "event" : "journalEntry", {
          sourceId: identity,
          slug: { current: index ? "diwali-event" : "diwali-update" },
          title: `Owner rename ${copy}`,
          caption: `Distinct owner edit ${copy}`,
        }),
    ),
  );
  const albums = [album(title, [1, 2]), f.albums[1]];
  const inventory = structuredClone(f.inventory);
  for (const row of inventory.photos)
    row.associations = recoveryInventory(albums).find(
      (p) => p.source === row.source,
    ).associations;
  const before = [owner, ...copies];
  const plan = await makePlan(before, albums, inventory, f.dir);
  assert.equal(plan.drafts.length, 1);
  assert.equal(plan.preservedAlbums.length, 1);
  assert.equal(plan.preservedAlbums[0].matches.length, 4);
  assert.equal(plan.retainedIdentityGroups.length, 2);
  assert.deepEqual(
    plan.before,
    [...before].sort((a, b) => a._id.localeCompare(b._id)),
  );
  const noWrites = {
    export: async () => structuredClone(plan.before),
    upload: () => assert.fail("dry run uploaded"),
    mutate: () => assert.fail("dry run mutated"),
  };
  await runPhase({
    plan,
    state: initialState(plan),
    api: noWrites,
    dir: f.dir,
    phase: "validate",
    save: async () => assert.fail("unchanged validation saved"),
  });
  await assert.rejects(
    makePlan(
      [
        ...before,
        doc("unrelated", "journalEntry", {
          sourceId: source,
          slug: { current: "different" },
        }),
      ],
      albums,
      inventory,
      f.dir,
    ),
    /Duplicate/,
  );
  const wrong = structuredClone(before);
  wrong.find((d) => d._id === source).sourceId = "owner-different-identity";
  await assert.rejects(
    makePlan(wrong, albums, inventory, f.dir),
    /Duplicate|Ambiguous/,
  );
});
test("HTTP adapter targets only pinned dataset, never retries writes or logs credentials", async () => {
  const calls = [];
  const api = sanityAPI("secret", async (url, init) => {
    calls.push({ url, init });
    return new Response("{}");
  });
  await api.mutate([{ create: { _id: "drafts.test" } }], true);
  assert.match(calls[0].url, /6jpdhhxg.*production\?dryRun=true/);
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
  const denied = sanityAPI(
    "secret",
    async () => new Response("secret", { status: 403 }),
  );
  await assert.rejects(
    denied.upload(image, { sha256: "x", format: "jpeg" }),
    (e) => e.status === 403 && !e.message.includes("secret"),
  );
  const unknown = sanityAPI("secret", async () => {
    throw Error("secret");
  });
  await assert.rejects(unknown.export(), (e) => !e.message.includes("secret"));
});
test("CLI rejects unknown flags, write on read-only modes, missing phase and public run paths", () => {
  const args = [
    "--backup",
    "/private/backup",
    "--photos",
    "/private/photos",
    "--run",
    ".tmp/test",
  ];
  assert.equal(parseArgs(["upload", ...args]).write, false);
  for (const a of [
    ["plan", ...args, "--write"],
    ["resume", ...args],
    ["upload", ...args, "--project", "other"],
    ["plan", ...args, "--run", "public"],
  ])
    assert.throws(() => parseArgs(a));
});
test("real CLI orchestration persists chained checkpoints, separate cleanup and before/after receipts", async () => {
  const photos = await mkdtemp(join(tmpdir(), "mvf-cli-photos-"));
  const albums = JSON.parse(
    await readFile("docs/legacy-snapshot/gallery-index.json", "utf8"),
  );
  await recover({
    dir: photos,
    albums,
    concurrency: 2,
    interval: 0,
    retries: 0,
    fetcher: async () => new Response(image),
  });
  await mkdir(".tmp", { recursive: true });
  const run = await mkdtemp(join(".tmp", "historical-cli-"));
  let docs = [structuredClone(owner)],
    posts = 0;
  const options = {
    loadBackup: async () => ({ docs: [owner] }),
    output: () => {},
    apiFactory: () => ({
      export: async () => structuredClone(docs),
      upload: async (_bytes, p) => {
        posts++;
        docs.push(
          doc(p.assetId, "sanity.imageAsset", {
            sha1hash: p.sha1,
            size: p.bytes,
            metadata: { dimensions: { width: p.width, height: p.height } },
          }),
        );
        return { requestId: "upload-request" };
      },
      mutate: async (ms, dry) => {
        if (!dry) {
          posts++;
          docs = docs.map((d) =>
            d._type.startsWith("sanity.") ? d : { ...d, _rev: "guarded" },
          );
          docs.push(
            ...ms
              .filter((m) => m.create)
              .map((m) => ({ ...m.create, _rev: "created" })),
          );
        }
        return { transactionId: "transaction", requestId: "mutation-request" };
      },
    }),
  };
  const args = [
    "--backup",
    "/private/verified",
    "--photos",
    photos,
    "--run",
    run,
  ];
  await runCLI(["plan", ...args], options);
  assert.equal(posts, 0);
  const plan = JSON.parse(await readFile(join(run, "plan.json"), "utf8"));
  assert.equal(
    JSON.parse(await readFile(join(run, "cleanup-proposal.json"), "utf8"))
      .candidates.length,
    2,
  );
  await runCLI(["validate", ...args], options);
  await runCLI(["upload", ...args], options);
  assert.equal(posts, 0);
  await runCLI(
    [
      "upload",
      ...args,
      "--write",
      "--confirm",
      `PUBLIC-PHOTOS 6jpdhhxg/production ${plan.hash}`,
    ],
    options,
  );
  await runCLI(
    [
      "resume",
      ...args,
      "--phase",
      "create-drafts",
      "--write",
      "--confirm",
      `UNPUBLISHED-DRAFTS 6jpdhhxg/production ${plan.hash}`,
    ],
    options,
  );
  await runCLI(["verify", ...args], options);
  assert.equal(posts, 2);
  const files = await readdir(run);
  const checkpoints = files.filter((n) => n.startsWith("checkpoint-")).sort();
  const last = JSON.parse(
    await readFile(join(run, checkpoints.at(-1)), "utf8"),
  );
  assert.equal(last.state.drafts, "complete");
  assert.equal(last.state.receipts.at(-1).transactionId, "transaction");
  assert.equal(
    last.hash,
    digest({ previousHash: last.previousHash, state: last.state }),
  );
  const receipts = await Promise.all(
    files
      .filter((n) => n.startsWith("receipt-"))
      .map((n) => readFile(join(run, n), "utf8").then(JSON.parse)),
  );
  assert.ok(
    receipts.some(
      (r) =>
        r.mode === "verify" && r.before.length === 1 && r.after.length === 16,
    ),
  );
  assert.ok(!files.includes("active.lock"));
  const { rename } = await import("node:fs/promises");
  const first = join(run, checkpoints[0]);
  await rename(first, first + ".held");
  await assert.rejects(
    runCLI(["verify", ...args], options),
    /Checkpoint sequence incomplete/,
  );
  assert.equal(posts, 2);
  await rename(first + ".held", first);
  const latestFile = join(run, checkpoints.at(-1));
  const corrupted = JSON.parse(await readFile(latestFile, "utf8"));
  corrupted.hash = "invalid-checkpoint-hash";
  await writeFile(latestFile, JSON.stringify(corrupted));
  await assert.rejects(
    runCLI(["verify", ...args], options),
    /Checkpoint chain integrity/,
  );
  assert.equal(posts, 2);
  await writeFile(join(run, "active.lock"), "operator lock");
  await assert.rejects(runCLI(["verify", ...args], options), {
    code: "EEXIST",
  });
});

test("backed-up reusable originals must have the same SHA256 and byte count", async () => {
  const f = await fixture();
  await f.run("upload", f.approval("upload"));
  const plan = await makePlan(f.docs, f.albums, f.inventory, f.dir);
  assert.throws(() => verifyReuse(plan, { assets: [] }), /verified backup/);
  const assets = plan.imports.map((p) => ({
    id: p.assetId,
    sha256: p.sha256,
    bytes: p.bytes,
  }));
  verifyReuse(plan, { assets });
  assets[0].sha256 = "0".repeat(64);
  assert.throws(() => verifyReuse(plan, { assets }), /verified backup/);
});

test("intent persistence failure prevents upload; revision guard rejects an edit racing the transaction", async () => {
  const f = await fixture();
  await assert.rejects(
    f.run("upload", {
      ...f.approval("upload"),
      save: async () => {
        throw Error("disk full");
      },
    }),
    /disk full/,
  );
  assert.equal(f.counts.uploads, 0);
  const g = await fixture();
  await g.run("upload", g.approval("upload"));
  g.api.mutate = async (ms, dry) => {
    if (dry) return;
    assert.ok(
      ms.some(
        (m) => m.patch?.id === "owner" && m.patch.ifRevisionID === owner._rev,
      ),
    );
    g.docs[0]._rev = "racing-edit";
    throw Object.assign(Error("revision conflict"), { status: 409 });
  };
  await assert.rejects(
    g.run("create-drafts", g.approval("create-drafts")),
    /drift/,
  );
  assert.equal(g.docs.filter((d) => d._id.startsWith("drafts.")).length, 0);
  assert.equal(g.state.pending.kind, "create-drafts");
});

test("a completed draft phase performs no further server permission probe or commit", async () => {
  const f = await fixture();
  await f.run("upload", f.approval("upload"));
  await f.run("create-drafts", f.approval("create-drafts"));
  f.api.mutate = async () => {
    assert.fail("completed draft creates must not even be dry-run submitted");
  };
  await f.run("create-drafts", f.approval("create-drafts"));
});

test("HTTP 5xx upload outcome is held pending, and wrong-type asset ID collisions fail during planning", async () => {
  const f = await fixture();
  let calls = 0;
  f.api.upload = async () => {
    calls++;
    throw Object.assign(Error("server failure"), { status: 503 });
  };
  await assert.rejects(f.run("upload", f.approval("upload")), /reconcile/);
  await assert.rejects(
    f.run("upload", f.approval("upload")),
    /Unresolved upload/,
  );
  assert.equal(calls, 1);
  const collision = doc(f.plan.imports[0].assetId, "mediaItem");
  await assert.rejects(
    makePlan([owner, collision], f.albums, f.inventory, f.dir),
    /Asset ID collision/,
  );
});

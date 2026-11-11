import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  recover,
  inspect,
  sourceURL,
  inventory,
} from "../scripts/recover-photos.mjs";
import {
  photoPlan,
  verifiedPhotoPlan,
  suspectedIds,
} from "../scripts/photo-import-plan.mjs";
const image = Buffer.from(
  "ffd8ffc00011080002000303012200021100031100ffd9",
  "hex",
);
const album = (title, photos) => ({
  title,
  photos: photos.map((p) => `../assets/a/${p}.jpg`),
  videos: [],
  malformed: [],
});
const albums = [album("One (Jan 1 2020)", ["1", "2"]), album("Two", ["1"])];
const fixture = async () => ({
  dir: await mkdtemp(join(tmpdir(), "mvf-photos-")),
  albums,
  interval: 0,
  retries: 0,
  concurrency: 2,
});
const load = async (dir) =>
  JSON.parse(await readFile(join(dir, "inventory.json"), "utf8"));
const docs = [{ _id: "owner", _rev: "rev", _type: "siteSettings" }];
test("origin allowlist and image validation fail closed", () => {
  for (const s of [
    "https://evil.example/assets/a.jpg",
    "http://www.musicalvibesfoundation.com/assets/a.jpg",
    "https://www.musicalvibesfoundation.com/assets/a.jpg?redirect=1",
    "../assets/../outside.jpg",
  ])
    assert.throws(() => sourceURL(s));
  assert.throws(() => inspect(Buffer.from("<html>")));
  assert.throws(() => inspect(image.subarray(0, -2)));
  assert.equal(inspect(image).width, 3);
  assert.equal(inventory(albums).length, 2);
});
test("deduplicates binaries while retaining album order and resumes without network", async () => {
  const options = await fixture();
  let calls = 0;
  const report = await recover({
    ...options,
    fetcher: async () => {
      calls++;
      return new Response(image);
    },
  });
  assert.equal(calls, 2);
  assert.equal(report.duplicates, 1);
  assert.equal(report.uniqueBinaries, 1);
  const state = await load(options.dir);
  assert.equal(state.photos[0].associations.length, 2);
  assert.deepEqual(
    state.photos[0].associations.map((a) => a.order),
    [0, 0],
  );
  await recover({
    ...options,
    fetcher: () => {
      throw Error("unexpected network");
    },
  });
  assert.equal((await load(options.dir)).photos[0].reused, "resume");
  await writeFile(join(options.dir, state.photos[0].local), "broken");
  let repairs = 0;
  await recover({
    ...options,
    fetcher: async () => {
      repairs++;
      return new Response(image);
    },
  });
  assert.ok(repairs > 0);
  assert.equal(
    inspect(await readFile(join(options.dir, state.photos[0].local))).sha256,
    state.photos[0].sha256,
  );
});
test("records missing and invalid downloads; retries transient failures and resumes failures", async () => {
  const options = await fixture();
  let calls = 0;
  const report = await recover({
    ...options,
    retries: 1,
    fetcher: async (url) => {
      if (url.endsWith("2.jpg")) return new Response("", { status: 404 });
      calls++;
      return calls === 1
        ? new Response("", { status: 503 })
        : new Response(image);
    },
  });
  assert.equal(report.missing, 1);
  assert.equal(report.successful, 1);
  assert.equal(calls, 2);
  const next = await recover({
    ...options,
    fetcher: async () => new Response("not an image"),
  });
  assert.equal(next.failed, 1);
  const final = await recover({
    ...options,
    fetcher: async () => new Response(image),
  });
  assert.equal(final.successful, 2);
});
test("safe proposal reuses SHA1 assets and refuses association drift and corrupt binaries", async () => {
  const options = await fixture();
  await recover({ ...options, fetcher: async () => new Response(image) });
  const state = await load(options.dir);
  const hash = inspect(image);
  const records = [
    ...docs,
    {
      _id: `image-${hash.sha1}-3x2-jpg`,
      _rev: "a",
      _type: "sanity.imageAsset",
      sha1hash: hash.sha1,
    },
  ];
  const before = JSON.stringify(records);
  const plan = await verifiedPhotoPlan(records, albums, state, options.dir);
  assert.equal(plan.imports.length, 1);
  assert.equal(plan.imports[0].action, "reuse-existing-asset");
  assert.equal(plan.albumProposals[0].photos.length, 2);
  assert.deepEqual(plan.albumProposals[0].createDraft.storyPhotos, []);
  assert.equal(plan.albumProposals[0].createDraft.publishedAt, undefined);
  assert.equal(JSON.stringify(records), before);
  const broken = structuredClone(state);
  broken.photos[0].associations = [];
  assert.throws(() => photoPlan(records, albums, broken));
  await writeFile(join(options.dir, state.photos[0].local), "corrupt");
  await assert.rejects(() =>
    verifiedPhotoPlan(records, albums, state, options.dir),
  );
});
test("exact test IDs include drafts, image references and inbound paths; historical matches preserve owner content", () => {
  const a = album("Diwali Celebrations (Oct 16 2025)", []);
  const records = [
    ...docs,
    {
      _id: "old",
      _rev: "r",
      _type: "journalEntry",
      sourceId: "journal.event.diwali-celebrations-2025",
    },
    {
      _id: suspectedIds[0],
      _rev: "t",
      _type: "journalEntry",
      storyPhotos: [{ asset: { _ref: "image-a" } }],
    },
    { _id: `drafts.${suspectedIds[0]}`, _rev: "d", _type: "journalEntry" },
    { _id: "image-a", _rev: "a", _type: "sanity.imageAsset" },
    {
      _id: "link",
      _rev: "l",
      _type: "unknown",
      nested: { _ref: suspectedIds[0], _weak: true },
    },
  ];
  const plan = photoPlan(records, [a], { format: 1, photos: [] });
  assert.equal(plan.albumProposals[0].createDraft, undefined);
  assert.equal(plan.cleanup[0].variants.length, 2);
  assert.equal(plan.cleanup[0].variants[0].associatedPhotos.length, 1);
  assert.equal(plan.cleanup[0].variants[0].inbound[0].id, "link");
  assert.equal(plan.cleanup[0].blocked, true);
});
test("bounds concurrency, disables redirects and times out stalled requests", async () => {
  const options = await fixture();
  let active = 0,
    max = 0;
  const report = await recover({
    ...options,
    timeout: 20,
    fetcher: async (url, init) => {
      assert.equal(init.redirect, "error");
      active++;
      max = Math.max(max, active);
      try {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 100);
          init.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(Error("timeout"));
            },
            { once: true },
          );
        });
        return new Response(image);
      } finally {
        active--;
      }
    },
  });
  assert.equal(report.failed, 2);
  assert.ok(max <= 2);
});
test("reuses verified samples offline and refuses tampered metadata", async () => {
  const options = await fixture();
  const { mkdir } = await import("node:fs/promises");
  await mkdir(join(options.dir, "public/assets/legacy"), { recursive: true });
  await writeFile(join(options.dir, "public/assets/legacy/sample.jpg"), image);
  const sample = {
    source: inventory(albums)[0].source,
    local: "public/assets/legacy/sample.jpg",
    ...inspect(image),
  };
  const report = await recover({
    ...options,
    root: options.dir,
    samples: [sample],
    offline: true,
  });
  assert.equal(report.successful, 1);
  assert.equal(report.uncollected, 1);
  const other = await fixture();
  const bad = await recover({
    ...other,
    root: options.dir,
    samples: [{ ...sample, sha256: "0".repeat(64) }],
    offline: true,
  });
  assert.equal(bad.successful, 0);
  assert.match((await load(other.dir)).photos[0].sampleError, /integrity/);
});
test("refuses a shared recovery directory lock and resumes a partial checkpoint", async () => {
  const options = await fixture();
  await writeFile(join(options.dir, "recovery.lock"), "active operator");
  await assert.rejects(() => recover({ ...options, offline: true }), {
    code: "EEXIST",
  });
  const { rename } = await import("node:fs/promises");
  await rename(
    join(options.dir, "recovery.lock"),
    join(options.dir, "archived.lock"),
  );
  await recover({ ...options, offline: true });
  const state = await load(options.dir);
  assert.equal(
    state.photos.filter((p) => p.status === "uncollected").length,
    2,
  );
  const report = await recover({
    ...options,
    fetcher: async () => new Response(image),
  });
  assert.equal(report.successful, 2);
});
test("cleanup follows Media Library references without looping or crossing datasets", () => {
  const records = [
    ...docs,
    {
      _id: suspectedIds[0],
      _rev: "r",
      _type: "journalEntry",
      photos: [{ _ref: "media" }],
    },
    {
      _id: "media",
      _rev: "m",
      _type: "mediaItem",
      image: { asset: { _ref: "image-a" } },
      cycle: { _ref: suspectedIds[0] },
      external: { _ref: "elsewhere", _dataset: "other" },
    },
    { _id: "image-a", _rev: "a", _type: "sanity.imageAsset" },
  ];
  const report = photoPlan(records, [], { format: 1, photos: [] });
  assert.equal(report.cleanup[0].variants[0].associatedPhotos.length, 1);
  assert.equal(
    report.cleanup[0].variants[0].associatedPhotos[0].sourceDocument,
    "media",
  );
});
test("preserved source index accounts for all 14 albums, 307 paths and 41 samples", async () => {
  const source = JSON.parse(
    await readFile("docs/legacy-snapshot/gallery-index.json", "utf8"),
  );
  const samples = JSON.parse(
    await readFile("docs/legacy-snapshot/gallery-manifest.json", "utf8"),
  );
  const paths = inventory(source);
  assert.equal(source.length, 14);
  assert.equal(paths.length, 307);
  assert.equal(samples.length, 41);
  for (const sample of samples)
    assert.ok(paths.some((p) => p.source === sourceURL(sample.source)));
});

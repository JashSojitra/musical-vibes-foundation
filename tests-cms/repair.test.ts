import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  loadBackup,
  migrationRepairPlan,
  assetBackupRequest,
  repairFetch,
} from "../scripts/sanity-repair";
import {
  target,
  hash,
  stable,
  authored,
  publicDocs,
  references,
  planRepair,
  stateOf,
  assertFresh,
  executeRepair,
  type Doc,
} from "../scripts/sanity-repair-plan";
import { publicContentId } from "../scripts/sanity-public-ids";
import { mapSanity } from "../src/lib/sanity-model";
import { content } from "../src/data/content";
import { deriveGalleryCollections } from "../src/lib/journal";

const ref = (id: string, extra = {}) => ({
  _type: "reference",
  _ref: id,
  ...extra,
});
const doc = (_id: string, _type: string, extra = {}): Doc => ({
  _id,
  _type,
  _rev: `rev-${_id}`,
  _createdAt: "2025-01-01T00:00:00Z",
  _updatedAt: "2026-11-04T00:00:00Z",
  ...extra,
});
function fixture(): Doc[] {
  return [
    doc("siteSettings", "siteSettings", {
      ...content.settings,
      featuredPrograms: [ref("program.one", { _key: "one" })],
      featuredEvents: [ref("event.one")],
    }),
    doc("drafts.siteSettings", "siteSettings", {
      ...content.settings,
      mission: "Owner's unpublished mission",
      featuredPrograms: [ref("program.one")],
    }),
    ...content.programs.map((p, i) =>
      doc(i ? p.id : "program.one", "program", {
        ...p,
        slug: { current: p.slug },
        sourceId: p.id,
        ownerField: { custom: ["keep", { text: "program.one" }] },
        image: ref("media.one"),
      }),
    ),
    doc("drafts.program.one", "program", {
      title: "Owner's unpublished program",
      slug: { current: "owner-new-slug" },
      previousSlugs: [content.programs[0].slug],
      sourceId: content.programs[0].id,
      image: ref("media.one"),
    }),
    doc("event.one", "event", {
      title: "Edited event",
      slug: { current: "edited-event" },
      date: "2025-10-01",
      gallery: [ref("media.one", { _key: "photo" })],
    }),
    doc("journal.one", "journalEntry", {
      title: "Owner-edited article",
      slug: { current: "edited-journal" },
      previousSlugs: ["old-story"],
      publishedAt: "2026-11-03",
      kind: "event",
      event: ref("event.one"),
      programs: [ref("program.one")],
      photos: [ref("media.one")],
      body: [
        {
          _key: "block",
          markDefs: [
            {
              _key: "link",
              nested: { link: ref("event.one", { _weak: true }) },
            },
          ],
        },
      ],
    }),
    doc("drafts.journal.one", "journalEntry", {
      title: "Not published",
      slug: { current: "draft-story" },
      sourceId: "journal.one",
      event: ref("event.one"),
    }),
    doc("drafts.program.only", "program", {
      title: "Draft-only",
      slug: { current: "draft-only" },
    }),
    doc("media.one", "mediaItem", {
      sourceId: "song",
      editorialApproval: "pending",
      publicationEnabled: false,
      consent: "unconfirmed",
      alt: "Keep this alt",
      image: {
        _type: "image",
        asset: ref("image-abc-800x600-webp"),
        crop: { top: 0.1 },
        hotspot: { x: 0.7, y: 0.3 },
      },
    }),
    doc("image-abc-800x600-webp", "sanity.imageAsset", {
      url: "https://cdn.sanity.io/images/6jpdhhxg/production/abc-800x600.webp",
      sha1hash: "abc",
    }),
    doc("faq.001", "faq", {
      question: "Owner question",
      answer: "Owner answer",
    }),
    doc("new-root", "unknownOwnerType", {
      nested: [{ reference: ref("journal.one") }],
      external: ref("program.one", {
        _dataset: "another",
        _projectId: "another",
      }),
    }),
  ];
}
const apply = (plan: ReturnType<typeof planRepair>) =>
  plan.expected.map((d) => ({ ...d, _rev: `new-${d._rev}` }));

test("repair uses current owner edits, remaps every nested reference and preserves pub/draft pairs and assets", () => {
  const input = fixture();
  const unchanged = stable(input);
  const plan = planRepair(input);
  assert.equal(stable(input), unchanged);
  assert.equal(plan.expectedPublicCounts.program, 6);
  assert.equal(plan.expectedPublicCounts.event, 1);
  assert.equal(plan.expectedPublicCounts.journalEntry, 1);
  const story = plan.active.find(
    (d) => d._id === publicContentId("journal.one"),
  )!;
  assert.equal(story.title, "Owner-edited article");
  assert.deepEqual(story.slug, { current: "edited-journal" });
  assert.deepEqual(story.previousSlugs, ["old-story"]);
  assert.equal(story.sourceId, "journal.one");
  assert.ok(references(story).every((r) => !r.ref.includes(".")));
  assert.equal(
    plan.active.find(
      (d) => d._id === `drafts.${publicContentId("program.one")}`,
    )?.title,
    "Owner's unpublished program",
  );
  assert.equal(
    plan.active.find(
      (d) => d._id === `drafts.${publicContentId("program.only")}`,
    )?.title,
    "Draft-only",
  );
  assert.ok(
    !plan.active.some((d) => d._id === publicContentId("program.only")),
  );
  const media = plan.active.find((d) => d._type === "mediaItem")!;
  assert.deepEqual(
    media.image,
    input.find((d) => d._type === "mediaItem")!.image,
  );
  assert.equal(media.editorialApproval, "pending");
  assert.equal(media.publicationEnabled, false);
  assert.equal(media.consent, "unconfirmed");
  assert.equal(media.sourceId, "song");
  assert.deepEqual(
    plan.active.find((d) => d._id === "new-root")?.external,
    ref("program.one", { _dataset: "another", _projectId: "another" }),
  );
  assert.ok(plan.mutations.every((m) => !m.patch?.id.startsWith("image-")));
  assert.ok(
    plan.mutations.every((m) =>
      Object.keys(m).every((k) => ["create", "patch"].includes(k)),
    ),
  );
  for (const id of plan.cleanupCandidates)
    assert.deepEqual(
      authored(plan.expected.find((d) => d._id === id)!),
      authored(input.find((d) => d._id === id)!),
    );
  const mapped = mapSanity(
    publicDocs(plan.active),
    target.projectId,
    target.dataset,
  );
  assert.equal(mapped.source.programs.length, 6);
  assert.equal(mapped.source.events.length, 1);
  assert.equal(mapped.entries.length, 1);
  assert.equal(
    mapped.source.media.length,
    0,
    "Pending images stay withheld; intended safe fallback remains",
  );
});

test("six legacy Programs become six anonymous Programs without republishing drafts", () => {
  const input = fixture(),
    plan = planRepair(input);
  assert.equal(
    publicDocs(input).filter((d) => d._type === "program").length,
    0,
  );
  assert.equal(
    publicDocs(apply(plan)).filter((d) => d._type === "program").length,
    6,
  );
  assert.equal(stateOf(plan, input), "before");
  assert.equal(stateOf(plan, apply(plan)), "after");
  const active = planRepair(plan.active);
  assert.equal(active.changes.length, 0);
  assert.equal(active.mutations.length, 0);
});

test("operator CLI exposes only historical migration IDs, never unrelated owner private paths", () => {
  const programs = content.programs.map((p) =>
    doc(p.id, "program", {
      title: "Current Studio edit",
      slug: { current: p.slug },
    }),
  );
  const plan = migrationRepairPlan(programs);
  assert.equal(plan.expectedPublicCounts.program, 6);
  assert.ok(plan.active.every((d) => d.title === "Current Studio edit"));
  assert.throws(
    () =>
      migrationRepairPlan([...programs, doc("owner.private-note", "program")]),
    /outside the historical/,
  );
  assert.throws(
    () => migrationRepairPlan([doc(content.programs[0].id, "event")]),
    /outside the historical/,
  );
});

test("authenticated exports preserve reserved ACL/schema/retention documents without touching permissions", () => {
  const system = [
    doc("_.groups.write", "system.group", {
      grants: [
        { filter: '_id in path("**")', permissions: ["read", "update"] },
      ],
      members: ["owner"],
    }),
    doc("_.schemas.musical-vibes", "system.schema", {
      schema: { example: { _ref: "program.one" } },
    }),
    doc("_.retention._maximum_project", "system.retention", { days: 90 }),
  ];
  const input = [...fixture(), ...system];
  const plan = planRepair(input);
  for (const d of system) {
    assert.deepEqual(
      plan.active.find((a) => a._id === d._id),
      d,
    );
    assert.deepEqual(
      plan.expected.find((a) => a._id === d._id),
      d,
    );
  }
  assert.ok(
    plan.mutations.every(
      (m) =>
        !m.patch?.id.startsWith("_.") &&
        !(typeof m.create?._id === "string" && m.create._id.startsWith("_.")),
    ),
  );
  const originals = content.programs.map((p) =>
    doc(p.id, "program", { slug: { current: p.slug } }),
  );
  assert.equal(
    migrationRepairPlan([...originals, ...system]).expectedPublicCounts.program,
    6,
  );
  assert.throws(
    () => migrationRepairPlan([...originals, doc("_.owner.secret", "program")]),
    /outside the historical/,
  );
  assert.throws(
    () =>
      stateOf(
        plan,
        apply(plan).map((d) =>
          d._id === system[0]._id ? { ...d, members: [] } : d,
        ),
      ),
    /drift/,
  );
});

test("backup requests authenticated raw original images, keeps hash checks and confines credentials to the exact CDN project", () => {
  const image = doc("image-test", "sanity.imageAsset", {
    url: "https://cdn.sanity.io/images/6jpdhhxg/production/hash-800x600.jpg",
  });
  const request = assetBackupRequest(image, "test-credential");
  assert.equal(request.url.searchParams.has("dlRaw"), true);
  assert.equal(request.url.searchParams.has("dl"), false);
  assert.equal(request.options.redirect, "error");
  assert.equal(
    new Headers(request.options.headers).get("authorization"),
    "Bearer test-credential",
  );
  const file = assetBackupRequest(
    doc("file-test", "sanity.fileAsset", {
      url: "https://cdn.sanity.io/files/6jpdhhxg/production/hash.pdf",
    }),
    "test-credential",
  );
  assert.equal(new Headers(file.options.headers).has("authorization"), false);
  for (const url of [
    "https://other.example/images/6jpdhhxg/production/hash.jpg",
    "https://cdn.sanity.io/images/other/production/hash.jpg",
    "https://cdn.sanity.io/images/6jpdhhxg/other/hash.jpg",
    "http://cdn.sanity.io/images/6jpdhhxg/production/hash.jpg",
    image.url + "?w=100",
    "https://user:password@cdn.sanity.io/images/6jpdhhxg/production/hash.jpg",
    image.url + "#fragment",
  ])
    assert.throws(
      () => assetBackupRequest({ ...image, url }, "test-credential"),
      /Unexpected asset/,
    );
});

test("fetch failures identify the exact request and underlying EACCES without logging credential headers", async () => {
  const url =
    "https://6jpdhhxg.api.sanity.io/v2026-11-01/data/export/production";
  const denied = async () => {
    throw new TypeError("fetch failed", {
      cause: Object.assign(new Error("connect"), { code: "EACCES" }),
    });
  };
  await assert.rejects(
    repairFetch(
      url,
      { headers: { Authorization: "Bearer must-not-appear" } },
      denied,
    ),
    (error) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes(url));
      assert.match(error.message, /GET.*EACCES.*network access denied/);
      assert.ok(!error.message.includes("must-not-appear"));
      return true;
    },
  );
});

test("approved Journal/Gallery relationships and logical collection identities survive storage-ID repair", () => {
  const input = fixture().map((d) =>
    d._type === "mediaItem"
      ? { ...d, editorialApproval: "approved", publicationEnabled: true }
      : d,
  );
  const before = mapSanity(input, target.projectId, target.dataset);
  const after = mapSanity(
    publicDocs(planRepair(input).active),
    target.projectId,
    target.dataset,
  );
  assert.deepEqual(
    deriveGalleryCollections(after.entries, after.source.media),
    deriveGalleryCollections(before.entries, before.source.media),
  );
  assert.equal(
    deriveGalleryCollections(after.entries, after.source.media).length,
    1,
  );
  assert.deepEqual(after.source.home, before.source.home);
  assert.deepEqual(
    [...after.source.programs].sort((a, b) => a.id.localeCompare(b.id)),
    [...before.source.programs].sort((a, b) => a.id.localeCompare(b.id)),
  );
});

test("backup requires the correct target, complete raw documents and original verified asset bytes", async () => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/repair-backup-test-"));
  const bytes = Buffer.from("original asset binary");
  const docs = [
    doc("image-abc-800x600-webp", "sanity.imageAsset", {
      size: bytes.length,
      sha1hash: createHash("sha1").update(bytes).digest("hex"),
    }),
  ];
  const backup = {
    version: 1,
    target,
    createdAt: new Date().toISOString(),
    documentsHash: hash(docs),
    assets: [
      {
        id: docs[0]._id,
        file: "assets/image.bin",
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    ],
  };
  const save = (value = backup) =>
    writeFile(resolve(dir, "backup.json"), JSON.stringify(value));
  await mkdir(resolve(dir, "assets"));
  await writeFile(
    resolve(dir, "documents.ndjson"),
    docs.map((d) => JSON.stringify(d)).join("\n"),
  );
  await writeFile(resolve(dir, "assets/image.bin"), bytes);
  await save();
  assert.deepEqual((await loadBackup(dir)).docs, docs);
  await save({ ...backup, assets: [] });
  await assert.rejects(loadBackup(dir), /Incomplete asset/);
  await save({ ...backup, documentsHash: "tampered" });
  await assert.rejects(loadBackup(dir), /document hash/);
  await save({
    ...backup,
    target: { ...target, projectId: "wrong" as typeof target.projectId },
  });
  await assert.rejects(loadBackup(dir), /target/);
  await save({
    ...backup,
    assets: [{ ...backup.assets[0], file: "../outside" }],
  });
  await assert.rejects(loadBackup(dir), /Unsafe/);
  await save();
  await writeFile(resolve(dir, "assets/image.bin"), Buffer.from("changed"));
  await assert.rejects(loadBackup(dir), /asset hash/);
});

test("all collisions, unrelated duplicate slugs/sourceIds, unknown paths and releases fail closed", () => {
  for (const extra of [
    doc(publicContentId("program.one"), "program", {
      title: "Never overwrite me",
    }),
    doc(`drafts.${publicContentId("program.one")}`, "program", {
      title: "Owner draft occupies target pair",
    }),
    doc(publicContentId("program.only"), "program", {
      title: "Owner published target for a legacy draft-only record",
    }),
    doc("owner-root", "program", {
      slug: { current: content.programs[0].slug },
    }),
    doc("owner-root", "program", { sourceId: content.programs[0].id }),
    doc("unknown.private", "ownerType"),
    doc("versions.release.program.one", "program"),
    doc("drafts.program.one", "event"),
    doc("drafts.program.one", "program", {
      sourceId: "different-owner-identity",
    }),
  ])
    assert.throws(
      () =>
        planRepair([...fixture().filter((d) => d._id !== extra._id), extra]),
      /collision|Unsupported|Release|mismatch/i,
    );
});

test("new/differing targets and edits to either graph are never adopted or overwritten", () => {
  const plan = planRepair(fixture());
  for (const docs of [
    [...fixture(), doc(publicContentId("program.one"), "program")],
    fixture().map((d) =>
      d._id === "program.one" ? { ...d, _rev: "owner-new-revision" } : d,
    ),
    apply(plan).map((d) =>
      d._id === publicContentId("program.one")
        ? { ...d, title: "Owner edited after repair" }
        : d,
    ),
    apply(plan).filter((d) => d._id !== "program.one"),
    [...fixture(), doc("concurrent-owner-created", "program")],
  ])
    assert.throws(() => stateOf(plan, docs), /drift/);
});

test("fresh backup, exact confirmation, same-plan permission receipt and server dryRun precede a single atomic commit", async () => {
  const docs = fixture(),
    plan = planRepair(docs);
  const calls: boolean[] = [];
  const submit = async (_mutations: unknown, dryRun: boolean) => {
    calls.push(dryRun);
    return {};
  };
  const valid = {
    createdAt: new Date().toISOString(),
    confirmation: `REPAIR ${target.projectId}/${target.dataset} ${hash(plan)}`,
    permissions: true,
  };
  for (const invalid of [
    { ...valid, createdAt: "2000-01-01" },
    { ...valid, confirmation: undefined },
    { ...valid, confirmation: "yes" },
    { ...valid, permissions: false },
  ])
    await assert.rejects(executeRepair(plan, docs, invalid, submit));
  assert.deepEqual(calls, []);
  await assert.rejects(
    executeRepair(plan, docs, valid, async () => {
      throw Error("403 permission denied");
    }),
    /permission denied/,
  );
  await executeRepair(plan, docs, valid, submit);
  assert.deepEqual(calls, [true, false]);
  for (const m of plan.mutations) if (m.patch) assert.ok(m.patch.ifRevisionID);
  calls.length = 0;
  await executeRepair(plan, apply(plan), valid, submit);
  assert.deepEqual(calls, [], "Already-applied replay must be a no-op");
  assert.throws(() => assertFresh("invalid"));
  assert.throws(() => assertFresh(new Date(Date.now() + 100000).toISOString()));
});

test("missing strong refs and public-to-draft refs abort, weak refs retain metadata and are inventoried", () => {
  assert.throws(
    () =>
      planRepair([
        ...fixture(),
        doc("broken", "program", { relation: ref("missing") }),
      ]),
    /Unresolved strong/,
  );
  assert.throws(
    () =>
      planRepair([
        ...fixture(),
        doc("broken", "program", { relation: ref("drafts.program.only") }),
      ]),
    /reference drafts/,
  );
  const plan = planRepair([
    ...fixture(),
    doc("weak", "program", {
      relation: ref("missing", { _weak: true, _key: "keep" }),
    }),
  ]);
  assert.equal(plan.unresolvedWeakReferences.length, 1);
  assert.deepEqual(
    plan.active.find((d) => d._id === "weak")?.relation,
    ref("missing", { _weak: true, _key: "keep" }),
  );
});

test("CLI defaults to read-only inventory and refuses unknown modes and missing credentials", () => {
  for (const args of [[], ["--repair"], ["--delete"], ["--dry-run", "--bad"]]) {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/sanity-repair.ts", ...args],
      { encoding: "utf8", env: { ...process.env, SANITY_REPAIR_TOKEN: "" } },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /credential|required|Unknown|Only/);
  }
});

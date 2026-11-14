import test from "node:test";
import assert from "node:assert/strict";
import {
  makeCleanupPlan,
  executeCleanup,
  verifyCleanup,
} from "../scripts/historical-cleanup.mjs";
const source = "journal.event.diwali-celebrations-2025";
const repaired = `mvf-${Buffer.from(source).toString("base64url")}`;
const testId = "5616f846-7b1b-4264-9c96-e76c0fe846e6";
const doc = (id: string, extra: Record<string, unknown> = {}) => ({
  _id: id,
  _rev: `rev-${id}`,
  _type: "journalEntry",
  ...extra,
});
test("cleanup selects exact tests and demonstrably redundant identities, retaining owner differences and assets", () => {
  const docs = [
    doc(source, { sourceId: source, title: "Keep" }),
    doc(repaired, { sourceId: source, title: "Keep" }),
    doc(testId),
    doc("image-a", { _type: "sanity.imageAsset" }),
    doc("unrelated", { title: "Test dummy" }),
  ];
  const plan = makeCleanupPlan(docs);
  assert.deepEqual(
    new Set(plan.deletions.map((d) => d.id)),
    new Set([source, testId]),
  );
  const changed = makeCleanupPlan(
    docs.map((d) => (d._id === repaired ? { ...d, title: "Owner edit" } : d)),
  );
  assert.deepEqual(
    changed.deletions.map((d) => d.id),
    [testId],
  );
  const linked = makeCleanupPlan([
    ...docs,
    doc("inbound", { link: { _ref: source, _weak: true } }),
  ]);
  assert.deepEqual(
    linked.deletions.map((d) => d.id),
    [testId],
  );
  assert.throws(
    () => makeCleanupPlan([doc(testId, { _type: "sanity.imageAsset" })]),
    /different type/,
  );
});
test("cleanup requires exact approval, fresh revisions and durable intent before one atomic nonretrying transaction", async () => {
  const docs = [
    doc(testId),
    doc("owner", { title: "Owner text" }),
    doc("image-a", { _type: "sanity.imageAsset" }),
  ];
  const plan = makeCleanupPlan(docs);
  let current = structuredClone(docs),
    commits = 0,
    intents = 0,
    receipts = 0;
  const api = {
    export: async () => structuredClone(current),
    mutate: async (ms: unknown[], dry: boolean) => {
      if (!dry) {
        assert.equal(intents, 1);
        commits++;
        current = current
          .filter((d) => d._id !== testId)
          .map((d) =>
            d._type === "sanity.imageAsset" ? d : { ...d, _rev: "guarded" },
          );
      }
      return { transactionId: "fixture" };
    },
  };
  const options = {
    plan,
    api,
    confirmation: `CLEANUP 6jpdhhxg/production ${plan.hash}`,
    saveIntent: async () => {
      intents++;
    },
    saveReceipt: async () => {
      receipts++;
    },
  };
  await assert.rejects(
    executeCleanup({ ...options, confirmation: "yes" }),
    /confirmation/,
  );
  const tampered = structuredClone(plan);
  tampered.deletions = [{ ...plan.deletions[0], id: "image-a" }];
  await assert.rejects(
    executeCleanup({ ...options, plan: tampered }),
    /integrity/,
  );
  assert.equal(commits, 0);
  await assert.rejects(
    executeCleanup({
      ...options,
      saveIntent: async () => {
        throw Error("disk failed");
      },
    }),
    /disk failed/,
  );
  assert.equal(commits, 0);
  const result = await executeCleanup(options);
  assert.equal(commits, 1);
  assert.equal(receipts, 1);
  assert.ok("assetsPreserved" in result);
  assert.equal(result.assetsPreserved, 1);
  verifyCleanup(plan, current);
  await assert.rejects(executeCleanup(options), /Dataset drift/);
  assert.throws(
    () =>
      verifyCleanup(
        plan,
        current.map((d) =>
          d._id === "owner" ? { ...d, title: "Changed" } : d,
        ),
      ),
    /outcome differs/,
  );
});

test("cleanup compares referenced owner content recursively and never remaps external identities", () => {
  const media = "media.fixture",
    publicMedia = `mvf-${Buffer.from(media).toString("base64url")}`;
  const docs = [
    doc(source, { sourceId: source, photo: { _ref: media } }),
    doc(repaired, { sourceId: source, photo: { _ref: publicMedia } }),
    doc(media, { _type: "mediaItem", sourceId: media, caption: "Original" }),
    doc(publicMedia, {
      _type: "mediaItem",
      sourceId: media,
      caption: "Owner edit",
    }),
  ];
  assert.equal(makeCleanupPlan(docs).deletions.length, 0);
  const equal = docs.map((d) =>
    d._id === publicMedia ? { ...d, caption: "Original" } : d,
  );
  assert.deepEqual(
    makeCleanupPlan(equal).deletions.map((d) => d.id),
    [source],
  );
  const external = equal.map((d) =>
    [source, repaired].includes(d._id)
      ? {
          ...d,
          photo: {
            ...(d as unknown as { photo: Record<string, unknown> }).photo,
            _dataset: "elsewhere",
          },
        }
      : d,
  );
  assert.equal(makeCleanupPlan(external).deletions.length, 0);
});

test("cleanup never retries ambiguous responses and rejects owner edits during the permission probe", async () => {
  const docs = [doc(testId), doc("owner")],
    plan = makeCleanupPlan(docs);
  let current = structuredClone(docs),
    writes = 0;
  const options = {
    plan,
    confirmation: `CLEANUP 6jpdhhxg/production ${plan.hash}`,
    saveIntent: async () => {},
    saveReceipt: async () => assert.fail("no success receipt"),
    api: {
      export: async () => structuredClone(current),
      mutate: async (_m: unknown[], dry: boolean) => {
        if (!dry) {
          writes++;
          throw Error("lost response");
        }
        return {};
      },
    },
  };
  await assert.rejects(executeCleanup(options), /lost response/);
  assert.equal(writes, 1);
  writes = 0;
  await assert.rejects(
    executeCleanup({
      ...options,
      api: {
        ...options.api,
        mutate: async () => {
          current = current.map((d) =>
            d._id === "owner" ? { ...d, _rev: "edited" } : d,
          );
          return {};
        },
      },
    }),
    /Dataset drift/,
  );
  assert.equal(writes, 0);
});

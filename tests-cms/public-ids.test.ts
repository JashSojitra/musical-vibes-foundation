import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { content } from "../src/data/content";
import { mapSanity, type CmsDocument } from "../src/lib/sanity-model";
import {
  publicContentId,
  assertNoLegacyPathIds,
} from "../scripts/sanity-public-ids";

test("six stored Programs must remain six under anonymous Sanity ID access rules", () => {
  const settings = {
    _id: "siteSettings",
    _type: "siteSettings",
    ...content.settings,
  };
  const docs = content.programs.map((p) => ({
    ...p,
    _id: p.id,
    _type: "program",
    sourceId: p.id,
    slug: { current: p.slug },
  }));
  const anonymous = (items: CmsDocument[]) =>
    items.filter((d) => !d._id.includes("."));
  // This reproduces the deployed failure: six documents exist but all six are private-path IDs.
  assert.equal(docs.length, 6);
  assert.equal(
    mapSanity(anonymous([settings, ...docs]), "6jpdhhxg", "production").source
      .programs.length,
    0,
  );
  const corrected = docs.map((d) => ({ ...d, _id: publicContentId(d._id) }));
  const mapped = mapSanity(
    anonymous([settings, ...corrected]),
    "6jpdhhxg",
    "production",
  ).source.programs;
  assert.equal(mapped.length, 6);
  assert.deepEqual(
    mapped.map((p) => p.id),
    content.programs.map((p) => p.id),
  );
  assert.deepEqual(
    mapped.map((p) => p.slug),
    content.programs.map((p) => p.slug),
  );
  assert.notEqual(
    publicContentId("program.a-b"),
    publicContentId("program-a.b"),
  );
});

test("actual migration dry-run emits public IDs and resolves every content reference", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/sanity-migration.ts", "--dry-run"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(
    readFileSync(".tmp/sanity-migration/manifest.json", "utf8"),
  );
  const ids = new Set<string>(
    manifest.documents.map((d: CmsDocument) => d._id),
  );
  assert.equal(ids.size, 32);
  assert.ok(
    [...ids].every((id) => !id.includes(".")),
    "Dotted Sanity IDs are not publicly readable",
  );
  function check(value: unknown): void {
    if (Array.isArray(value)) value.forEach(check);
    else if (value && typeof value === "object") {
      const object = value as { _ref?: string };
      if (object._ref)
        assert.ok(ids.has(object._ref), `Broken reference: ${object._ref}`);
      Object.values(value).forEach(check);
    }
  }
  manifest.documents.forEach(check);
});

test("the importer refuses to duplicate existing legacy records instead of silently migrating them", () => {
  const legacy = new Set(content.programs.map((p) => p.id));
  assert.throws(
    () => assertNoLegacyPathIds([content.programs[0].id], legacy),
    /separately authorized/,
  );
  assert.throws(
    () => assertNoLegacyPathIds([`drafts.${content.programs[0].id}`], legacy),
    /no writes/,
  );
  assert.doesNotThrow(() =>
    assertNoLegacyPathIds([publicContentId(content.programs[0].id)], legacy),
  );
});

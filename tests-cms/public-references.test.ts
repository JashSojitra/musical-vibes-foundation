import { test } from "node:test";
import assert from "node:assert/strict";
import { referenceOrigins } from "../scripts/sanity-reference-origins.mjs";
import {
  validatePublicReference,
  publicReferenceOptions,
} from "../studio/schemas/public-references";
import { readFileSync } from "node:fs";

test("audit traces all local references including nested arrays without changing documents", () => {
  const docs = [
    {
      _id: "owner-update",
      _type: "journalEntry",
      _rev: "current",
      event: { _ref: "event.legacy" },
      photos: [
        { _ref: "missing-root" },
        { _ref: "event.remote", _dataset: "other" },
      ],
    },
  ];
  const before = JSON.stringify(docs);
  assert.deepEqual(referenceOrigins(docs), [
    {
      document: "owner-update",
      type: "journalEntry",
      revision: "current",
      path: "event._ref",
      ref: "event.legacy",
    },
    {
      document: "owner-update",
      type: "journalEntry",
      revision: "current",
      path: "photos[0]._ref",
      ref: "missing-root",
    },
  ]);
  assert.equal(JSON.stringify(docs), before);
});

test("Studio rejects inaccessible existing references and restricts all content reference pickers", () => {
  for (const value of [
    undefined,
    {},
    { _ref: "mvf-public" },
    { _ref: "new-uuid" },
  ])
    assert.equal(validatePublicReference(value), true);
  for (const ref of ["event.legacy", "drafts.public", "drafts.event.legacy"])
    assert.equal(typeof validatePublicReference({ _ref: ref }), "string");
  assert.match(publicReferenceOptions.filter, /string::split/);
  const schema = readFileSync("studio/schemas/index.ts", "utf8");
  // Shared array helper, shared image field and Update's Related event field.
  assert.equal((schema.match(/type: "reference"/g) || []).length, 3);
  assert.equal(
    (schema.match(/options: publicReferenceOptions/g) || []).length,
    3,
  );
  assert.equal(
    (schema.match(/custom\(validatePublicReference\)/g) || []).length,
    3,
  );
});

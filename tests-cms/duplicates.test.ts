import { test } from "node:test";
import assert from "node:assert/strict";
import { legacyDuplicates } from "../scripts/sanity-duplicates";

test("legacy duplicate inventory is offline, nonmutating and retains distinct owner records", () => {
  const docs = [
    {
      _id: "journal.original",
      _type: "journalEntry",
      slug: { current: "story" },
    },
    {
      _id: "mvf-existing",
      _type: "journalEntry",
      sourceId: "journal.original",
      slug: { current: "owner-renamed" },
    },
    { _id: "drafts.journal.original", _type: "journalEntry" },
    {
      _id: "mvf-different",
      _type: "journalEntry",
      slug: { current: "different" },
    },
  ];
  const before = JSON.stringify(docs);
  assert.deepEqual(legacyDuplicates(docs), [
    { legacyId: "journal.original", candidates: ["mvf-existing"] },
  ]);
  assert.equal(JSON.stringify(docs), before);
});

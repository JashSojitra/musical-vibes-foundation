import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaVisibility } from "../scripts/sanity-media-visibility.mjs";
import { referenceOrigins } from "../scripts/sanity-reference-origins.mjs";

test("readable assets can still be withheld from published Updates and homepage", () => {
  const documents = [
    {
      _id: "photo",
      _type: "mediaItem",
      editorialApproval: "pending",
      publicationEnabled: false,
    },
    {
      _id: "approved",
      _type: "mediaItem",
      editorialApproval: "approved",
      publicationEnabled: true,
    },
    {
      _id: "siteSettings",
      _type: "siteSettings",
      heroImage: { _ref: "photo" },
    },
    {
      _id: "story",
      _type: "journalEntry",
      photos: [{ _ref: "photo" }, { _ref: "approved" }],
    },
  ];
  const before = structuredClone(documents);
  const report = mediaVisibility(documents, referenceOrigins(documents));
  assert.equal(report.readableMedia, 2);
  assert.deepEqual(report.withheldMedia, [
    { id: "photo", reasons: ["not-approved", "publication-disabled"] },
  ]);
  assert.deepEqual(
    report.withheldReferenceOrigins.map(
      ({ document, path }: { document: string; path: string }) => ({
        document,
        path,
      }),
    ),
    [
      { document: "siteSettings", path: "heroImage._ref" },
      { document: "story", path: "photos[0]._ref" },
    ],
  );
  assert.deepEqual(documents, before);
});

test("each publication gate is diagnosed independently and missing fields fail closed", () => {
  const report = mediaVisibility(
    [
      {
        _id: "disabled",
        _type: "mediaItem",
        editorialApproval: "approved",
        publicationEnabled: false,
      },
      {
        _id: "pending",
        _type: "mediaItem",
        editorialApproval: "pending",
        publicationEnabled: true,
      },
      { _id: "unset", _type: "mediaItem" },
    ],
    [],
  );
  assert.deepEqual(report.withheldMedia, [
    { id: "disabled", reasons: ["publication-disabled"] },
    { id: "pending", reasons: ["not-approved"] },
    { id: "unset", reasons: ["not-approved", "publication-disabled"] },
  ]);
});

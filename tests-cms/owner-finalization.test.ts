import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  datasetDrift,
  digest,
  initialState,
  reconcile,
  runPhase,
  target,
} from "../scripts/historical-import.mjs";
import { eventSchema, pageMetadata } from "../src/lib/metadata";
import type { CommunityEvent } from "../src/types/content";
import {
  demoHeaders,
  securityHeaders,
  previewAssetHeaders,
} from "../cloudflare/demo-headers.mjs";

const fixture = JSON.parse(
  readFileSync("tests-cms/fixtures/dataset-drift.json", "utf8"),
);
function planFor(before: typeof fixture.expected) {
  const body = { format: 1, target, before, imports: [], drafts: [] };
  return { ...body, hash: digest(body) };
}

test("drift classifications are diagnostic only; every difference still blocks without exposing content", async () => {
  assert.deepEqual(datasetDrift(fixture.expected, fixture.current), {
    added: 1,
    removed: 1,
    contentChanged: 1,
    revisionOnly: 1,
    metadataOnly: 1,
  });
  const plan = planFor(fixture.expected);
  for (const current of [
    fixture.current,
    fixture.expected.map((d: object) => ({ ...d, _rev: "new" })),
    fixture.expected.slice(1),
  ]) {
    const state = initialState(plan);
    const saved = structuredClone(state);
    await assert.rejects(
      runPhase({
        plan,
        state,
        phase: "validate",
        confirmation: undefined,
        dir: ".",
        api: {
          export: async () => current,
          upload: async () => assert.fail("unexpected upload"),
          mutate: async () =>
            assert.fail("unexpected permission probe or mutation"),
        },
        save: async () => assert.fail("unexpected checkpoint write"),
      }),
      (error: Error) => {
        assert.match(error.message, /Dataset drift: added=\d/);
        assert.match(error.message, /pending request/);
        assert.doesNotMatch(
          error.message,
          /owner-private-id|Private owner text|authorized edit/,
        );
        return true;
      },
    );
    assert.deepEqual(state, saved);
  }
  // Export order and object property order do not create false drift.
  reconcile(plan, initialState(plan), [...fixture.expected].reverse());
});

test("Event schema uses recorded facts and omits incomplete or invalid dates", () => {
  const event = {
    title: "Fixture gathering",
    description: "Recorded description",
    date: "2024-02-29",
    location: "Recorded venue",
    slug: "fixture",
  } as CommunityEvent;
  const schema = eventSchema(event, "https://example.org/");
  assert.equal(schema?.startDate, "2024-02-29");
  assert.equal(schema?.url, "https://example.org/events/fixture");
  assert.deepEqual(schema?.location, {
    "@type": "Place",
    name: "Recorded venue",
  });
  assert.ok(!("offers" in schema!) && !("endDate" in schema!));
  for (const date of [
    "2025-02-29",
    "2026-13-01",
    "unknown",
    "2026-11-01T12:00:00Z",
  ])
    assert.equal(eventSchema({ ...event, date }, "https://example.org"), null);
  assert.equal(
    eventSchema({ ...event, location: "" }, "https://example.org"),
    null,
  );
  const metadata = pageMetadata("Fixture", "Description", "/events/fixture");
  assert.deepEqual(metadata.alternates, { canonical: "/events/fixture" });
  assert.ok(metadata.twitter && "card" in metadata.twitter);
  assert.equal(metadata.twitter.card, "summary_large_image");
});

// Execute the real wrappers with a fixture handler; no generated Worker or network needed.
async function wrapper(file: string) {
  const source = readFileSync(file, "utf8")
    .replace(
      /^import handler .*;$/m,
      'const handler = { fetch: async () => new Response("fixture") };',
    )
    .replace(/^export \* .*;$/m, "")
    .replace(
      '"./demo-headers.mjs"',
      JSON.stringify(
        new URL("../cloudflare/demo-headers.mjs", import.meta.url).href,
      ),
    )
    .replace(
      '"./production-routing.mjs"',
      JSON.stringify(
        new URL("../cloudflare/production-routing.mjs", import.meta.url).href,
      ),
    );
  return (
    await import(
      `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
    )
  ).default;
}
test("real Worker wrappers secure pages and redirects while keeping preview noindex separate", async () => {
  for (const preview of [false, true]) {
    const worker = await wrapper(
      `cloudflare/${preview ? "cms-preview" : "production"}-worker.mjs`,
    );
    for (const path of [
      "/",
      "/index.html",
      "/_next/static/fixture.js",
      "/missing",
    ]) {
      const response = await worker.fetch(
        new Request(`https://example.org${path}`),
        {},
        {},
      );
      for (const [key, value] of Object.entries(securityHeaders))
        assert.equal(response.headers.get(key), value);
      assert.equal(
        response.headers.get("X-Robots-Tag"),
        preview ? demoHeaders["X-Robots-Tag"] : null,
      );
      if (!path.startsWith("/_next/static/"))
        assert.equal(response.headers.get("Cache-Control"), "no-store");
      if (!preview && path === "/index.html") {
        assert.equal(response.status, 308);
        assert.equal(response.headers.get("Location"), "https://example.org/");
      }
    }
  }
});

test("static assets carry common security headers without production noindex", () => {
  const headers = readFileSync("public/_headers", "utf8");
  for (const [name, value] of Object.entries(securityHeaders)) {
    assert.ok(headers.includes(`  ${name}: ${value}`));
  }
  assert.doesNotMatch(headers, /noindex|nofollow/i);
  const preview = previewAssetHeaders(headers);
  assert.equal(
    preview.split(/\r?\n/).filter((line) => line === "/*").length,
    1,
  );
  for (const [name, value] of Object.entries(demoHeaders))
    assert.ok(preview.includes(`  ${name}: ${value}`));
  assert.throws(() => previewAssetHeaders(preview), /Invalid/);
  assert.throws(
    () => previewAssetHeaders(headers + "\n/*\n  X-Robots-Tag: noindex\n"),
    /one shared/,
  );
});

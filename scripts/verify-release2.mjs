import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";

const base = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:3000";
const sitemap = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemap.status, 200);
const routes = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => new URL(match[1]).pathname,
);
assert.equal(routes.length, 17, "All intended routes should be indexed");
const urls = new Set(["/robots.txt", "/sitemap.xml"]);
const results = [];
for (const route of routes) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert.equal(
    (html.match(/<h1(?:\s|>)/g) || []).length,
    1,
    `${route}: one H1`,
  );
  assert.ok(
    /<meta name="description" content="[^"]+"/.test(html),
    `${route}: description`,
  );
  assert.ok(html.includes("application/ld+json"), `${route}: structured data`);
  for (const [, href] of html.matchAll(/href="([^"<>]+)"/g)) {
    if (href.startsWith("/") && !href.startsWith("//"))
      urls.add(href.replaceAll("&amp;", "&"));
    if (href.startsWith("#"))
      assert.ok(
        html.includes(`id="${href.slice(1)}"`),
        `${route}: ${href} target exists`,
      );
  }
  for (const [, src] of html.matchAll(/src="([^"<>]+)"/g))
    if (src.startsWith("/")) urls.add(src.replaceAll("&amp;", "&"));
  results.push({
    route,
    status: response.status,
    h1: true,
    metadata: true,
    structuredData: true,
  });
}
for (const url of urls) {
  const response = await fetch(base + url);
  assert.equal(response.status, 200, url);
  await response.arrayBuffer();
}
for (const path of [
  "/not-a-page",
  "/programs/not-a-program",
  "/events/not-an-event",
])
  assert.equal((await fetch(base + path)).status, 404, path);
const hash = crypto
  .createHash("sha256")
  .update(await fs.readFile("public/assets/legacy/logo.png"))
  .digest("hex");
assert.equal(
  hash,
  "67332e1645013f1927c53639513c6da3449c0490f377086233e143366b1ded1d",
);
const report = {
  date: "2026-11-03",
  routes: results,
  checkedInternalLinksAndAssets: urls.size,
  unknownRoutesReturn404: true,
  originalLogoUnchanged: true,
};
await fs.mkdir("docs/validation/release2", { recursive: true });
await fs.writeFile(
  "docs/validation/release2/http-checks.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `Verified ${routes.length} routes, ${urls.size} linked local resources, 3 unknown routes, and original logo integrity.`,
);

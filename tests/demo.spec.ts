import { expect, test } from "@playwright/test";

test("demo responses and static files carry noindex and security headers", async ({
  request,
}) => {
  test.skip(
    process.env.WORKER_CONFIG !== "wrangler.demo.jsonc",
    "Demo-only response policy",
  );
  for (const path of [
    "/",
    "/journal",
    "/gallery?collection=standalone.community-archive",
    "/contact",
    "/assets/legacy/logo.png",
    "/_next/image?url=%2Fassets%2Fcurated%2Fcommunity-picnic.webp&w=640&q=75",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
    expect(response.headers()["x-content-type-options"], path).toBe("nosniff");
    expect(response.headers()["x-frame-options"], path).toBe("DENY");
    expect(response.headers()["referrer-policy"], path).toBe(
      "strict-origin-when-cross-origin",
    );
  }
});

test("demo excludes unused original archive photographs", async ({
  request,
}) => {
  test.skip(
    process.env.WORKER_CONFIG !== "wrangler.demo.jsonc",
    "Demo upload policy",
  );
  expect(
    (
      await request.get("/assets/legacy/Mar_19_2025_seniors_club--2.jpg")
    ).status(),
  ).toBe(404);
});

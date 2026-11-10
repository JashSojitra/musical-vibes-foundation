import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("favicon routes ship the original symbol and browser-readable metadata", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/");
  const icons = await page.locator('link[rel="icon"]').evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute("href")!,
      sizes: link.getAttribute("sizes"),
    })),
  );
  expect(
    icons.some(
      ({ href }) => new URL(href, page.url()).pathname === "/favicon.ico",
    ),
  ).toBe(true);
  expect(
    icons.some(
      ({ href, sizes }) => href.startsWith("/icon.png?") && sizes === "32x32",
    ),
  ).toBe(true);
  expect(icons.some(({ href }) => href.includes("/assets/favicon.png"))).toBe(
    false,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "sizes",
    "180x180",
  );

  for (const [path, file, size] of [
    ["/favicon-16x16.png", "public/favicon-16x16.png", 16],
    ["/icon.png", "src/app/icon.png", 32],
    ["/apple-icon.png", "src/app/apple-icon.png", 180],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    expect(await response.body()).toEqual(readFileSync(file));
    const decoded = await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        cornerAlpha: context.getImageData(0, 0, 1, 1).data[3],
        visible: context
          .getImageData(0, 0, canvas.width, canvas.height)
          .data.some((value, index) => index % 4 === 3 && value > 0),
      };
    }, path);
    expect(decoded).toEqual({
      width: size,
      height: size,
      cornerAlpha: 0,
      visible: true,
    });
  }
  const ico = await request.get("/favicon.ico");
  expect(ico.status()).toBe(200);
  expect(ico.headers()["content-type"]).toMatch(
    /image\/(x-icon|vnd.microsoft.icon)/,
  );
  expect(await ico.body()).toEqual(readFileSync("src/app/favicon.ico"));
  const icoSizes = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/favicon.ico";
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  });
  expect(icoSizes).toEqual([48, 48]);
  await page.goto("/favicon.ico");
  await testInfo.attach("browser-rendered-favicon", {
    body: await page.locator("img").screenshot(),
    contentType: "image/png",
  });
});

test("demo responses and static files carry noindex and security headers", async ({
  request,
}) => {
  test.skip(
    process.env.WORKER_CONFIG !== "wrangler.demo.jsonc",
    "Demo-only response policy",
  );
  for (const path of [
    "/",
    "/updates",
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

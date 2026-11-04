import { expect, test } from "@playwright/test";

test("real Wrangler CMS preview serves public published content without writes", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of [
    "/",
    "/about",
    "/programs",
    "/events",
    "/journal",
    "/gallery",
    "/get-involved",
    "/contact",
    "/faq",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(response?.headers()["cache-control"]).toBe("no-store");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /https:\/\/www.musicalvibesfoundation.com/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      path,
    ).toBe(false);
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(
    "https://www.musicalvibesfoundation.com",
  );
  expect((await request.get("/assets/image-unavailable.svg")).status()).toBe(
    200,
  );
  expect((await request.get("/assets/curated/shared-song.webp")).status()).toBe(
    404,
  );
  expect(errors).toEqual([]);
});

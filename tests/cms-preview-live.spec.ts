import { expect, test, type Page } from "@playwright/test";
import { auditPublicSanity } from "../scripts/audit-sanity-public.mjs";
import { createClient } from "@sanity/client";
import { readSanitySnapshot } from "../src/lib/sanity-read";
import { createContentAdapter } from "../src/lib/journal";

async function decodePhotographs(page: Page) {
  // A decoded beige fallback or logo is not evidence that a CMS photo rendered.
  const images = page.locator('img[src*="cdn.sanity.io"]');
  let decoded = 0;
  for (const image of await images.all()) {
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (element) => {
      const img = element as HTMLImageElement;
      await img.decode();
      if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0)
        throw new Error(`Photograph failed to decode: ${img.currentSrc}`);
      const bounds = img.getBoundingClientRect();
      let opacity = 1;
      for (let node: Element | null = img; node; node = node.parentElement)
        opacity *= Number(getComputedStyle(node).opacity);
      if (bounds.width <= 0 || bounds.height <= 0 || opacity <= 0)
        throw new Error(`Photograph is hidden: ${img.currentSrc}`);
    });
    decoded++;
  }
  return {
    decodedPhotographs: decoded,
    placeholderImages: await page
      .locator('img[src*="image-unavailable.svg"]')
      .count(),
  };
}

test("real Wrangler CMS preview serves public published content without writes", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(180000);
  const audit = await auditPublicSanity();
  const snapshot = await readSanitySnapshot(
    createClient({
      projectId: audit.projectId,
      dataset: audit.dataset,
      apiVersion: audit.apiVersion,
      useCdn: false,
      perspective: "published",
    }),
  );
  const adapter = createContentAdapter(snapshot.source, snapshot.entries);
  await testInfo.attach("media-publication-visibility", {
    body: JSON.stringify(audit.mediaVisibility, null, 2),
    contentType: "application/json",
  });
  expect(
    audit.unreadableReferences,
    "CMS references must be readable anonymously; dotted IDs require an authorized data repair, not a cache purge",
  ).toEqual([]);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of [
    "/",
    "/about",
    "/programs",
    "/events",
    "/updates",
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
    await testInfo.attach(`images-${path === "/" ? "home" : path.slice(1)}`, {
      body: JSON.stringify(await decodePhotographs(page)),
      contentType: "application/json",
    });
  }
  await page.goto("/updates");
  const stories = await page
    .locator('.journal-index a[href^="/updates/"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href")!)),
    ]);
  for (const story of stories) {
    await page.goto(story);
    const entry = adapter.getJournalEntry(story.split("/").pop()!);
    expect(
      entry,
      "Visible Updates must match the published query",
    ).toBeDefined();
    const photographs = await decodePhotographs(page);
    expect(photographs.decodedPhotographs).toBeGreaterThanOrEqual(
      adapter.getEntryPhotos(entry!).length,
    );
    await testInfo.attach(`images-${story.split("/").pop()}`, {
      body: JSON.stringify(photographs),
      contentType: "application/json",
    });
  }
  await page.goto("/gallery");
  const thumbnails = page.locator(".gallery-photo button");
  await expect(thumbnails).toHaveCount(adapter.getPublicPhotos().length);
  if (await thumbnails.count()) {
    await thumbnails.first().click();
    await expect(page.locator("dialog.lightbox")).toBeVisible();
    const photo = page.locator(".lightbox-stage img");
    await expect(photo).toHaveAttribute("src", /cdn\.sanity\.io/);
    await photo.evaluate(async (element) => {
      const image = element as HTMLImageElement;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight)
        throw new Error("Lightbox photograph failed to decode");
    });
    await page.getByRole("button", { name: "Close photograph" }).click();
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

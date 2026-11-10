import { expect, test } from "@playwright/test";
import { content } from "../src/data/content";
import {
  createContentAdapter,
  deriveGalleryCollections,
  journalSeed,
} from "../src/lib/journal";

test("model: publication, media approval, stable relationships and empty fallback", () => {
  const source = structuredClone(content),
    entry = structuredClone(journalSeed[0]);
  const today = "2026-11-03";
  entry.photoIds = [
    source.media[0].id,
    source.media[0].id,
    source.media[1].id,
    "missing",
  ];
  source.media[1].approval = "pending";
  const first = deriveGalleryCollections([entry], source.media, today)[0];
  expect(
    deriveGalleryCollections([{ ...entry, kind: "news" }], source.media, today),
  ).toEqual([]);
  expect(
    deriveGalleryCollections(
      [{ ...entry, eventId: undefined }],
      source.media,
      today,
    ),
  ).toEqual([]);
  expect(first.photos).toHaveLength(1);
  expect(first.photos[0]).toBe(source.media[0]);
  const renamed = {
    ...entry,
    title: "Renamed archive note",
    slug: "renamed-note",
    photoIds: [source.media[2].id],
  };
  const next = deriveGalleryCollections([renamed], source.media, today)[0];
  expect(next.id).toBe(first.id);
  expect(next.title).toBe(renamed.title);
  expect(next.journalSlug).toBe(renamed.slug);
  expect(next.photos[0]).toBe(source.media[2]);
  for (const status of ["draft", "unpublished"] as const)
    expect(
      deriveGalleryCollections([{ ...entry, status }], source.media, today),
    ).toEqual([]);
  expect(
    deriveGalleryCollections(
      [{ ...entry, publishedAt: "2099-01-01" }],
      source.media,
      today,
    ),
  ).toEqual([]);
  expect(
    deriveGalleryCollections(
      [{ ...entry, publishedAt: "invalid" }],
      source.media,
      today,
    ),
  ).toEqual([]);
  const journalOnly = {
    ...source.media[2],
    id: "journal-only",
    standaloneGallery: false,
  };
  source.media.push(journalOnly);
  const draftOnly = {
    ...entry,
    status: "draft" as const,
    photoIds: [journalOnly.id],
  };
  const hiddenAdapter = createContentAdapter(source, [draftOnly], today);
  expect(
    hiddenAdapter
      .getPublicPhotos()
      .some((photo) => photo.id === journalOnly.id),
  ).toBe(false);
  expect(hiddenAdapter.getEntryPhotos(draftOnly)).toEqual([]);
  const publishedAdapter = createContentAdapter(
    source,
    [{ ...draftOnly, status: "published" }],
    today,
  );
  expect(
    publishedAdapter
      .getPublicPhotos()
      .some((photo) => photo.id === journalOnly.id),
  ).toBe(true);
  expect(
    publishedAdapter
      .getGalleryCollections()
      .find((collection) => collection.id === "standalone.community-archive")
      ?.photos.some((photo) => photo.id === journalOnly.id),
  ).toBe(false);
  source.media[0].publicationStatus = "draft";
  expect(deriveGalleryCollections([entry], source.media, today)).toEqual([]);
  const adapter = createContentAdapter(
    source,
    [{ ...entry, status: "draft" }],
    today,
  );
  expect(adapter.getJournalEntries()).toEqual([]);
  expect(adapter.getGalleryCollections().map((item) => item.id)).toEqual([
    "standalone.community-archive",
  ]);
  expect(
    adapter
      .getPublicPhotos()
      .some(
        (photo) =>
          photo.id === source.media[0].id || photo.id === source.media[1].id,
      ),
  ).toBe(false);
  expect(
    createContentAdapter(
      { ...source, media: [] },
      [entry],
      today,
    ).getGalleryCollections(),
  ).toEqual([]);
});

test("More navigation supports pointer, click, keyboard, Escape and mobile tap", async ({
  page,
}, info) => {
  await page.goto("/");
  if (info.project.name === "desktop") {
    const more = page.getByRole("button", { name: "More", exact: true });
    await expect(
      page.locator(".desktop-nav > a .nav-label, .program-navigation > button"),
    ).toHaveText([
      "About",
      "Programs",
      "Events",
      "Gallery",
      "Updates",
      "Contact",
      "More",
    ]);
    await expect(more.locator("span, svg")).toHaveCount(0);
    expect(
      await more.evaluate(
        (element) => getComputedStyle(element, "::after").content,
      ),
    ).toMatch(/^(none|normal|"")$/);
    await more.hover();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    const bounds = await page.locator("#program-submenu").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
    await page.locator(".program-menu-links a").first().hover();
    await expect(page.locator("#program-submenu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.press("ArrowDown");
    await expect(page.locator(".program-menu-links a").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await more.press("Enter");
    await page.locator(".program-menu-links a").last().focus();
    await page.keyboard.press("Tab");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await page.locator('.desktop-nav a[href="/updates"]').click();
  } else {
    const menu = page.getByRole("button", { name: "Menu", exact: false });
    await menu.click();
    await page.locator(".mobile-programs summary").click();
    await expect(page.locator(".mobile-programs a")).toHaveCount(6);
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await menu.click();
    await page.locator('#mobile-menu a[href="/updates"]').click();
  }
  await expect(page).toHaveURL(/\/updates$/);
  const navigation =
    info.project.name === "desktop" ? ".desktop-nav" : ".mobile-menu-links";
  await expect(
    page.locator(`${navigation} a[href="/updates"]`),
  ).toHaveAttribute("aria-current", "page");
});

test("Journal, derived gallery and Events teaser form a complete visitor journey", async ({
  page,
}) => {
  await page.goto("/updates");
  await expect(page.locator(".journal-featured")).toBeVisible();
  await expect(page.locator(".journal-recent article")).toHaveCount(2);
  await page.locator(".journal-featured .text-link").click();
  await expect(page).toHaveURL(/\/updates\/.+/);
  const title = await page.locator("h1").innerText();
  await expect(page.locator(".journal-meta")).toContainText("Gathering:");
  await expect(
    page.locator(".journal-article-body aside a").first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Explore this story in photographs" })
    .click();
  await expect(page).toHaveURL(/\/gallery\?collection=journal-collection/);
  await expect(page.locator(".selected-collection h2")).toHaveText(title);
  await page.getByRole("link", { name: "Read the Update" }).click();
  await expect(page.locator("h1")).toHaveText(title);
  await page.goto("/events");
  await expect(page.locator(".event-archive h2")).toHaveText(
    "Good times.Beautiful memories.",
  );
  await expect(
    page.locator(
      ".event-archive .featured-event,.event-archive .past-event-list",
    ),
  ).toHaveCount(0);
  await expect(
    page.locator(".event-archive .gallery-collection-card"),
  ).toHaveCount(3);
  await page
    .getByRole("link", { name: "Explore our memories", exact: true })
    .click();
  await expect(page).toHaveURL(/\/gallery$/);
  await expect(page.locator(".gallery-photo")).toHaveCount(12);
});

test("routes, floating Contact, metadata and image loading remain healthy", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const route of [
    "/",
    "/about",
    "/programs",
    "/events",
    "/gallery",
    "/updates",
    "/get-involved",
    "/contact",
    "/faq",
    ...content.programs.map((item) => `/programs/${item.slug}`),
    ...content.events.map((item) => `/events/${item.slug}`),
    ...journalSeed.map((item) => `/updates/${item.slug}`),
  ]) {
    expect((await page.goto(route))?.status(), route).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S/,
    );
    expect(
      new URL(
        (await page.locator('link[rel="canonical"]').getAttribute("href"))!,
      ).pathname,
    ).toBe(route);
    const floating = page.getByRole("link", {
      name: "Contact the foundation",
      exact: true,
    });
    if (route === "/contact") await expect(floating).toHaveCount(0);
    else {
      await expect(floating).toBeVisible();
      expect((await floating.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      route,
    ).toBe(false);
    expect(await page.locator("img:not([alt])").count()).toBe(0);
  }
  expect(errors).toEqual([]);
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  for (const entry of journalSeed)
    expect(sitemap).toContain(`/updates/${entry.slug}`);
  expect(
    (await page.goto("/updates/a-draft-that-is-not-published"))?.status(),
  ).toBe(404);
  await page.goto("/");
  await page
    .getByRole("link", { name: "Contact the foundation", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
});

test("reduced motion preserves the hero, More control and gallery experience", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".sculpture-fallback")).toBeVisible();
  if (info.project.name === "desktop") {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.keyboard.press("Escape");
  }
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Music", exact: true }).click();
  await page.locator(".gallery-photo button").first().click();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".lightbox-caption")).toContainText("2 / 2");
  await page.keyboard.press("Escape");
  await expect(page.locator(".gallery-photo button").first()).toBeFocused();
});

test("historical Journal URLs redirect to canonical Updates without losing the slug", async ({
  page,
}) => {
  await page.goto("/journal");
  await expect(page).toHaveURL(/\/updates$/);
  const entry = journalSeed[0];
  await page.goto(`/journal/${entry.slug}`);
  await expect(page).toHaveURL(new RegExp(`/updates/${entry.slug}$`));
});

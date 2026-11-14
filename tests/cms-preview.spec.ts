import { test, expect } from "@playwright/test";

const fixture = () => [
  {
    _id: "siteSettings",
    _type: "siteSettings",
    name: "Musical Vibes Foundation",
    url: "https://www.musicalvibesfoundation.com",
    email: "hello@example.org",
    phone: "+1 416 555 0100",
    location: "Brampton",
    mission: "Community connection",
  },
  {
    _id: "media-photo",
    _type: "mediaItem",
    sourceId: "song",
    alt: "A community gathering",
    caption: "Community music",
    category: "Music",
    image: { asset: { _ref: "image-abcdef-1600x1000-webp" } },
    assetExists: true,
    editorialApproval: "approved",
    publicationEnabled: true,
    standaloneGallery: false,
  },
  {
    _id: "program-music",
    sourceId: "program.music",
    _type: "program",
    slug: { current: "preview-music" },
    title: "Preview music program",
    headline: "Share a song",
    description: "Music together",
    number: "01",
    theme: "rose",
    category: "Music",
    image: { _ref: "media-photo" },
    focus: ["Connection"],
    body: [
      {
        _type: "block",
        _key: "p",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "s",
            text: "A program description",
            marks: [],
          },
        ],
      },
    ],
  },
  {
    _id: "event-gathering",
    sourceId: "event.gathering",
    _type: "event",
    slug: { current: "preview-gathering" },
    title: "Preview gathering",
    date: "2025-10-16",
    status: "past",
    description: "A community gathering",
    image: { _ref: "media-photo" },
    gallery: [{ _ref: "media-photo" }],
  },
  {
    _id: "journal-story",
    sourceId: "journal.story",
    _type: "journalEntry",
    slug: { current: "preview-story" },
    title: "Preview story",
    excerpt: "A shared community moment",
    publishedAt: "2026-11-03",
    kind: "event",
    event: { _ref: "event-gathering" },
    programs: [{ _ref: "program-music" }],
    photos: [{ _ref: "media-photo" }],
    body: [
      {
        _type: "block",
        _key: "p",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "s",
            text: "A real CMS-rendered article body",
            marks: [],
          },
        ],
      },
    ],
  },
];

test("built CMS navigation, contact and footer support keyboard use at each viewport", async ({
  page,
  request,
}, info) => {
  await request.post("/__fixture", { data: fixture() });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const more = page.getByRole("button", { name: "More", exact: true });
  if (await more.isVisible()) {
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await more.press("Escape");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(more).toBeFocused();
  } else {
    const menu = page.getByRole("button", { name: /Menu/ });
    await menu.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-menu")).not.toBeVisible();
    await expect(menu).toBeFocused();
  }
  await page.goto("/contact");
  await page.getByRole("button", { name: "Prepare my email" }).click();
  await expect(page.locator("#contact-name")).toBeFocused();
  await page.getByLabel("Your name").fill("Fixture visitor");
  await page.getByLabel("Email address").fill("visitor@example.org");
  await page
    .getByLabel("Your message")
    .fill("A fixture enquiry with & and ? characters.");
  await page.getByRole("button", { name: "Prepare my email" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("link", { name: "Open my email draft" }),
  ).toHaveAttribute("href", /^mailto:hello@example\.org\?/);
  const credit = page.locator(".footer-credit");
  await credit.scrollIntoViewIfNeeded();
  await expect(credit).toContainText(
    "Thoughtfully designed & developed by Jash Sojitra",
  );
  const profiles = credit.getByRole("navigation", {
    name: "Developer profiles",
  });
  const linkedIn = profiles.getByRole("link", { name: /LinkedIn/ });
  await linkedIn.focus();
  await page.keyboard.press("Tab");
  await expect(profiles.getByRole("link", { name: /GitHub/ })).toBeFocused();
  expect(await page.locator("img:not([alt])").count()).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.tmp/finalization-${info.project.name}-contact.png`,
    fullPage: true,
  });
});

test("root CMS failure shows a generic recovery screen and recovers when content returns", async ({
  page,
  request,
}) => {
  await request.post("/__fixture", { data: [] });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "We couldn’t load the website." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("siteSettings");
  await request.post("/__fixture", { data: fixture() });
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "We couldn’t load the website." }),
  ).toHaveCount(0);
});

test("CMS SSR, dynamic slugs, images, metadata and Journal/Gallery updates in workerd", async ({
  page,
  request,
}) => {
  await request.post("/__fixture", { data: fixture() });
  const response = await request.get("/updates/preview-story");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("A real CMS-rendered article body");
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await page.goto("/updates/preview-story");
  await expect(page.locator("h1")).toHaveText("Preview story");
  await expect(page.locator(".program-menu-links a")).toHaveCount(1);
  await expect(page.locator(".mobile-programs a")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.musicalvibesfoundation.com/updates/preview-story",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "A shared community moment",
  );
  expect(
    await page.locator('script[type="application/ld+json"]').allTextContents(),
  ).toEqual(
    expect.arrayContaining([expect.stringContaining('"@type":"Article"')]),
  );
  const photo = page.locator(".journal-article-photo img");
  await expect(photo).toHaveAttribute("srcset", /cdn\.sanity\.io/);
  await expect
    .poll(() => photo.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await page
    .getByRole("link", { name: "Explore this story in photographs" })
    .click();
  await expect(page.locator(".selected-collection h2")).toHaveText(
    "Preview story",
  );
  await page.getByRole("link", { name: "Read the Update" }).click();
  await expect(page).toHaveURL(/\/updates\/preview-story$/);
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "/updates/preview-story",
  );
  expect((await request.get("/programs/preview-music")).status()).toBe(200);
  expect((await request.get("/events/preview-gathering")).status()).toBe(200);
  await page.goto("/programs");
  await expect(page.locator(".program-row")).toHaveCount(1);
  await page.goto("/updates");
  await expect(page.locator(".journal-featured")).toContainText(
    "Preview story",
  );
  await page.goto("/events");
  await expect(page.locator(".gallery-collection-card")).toContainText(
    "Preview story",
  );
  expect((await request.get("/updates/not-published")).status()).toBe(404);

  const renamed = fixture();
  renamed[4].title = "Renamed story";
  renamed[4].slug = { current: "renamed-story" };
  await request.post("/__fixture", {
    data: renamed.map((d) =>
      d._type === "journalEntry"
        ? { ...d, previousSlugs: ["preview-story"] }
        : d,
    ),
  });
  const redirect = await request.get("/updates/preview-story", {
    maxRedirects: 0,
    headers: { "user-agent": "facebookexternalhit/1.1" },
  });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe("/updates/renamed-story");
  await page.goto("/updates/preview-story");
  await expect(page).toHaveURL(/\/updates\/renamed-story$/);
  await page.goto("/gallery?collection=journal-collection.journal.story");
  await expect(page.locator(".selected-collection h2")).toHaveText(
    "Renamed story",
  );
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "/updates/renamed-story",
  );

  const withdrawn = fixture().map((d) =>
    d._type === "mediaItem" ? { ...d, editorialApproval: "pending" } : d,
  );
  await request.post("/__fixture", { data: withdrawn });
  await page.goto("/updates/preview-story");
  await expect(page.locator(".journal-article-photo")).toHaveCount(0);
  await page.goto("/programs/preview-music");
  await expect(page.locator(".program-detail-hero img")).toHaveAttribute(
    "src",
    /image-unavailable\.svg/,
  );
  await page.goto("/gallery");
  await expect(page.locator(".gallery-photo")).toHaveCount(0);
  await request.post("/__fixture", {
    data: fixture().filter((d) => d._type !== "journalEntry"),
  });
  expect((await request.get("/updates/preview-story")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "/updates/preview-story",
  );
});

test("empty CMS stays usable without exposing local demo photographs", async ({
  page,
  request,
}) => {
  await request.post("/__fixture", {
    data: fixture().filter((d) => d._type === "siteSettings"),
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/about",
    "/programs",
    "/events",
    "/updates",
    "/gallery",
    "/contact",
    "/faq",
  ]) {
    expect((await page.goto(route))?.status(), route).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.locator('img[src*="curated"]').count()).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      route,
    ).toBe(false);
  }
  expect((await request.get("/assets/curated/shared-song.webp")).status()).toBe(
    404,
  );
  expect((await request.get("/assets/image-unavailable.svg")).status()).toBe(
    200,
  );
});

test("owner uploads and homepage choices render from one published story", async ({
  page,
  request,
}) => {
  const data = fixture().map((d) =>
    d._type === "journalEntry"
      ? {
          ...d,
          kind: "update",
          event: undefined,
          photos: [],
          body: [],
          excerpt: "An afternoon together",
          showInGallery: true,
          photoRightsConfirmed: true,
          storyPhotos: Array.from({ length: 24 }, (_, i) => ({
            _key: `upload-${i}`,
            asset: { _ref: "image-abcdef-1600x1000-webp" },
            assetExists: true,
            cover: i === 5,
            caption: `Moment ${i}`,
            decorative: i === 6,
          })),
        }
      : d._type === "siteSettings"
        ? {
            ...d,
            heroHeadline: "Come together",
            heroEmphasis: "Share a song.",
            heroDescription: "Owner introduction",
            heroCtaLabel: "Join us",
            heroCtaHref: "/contact",
            heroImage: { _ref: "media-photo" },
            featuredStories: [{ _ref: "journal-story" }],
            featuredPrograms: [{ _ref: "program-music" }],
            featuredEvents: [{ _ref: "event-gathering" }],
          }
        : d,
  );
  await request.post("/__fixture", { data });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Come together");
  await expect(
    page.getByRole("link", { name: "Join us", exact: true }),
  ).toHaveAttribute("href", "/contact");
  await expect(page.locator(".journal-preview")).toContainText("Preview story");
  await expect(page.locator(".upcoming-section")).toContainText(
    "Preview gathering",
  );
  await page.goto("/updates/preview-story");
  await expect(page.locator(".journal-article-photo figcaption")).toHaveText(
    "Moment 5",
  );
  await expect(page.locator(".journal-article-body")).toContainText(
    "An afternoon together",
  );
  await page
    .getByRole("link", { name: "Explore this story in photographs" })
    .click();
  await expect(page.locator(".selected-collection h2")).toHaveText(
    "Preview story",
  );
  await expect(page.locator(".gallery-photo")).toHaveCount(24);
  await request.post("/__fixture", {
    data: data.map((d) =>
      d._type === "journalEntry" ? { ...d, photoRightsConfirmed: false } : d,
    ),
  });
  await page.goto("/updates/preview-story");
  await expect(page.locator(".journal-article-photo")).toHaveCount(1);
  await expect(page.locator(".event-detail-gallery figure")).toHaveCount(23);
  await request.post("/__fixture", {
    data: data.filter((d) => d._type !== "journalEntry"),
  });
  expect((await request.get("/updates/preview-story")).status()).toBe(404);
  await page.goto("/gallery");
  await expect(
    page.getByRole("link", { name: "Read Preview story", exact: true }),
  ).toHaveCount(0);
});

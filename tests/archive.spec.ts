import { expect, test } from "@playwright/test";

test("original albums, timeline dates and date navigation work at each viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/gallery");
  const timeline = page.getByRole("button", { name: "Timeline", exact: true });
  const albums = page.getByRole("button", { name: "Albums", exact: true });
  await expect(albums).toHaveAttribute("aria-pressed", "true");
  const diwali = page.getByRole("link", { name: /Diwali Celebrations/ });
  await expect(diwali).toContainText("2 photographs");
  await expect(diwali).toContainText("October 16, 2025");
  await diwali.click();
  await expect(page).toHaveURL(
    /collection=journal-collection\.journal\.event\.diwali-celebrations-2025/,
  );
  await expect(
    page.getByRole("link", { name: "Read the Update" }),
  ).toBeVisible();
  await expect(page.locator(".gallery-photo")).toHaveCount(2);
  await timeline.click();
  await expect(timeline).toHaveAttribute("aria-pressed", "true");
  const monthJump = page.getByLabel("Jump to archive month");
  await expect(monthJump).toHaveValue("2025-12");
  const monthKeys = await monthJump
    .locator("option")
    .evaluateAll((nodes) =>
      nodes
        .map((node) => (node as HTMLOptionElement).value)
        .filter((key) => key !== "undated"),
    );
  expect(monthKeys.length).toBeGreaterThan(1);
  expect(monthKeys).toEqual([...new Set(monthKeys)].sort().reverse());
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(
    page.getByRole("table", { name: "November 2025" }),
  ).toBeVisible();
  await page.getByLabel("Month", { exact: true }).selectOption("10");
  await page
    .getByRole("button", { name: /October 16, 2025, photographs available/ })
    .press("Enter");
  await expect(
    page.getByRole("heading", { name: "October 16, 2025", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".gallery-photo")).toHaveCount(2);
  await page.getByLabel("Jump to a date").selectOption("2025-12-08");
  await expect(page.locator(".gallery-photo")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear date" }).click();
  await expect(monthJump).toHaveValue("2025-12");
  await expect(
    page.locator(".archive-date-group time").first(),
  ).toHaveAttribute("datetime", "2025-12-08");
  await page.getByLabel("Jump to a date").selectOption("2025-10-16");
  await expect(monthJump).toHaveValue("2025-10");
  await page.getByLabel("Category").selectOption("Celebrations");
  await expect(monthJump).toHaveValue("2025-12");
  await expect(monthJump.locator('option[value="2025-10"]')).toHaveCount(1);
  await expect(page.getByLabel("Jump to a date")).toHaveValue("");
  await page.getByLabel("Category").selectOption("All moments");
  await expect(monthJump).toHaveValue("2025-12");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await albums.click();
  await expect(
    page.getByRole("heading", { name: /Diwali Celebrations/ }),
  ).toBeVisible();
});

test("the official artwork loads in navigation, footer and mobile menu", async ({
  page,
}, info) => {
  await page.goto("/gallery");
  const logo = /musical-vibes-foundation-mark\.webp/;
  const rendered = [
    page.locator(".site-header .brand img"),
    page.locator(".footer-brand img"),
  ];
  if (info.project.name === "mobile") {
    await page.locator(".menu-toggle").click();
    rendered.push(page.locator("#menu-title img"));
  }
  for (const img of rendered) {
    await expect(img).toHaveAttribute("src", logo);
    await img.evaluate((node) => {
      (node as HTMLImageElement).loading = "eager";
    });
    await expect
      .poll(() =>
        img.evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    const dimensions = await img.boundingBox();
    expect(dimensions!.width).toBeCloseTo(dimensions!.height, 0);
  }
});

test("an image request failure displays an accessible replacement", async ({
  page,
}) => {
  await page.route(
    (url) =>
      url.pathname === "/_next/image" &&
      (url.searchParams.get("url")?.startsWith("/assets/curated/") ?? false),
    (route) => route.abort(),
  );
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Timeline", exact: true }).click();
  const first = page.locator(".gallery-photo").first();
  await first.scrollIntoViewIfNeeded();
  await expect(
    first.getByRole("img", { name: "Photograph unavailable" }),
  ).toBeVisible();
  await expect(first.locator("img")).toHaveCount(0);
});

test("the Craft tunnel travels, settles, and opens the shared lightbox", async ({
  page,
}) => {
  await page.goto("/gallery#archive");
  await page.getByRole("button", { name: "Timeline", exact: true }).click();
  const stage = page.getByRole("region", { name: "Archive photo tunnel" });
  const jump = page.getByLabel("Jump to archive month");
  const slider = page.getByRole("slider", { name: "Timeline month" });
  await expect(stage.locator(".ia-layer.is-settled")).toHaveCount(1);
  await slider.press("ArrowDown");
  await expect(jump).not.toHaveValue("2025-12");
  await stage.press("End");
  await expect(stage.locator(".ia-layer.is-settled")).toHaveCount(1);
  expect(await stage.locator(".ia-layer").count()).toBeLessThanOrEqual(5);
  await jump.selectOption("2025-10");
  await expect(stage.locator(".ia-layer.is-settled .ia-title")).toHaveText(
    /October 2025/,
  );
  const first = stage
    .getByRole("button", { name: /Open featured photograph/ })
    .first();
  await first.click();
  const lightbox = page.getByRole("dialog");
  await expect(lightbox).toBeVisible();
  await expect(
    lightbox.getByRole("button", { name: "Close photograph" }),
  ).toBeFocused();
  await expect(lightbox.locator(".lightbox-caption span")).toHaveText("1 / 3");
  await page.keyboard.press("ArrowRight");
  await expect(lightbox.locator(".lightbox-caption span")).toHaveText("2 / 3");
  await page.keyboard.press("Escape");
  await expect(lightbox).not.toBeVisible();
  await expect(first).toBeFocused();
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, Math.max(0, box.y) + 20);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 240);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before);
  await expect(jump).toHaveValue("2025-10");
});

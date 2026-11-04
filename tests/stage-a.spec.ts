import { expect, test } from "@playwright/test";
import { content } from "../src/data/content";

test("Stage A renders real content, WebGL and a functioning motion control", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator(".scene-ready")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".symphony-photo img")).toBeVisible();
  await expect(page.locator("input[type=range]")).toHaveCount(0);
  const pause = page.getByRole("button", { name: "Pause sculpture motion" });
  await pause.click();
  await expect(
    page.getByRole("button", { name: "Resume sculpture motion" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Resume sculpture motion" }).click();
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await page.locator(".symphony-story-link").click();
  await expect(page).toHaveURL(/#our-story$/);
  await expect(page.locator("#story-title")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("navigation supports keyboard dismissal and preserves program links", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const desktop = info.project.name === "desktop";
  const toggle = page.getByRole("button", {
    name: desktop ? "Program pages" : "Menu",
    exact: desktop,
  });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  if (desktop) {
    for (const program of content.programs) {
      await expect(
        page.locator(`#program-submenu a[href='/programs/${program.slug}']`),
      ).toBeVisible();
    }
    await page.locator(".program-menu-links a").first().click();
    await expect(page).toHaveURL(/\/programs\/healing-through-music$/);
  } else {
    await page
      .locator("#mobile-menu")
      .getByRole("link", { name: "Programs", exact: true })
      .click();
    await expect(page).toHaveURL(/\/programs$/);
    await expect(page.locator("#mobile-menu")).not.toBeVisible();
  }
});

test("reduced motion has a complete poster, including preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".sculpture-fallback")).toBeVisible();
  await expect(page.getByText("Still artwork · reduced motion")).toBeVisible();
  await expect(page.locator("h1")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".scene-ready")).toBeVisible({ timeout: 30000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("WebGL unavailable keeps the photography, story and primary action", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl") || type === "experimental-webgl")
        return null;
      return getContext.apply(this, [type, ...args] as Parameters<
        typeof getContext
      >);
    } as typeof getContext;
  });
  await page.goto("/");
  await expect(page.getByText("Still artwork · 3D unavailable")).toBeVisible();
  await expect(page.locator(".symphony-photo img")).toBeVisible();
  await expect(page.locator(".story-main-photo img")).toBeAttached();
  await page
    .getByRole("link", { name: "Find your rhythm", exact: true })
    .click();
  await expect(page).toHaveURL(/\/programs$/);
});

test("existing pages, program routes and SEO foundations remain intact", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/about",
    "/programs",
    "/events",
    "/gallery",
    "/get-involved",
    "/contact",
    "/faq",
    ...content.programs.map((p) => `/programs/${p.slug}`),
    ...content.events.map((e) => `/events/${e.slug}`),
  ]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S/,
    );
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(new URL(canonical!).href).toBe(
      new URL(`https://www.musicalvibesfoundation.com${route}`).href,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      route,
    ).toBe(false);
  }
});

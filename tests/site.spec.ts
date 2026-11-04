import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const mainRoutes = [
  "/",
  "/about",
  "/programs",
  "/events",
  "/gallery",
  "/get-involved",
  "/contact",
  "/faq",
];
const programSlugs = [
  "healing-through-music",
  "meditation-and-yoga",
  "senior-engagement-activities",
  "nutrition-and-health-guidance",
  "online-workshops-and-talks",
  "food-drives-for-the-needy",
];
const eventSlugs = [
  "seniors-club-christmas-2025",
  "diwali-celebrations-2025",
  "seniors-club-picnic-2025",
];
const routes = [
  ...mainRoutes,
  ...programSlugs.map((slug) => "/programs/" + slug),
  ...eventSlugs.map((slug) => "/events/" + slug),
];

test("every route has readable content, correct metadata, and no horizontal overflow", async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`${message.text()} ${message.location().url}`);
  });
  await mkdir("docs/validation/release2", { recursive: true });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toContainText(/\S/);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(new URL(canonical!).href).toBe(
      new URL("https://www.musicalvibesfoundation.com" + route).href,
    );
    expect(
      await page.locator('meta[name="description"]').getAttribute("content"),
    ).toBeTruthy();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow, route + " horizontal overflow").toBe(false);
    const badAlt = await page.locator("img:not([alt])").count();
    expect(badAlt, route + " image alternatives").toBe(0);
    if (
      [
        "/",
        "/about",
        "/programs",
        "/events",
        "/gallery",
        "/get-involved",
        "/contact",
        "/faq",
        "/programs/healing-through-music",
        "/events/diwali-celebrations-2025",
      ].includes(route)
    ) {
      if (route === "/")
        await expect(
          page.locator(
            '.scene-ready, .sound-sculpture:has-text("3D unavailable")',
          ),
        ).toBeVisible({ timeout: 30000 });
      await page.locator("img").evaluateAll(async (images) => {
        await Promise.all(
          images.map(async (image) => {
            (image as HTMLImageElement).loading = "eager";
            await (image as HTMLImageElement).decode();
          }),
        );
      });
      await page.screenshot({
        path: `docs/validation/release2/${testInfo.project.name}-${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}.jpg`,
        quality: 82,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
  expect(errors).toEqual([]);
});

test("navigation, keyboard focus, and program routes", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  if (testInfo.project.name === "desktop") {
    const toggle = page.getByRole("button", {
      name: "More",
      exact: true,
    });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page
      .locator("#program-submenu")
      .getByRole("link", { name: /Healing Through Music/ })
      .click();
    await expect(page).toHaveURL(/\/programs\/healing-through-music$/);
  } else {
    const toggle = page.getByRole("button", { name: "Menu", exact: false });
    await toggle.click();
    const dialog = page.locator("#mobile-menu");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await dialog.getByRole("link", { name: "Programs", exact: true }).click();
    await expect(page).toHaveURL(/\/programs$/);
    await expect(dialog).not.toBeVisible();
  }
  await page.goto("/programs");
  for (const slug of programSlugs)
    await expect(
      page.locator(`.program-index a[href="/programs/${slug}"]`),
    ).toHaveCount(1);
  await page.locator(".program-index a").first().focus();
  await expect(page.locator(".program-preview")).toContainText(
    "Find a little joy",
  );
  await page.locator(".brand").click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
});

test("gallery filters, lightbox keyboard controls, and focus restoration", async ({
  page,
}) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Music", exact: true }).click();
  await expect(page.locator(".gallery-photo")).toHaveCount(2);
  const opener = page.locator(".gallery-photo > button").first();
  await opener.click();
  const dialog = page.locator(".lightbox");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".lightbox-caption")).toContainText("1 / 2");
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator(".lightbox-caption")).toContainText("2 / 2");
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.locator(".lightbox-caption")).toContainText("1 / 2");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.getByRole("button", { name: "All moments", exact: true }).click();
  await expect(page.locator(".gallery-photo")).toHaveCount(12);
});

test("contact validation prepares an email without sending anything", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Prepare my email" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.locator("#contact-name")).toBeFocused();
  await page.locator("#contact-name").fill("Local QA");
  await page.locator("#contact-email").fill("qa@example.com");
  await page
    .locator("#contact-message")
    .fill("A local validation test. Please do not send.");
  await page.getByRole("button", { name: "Prepare my email" }).click();
  await expect(page.locator(".form-result")).toContainText(
    "Nothing has been sent.",
  );
  await expect(
    page.getByRole("link", { name: "Open my email draft" }),
  ).toHaveAttribute("href", /^mailto:meenumalik77@gmail.com\?subject=/);
});

test("FAQ search and keyboard accordion", async ({ page }) => {
  await page.goto("/faq");
  await page.getByLabel("Find an answer").fill("donation");
  await expect(page.locator(".faq-list details")).toHaveCount(1);
  await page.locator("summary").press("Enter");
  await expect(page.locator("details[open]")).toContainText("not enabled");
  await page.getByLabel("Find an answer").fill("zzzz-no-answer");
  await expect(page.locator(".empty-search")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator(".faq-list details")).toHaveCount(7);
});

test("reduced motion uses still artwork and never hides content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".sculpture-fallback")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByText("Still artwork · reduced motion")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("3D initializes without shader errors and offers pause controls", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "One actual WebGL initialization check; responsive structure is covered separately.",
  );
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator(".scene-ready")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "Pause sculpture motion" }).click();
  await expect(
    page.getByRole("button", { name: "Resume sculpture motion" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: "docs/validation/release2/desktop-home-3d.png",
    animations: "disabled",
  });
  expect(
    errors.filter((error) => /shader|THREE|WebGL|hydration/i.test(error)),
  ).toEqual([]);
});

test("WebGL failure preserves artwork and navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByText("Still artwork · 3D unavailable")).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator(".sculpture-fallback")).toBeVisible();
  await page
    .getByRole("link", { name: "Find your rhythm", exact: true })
    .click();
  await expect(page).toHaveURL(/\/programs$/);
});

import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { content } from "../src/data/content";
import { journalSeed } from "../src/lib/journal";

test("UI source cannot reintroduce font-rendered navigation arrows", ({}, info) => {
  test.skip(
    !["desktop", "chromium-desktop"].includes(info.project.name),
    "Run the source check once",
  );
  const offenders: string[] = [];
  function audit(directory: string) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, item.name);
      if (item.isDirectory()) audit(path);
      else if (/\.(tsx|css)$/.test(path)) {
        // These are literal keyboard-key names in prose, not decorative icons.
        const source = readFileSync(path, "utf8").replace(
          "Use \u2190 and \u2192 to explore. Press Escape to close.",
          "",
        );
        if (
          /[\u2190-\u21ff\u27a1\u2934\u2935\u2b05-\u2b07]|\\u\{?219[0-9a-f]|\\219[0-9a-f]|&(?:nearr|rarr|larr|uarr|darr|#8599|#x2197);/iu.test(
            source,
          )
        )
          offenders.push(path);
      }
    }
  }
  audit("src/app");
  audit("src/components");
  expect(offenders).toEqual([]);
});

test("SVG arrows retain dimensions, colour and alignment across public pages", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/about",
    "/programs",
    `/programs/${content.programs[0].slug}`,
    "/events",
    `/events/${content.events[0].slug}`,
    "/gallery",
    `/gallery?collection=journal-collection.${journalSeed[0].id}`,
    "/updates",
    `/updates/${journalSeed[0].slug}`,
    "/get-involved",
    "/contact",
    "/faq",
  ]) {
    expect((await page.goto(route))?.status(), route).toBe(200);
    const issues = await page.evaluate(() => {
      const problems: string[] = [];
      if (document.documentElement.scrollWidth > innerWidth)
        problems.push("horizontal overflow");
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (
          !node.parentElement?.closest("script, style, .lightbox-help") &&
          /[\u2190-\u21ff\u27a1\u2934\u2935\u2b05-\u2b07]/u.test(
            node.textContent || "",
          )
        )
          problems.push("font arrow in UI text");
      }
      for (const icon of document.querySelectorAll<SVGSVGElement>(
        ".arrow-icon",
      )) {
        if (
          icon.getAttribute("aria-hidden") !== "true" ||
          icon.getAttribute("focusable") !== "false"
        )
          problems.push("decorative icon accessibility");
        if (icon.getAttribute("stroke") !== "currentColor")
          problems.push("non-inherited stroke");
        const box = icon.getBoundingClientRect();
        if (!box.width || !box.height) continue; // Closed menus/dialogs have no rendered box.
        if (Math.abs(box.width - box.height) > 1 || box.width < 8)
          problems.push("incorrect SVG dimensions");
        const parent = icon.closest("a, button");
        if (parent) {
          const target = parent.getBoundingClientRect();
          if (
            box.left < target.left - 2 ||
            box.right > target.right + 2 ||
            box.top < target.top - 2 ||
            box.bottom > target.bottom + 2
          )
            problems.push(
              `icon outside ${parent.className || parent.textContent?.trim()}`,
            );
        }
      }
      return problems;
    });
    expect(issues, `${info.project.name}: ${route}`).toEqual([]);
    await expect(page.locator("svg.arrow-icon").first()).toHaveAttribute(
      "viewBox",
      "0 0 24 24",
    );
  }
});

test("arrow links, mobile menu and photo controls keep their labels and hit areas", async ({
  page,
  isMobile,
}, info) => {
  await page.goto("/");
  if (isMobile) {
    const menu = page.getByRole("button", { name: "Menu", exact: false });
    await menu.click();
    const link = page.locator('#mobile-menu a[href="/get-involved"]');
    await expect(link.locator("svg.arrow-icon")).toBeVisible();
    const target = await link.boundingBox();
    expect(target!.height).toBeGreaterThanOrEqual(44);
    const clipped = await page
      .locator("#mobile-menu .arrow-icon")
      .evaluateAll((icons) =>
        icons.some((icon) => {
          const box = icon.getBoundingClientRect();
          if (!box.width) return false;
          const link = icon.closest("a")!.getBoundingClientRect();
          return (
            box.left < link.left - 1 ||
            box.right > link.right + 1 ||
            box.top < link.top - 1 ||
            box.bottom > link.bottom + 1
          );
        }),
      );
    expect(clipped).toBe(false);
    await page.screenshot({
      path: `docs/validation/icons/${info.project.name}-menu.png`,
    });
    await link.click();
    await expect(page).toHaveURL(/\/get-involved$/);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  } else {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page
      .locator('.program-menu-links a[href^="/programs/"]')
      .first()
      .click();
    await expect(page).toHaveURL(/\/programs\/.+/);
  }
  await page.goto("/programs");
  const program = page.locator(".program-row").first();
  await expect(program.locator("svg.arrow-icon")).toBeVisible();
  await program.click();
  await expect(page).toHaveURL(/\/programs\/.+/);
  await page.goto("/gallery");
  await page.locator(".gallery-photo button").first().click();
  const next = page.getByRole("button", {
    name: "Next photograph",
    exact: true,
  });
  await expect(next.locator("svg.arrow-icon")).toBeVisible();
  const target = await next.boundingBox();
  expect(target!.width).toBeGreaterThanOrEqual(44);
  expect(target!.height).toBeGreaterThanOrEqual(44);
  await next.click();
  await expect(page.locator(".lightbox-caption")).toContainText("2 / 12");
  await page
    .getByRole("button", { name: "Previous photograph", exact: true })
    .click();
  await expect(page.locator(".lightbox-caption")).toContainText("1 / 12");
  await page.keyboard.press("Escape");
  await expect(page.locator(".gallery-photo button").first()).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const memory = page.getByRole("button", { name: "Next memory", exact: true });
  await memory.scrollIntoViewIfNeeded();
  const memoryTarget = await memory.boundingBox();
  expect(memoryTarget!.width).toBeGreaterThanOrEqual(43);
  expect(memoryTarget!.height).toBeGreaterThanOrEqual(43);
  await memory.click();
  await expect(page.locator(".memory-controls > span")).toContainText("02");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".sculpture-fallback")).toBeVisible();
  await page.screenshot({
    path: `docs/validation/icons/${info.project.name}.png`,
  });
});

import { expect, test } from "@playwright/test";

test("premium program story pins on desktop and stays in flow on smaller screens", async ({
  page,
}, info) => {
  await page.goto("/");
  const cards = page.locator(".journey-card");
  await expect(cards).toHaveCount(3);
  expect(
    await cards.first().evaluate((el) => getComputedStyle(el).position),
  ).toBe(info.project.name === "desktop" ? "sticky" : "relative");
  if (info.project.name === "desktop") {
    const positions = await cards.evaluateAll((items) =>
      items.map((el) => el.getBoundingClientRect().top + scrollY),
    );
    await page.evaluate(
      (top) => scrollTo({ top: top - 136, behavior: "instant" }),
      positions[1],
    );
    await page.waitForTimeout(1000);
    expect(
      await cards
        .first()
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    ).toBeGreaterThanOrEqual(110);
    expect(
      await cards
        .nth(1)
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    ).toBeLessThanOrEqual(145);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => cards.first().evaluate((el) => getComputedStyle(el).position))
    .toBe("relative");
  await expect(page.locator(".journey-card a")).toHaveCount(3);
  await page.locator(".journey-card a").nth(1).click();
  await expect(page).toHaveURL(/\/programs\/meditation-and-yoga$/);
});

test("premium community album supports buttons, keyboard and reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const front = page.locator('.memory-card[aria-hidden="false"]');
  await expect(front).toContainText("Diwali celebrations");
  await page.getByRole("button", { name: "Next memory" }).click();
  await expect(front).toContainText("August 2025");
  await page.getByRole("button", { name: "Previous memory" }).press("Enter");
  await expect(front).toContainText("Diwali celebrations");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Previous memory" }).click();
  await expect(front).toContainText("December 2025");
  expect(
    await front.evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await front.getByRole("link").click();
  await expect(page).toHaveURL(/\/gallery$/);
});

test("premium navigation offers six program routes and visible chapter state", async ({
  page,
}, info) => {
  await page.goto("/about");
  await expect(page.locator('.desktop-nav a[href="/about"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator(".intro-photograph img")).toBeVisible();
  if (info.project.name !== "desktop") {
    await page.getByRole("button", { name: "Menu", exact: false }).click();
    await page.locator(".mobile-programs summary").click();
    await expect(page.locator(".mobile-programs a")).toHaveCount(6);
    await page.locator(".mobile-programs a").last().click();
    await expect(page).toHaveURL(/\/programs\/food-drives-for-the-needy$/);
    await expect(page.locator("#mobile-menu")).not.toBeVisible();
  } else {
    const toggle = page.getByRole("button", {
      name: "More",
      exact: true,
    });
    await toggle.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".program-menu-links a").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
  }
});

test("premium gallery, contact validation and FAQ preserve real interactions", async ({
  page,
}) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Music", exact: true }).click();
  await expect(page.locator(".gallery-photo")).toHaveCount(2);
  const opener = page.locator(".gallery-photo button").first();
  await opener.click();
  await expect(page.locator(".lightbox[open]")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".lightbox-caption")).toContainText("2 / 2");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await page.goto("/contact");
  await page.getByRole("button", { name: "Prepare my email" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.locator("#contact-name")).toBeFocused();
  await page.goto("/faq");
  await page.getByLabel("Find an answer").fill("donation");
  await expect(page.locator(".faq-list details")).toHaveCount(1);
  await page.locator(".faq-list summary").press("Enter");
  await expect(page.locator(".faq-list details[open]")).toBeVisible();
});

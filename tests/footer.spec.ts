import { test, expect } from "@playwright/test";

test("footer credit stays accessible and contained at each viewport", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const credit = footer.locator(".footer-credit");
  await credit.scrollIntoViewIfNeeded();
  await expect(credit).toContainText(
    "Thoughtfully designed & developed by Jash Sojitra",
  );
  await expect(
    footer.getByRole("navigation", { name: "Explore the foundation" }),
  ).toBeVisible();
  await expect(footer.locator(".footer-bottom")).toContainText("©");

  const profiles = credit.getByRole("navigation", { name: "Developer profiles" });
  const linkedin = profiles.getByRole("link", { name: /LinkedIn/ });
  const github = profiles.getByRole("link", { name: /GitHub/ });
  for (const [link, url] of [
    [linkedin, "https://www.linkedin.com/in/jashsojitra/"],
    [github, "https://github.com/JashSojitra"],
  ] as const) {
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await linkedin.focus();
  await expect(linkedin).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(github).toBeFocused();
  expect(
    await github.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe("solid");

  const bounds = await credit.boundingBox();
  const bottom = await footer.locator(".footer-bottom").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bottom).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(bottom!.y + bottom!.height);
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});

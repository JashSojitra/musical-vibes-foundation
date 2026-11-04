import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const directory = "docs/validation/navigation-final";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const results = [];
try {
  for (const width of [1440, 1024, 768, 390, 360]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      hasTouch: width < 1100,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto("http://127.0.0.1:3000/journal", {
      waitUntil: "networkidle",
    });
    await page.screenshot({ path: `${directory}/${width}-header.png` });
    const desktop = await page.locator(".desktop-nav").isVisible();
    if (desktop)
      await page.getByRole("button", { name: "More", exact: true }).click();
    else {
      await page.getByRole("button", { name: "Menu" }).tap();
      await page.screenshot({ path: `${directory}/${width}-mobile-menu.png` });
      await page.locator(".mobile-programs summary").tap();
      await page.locator(".mobile-programs").scrollIntoViewIfNeeded();
    }
    if (desktop)
      await page
        .locator("#program-submenu img")
        .evaluate((image) => image.decode());
    await page.screenshot({ path: `${directory}/${width}-more.png` });
    const bounds = await page
      .locator(desktop ? "#program-submenu" : ".mobile-programs")
      .boundingBox();
    results.push({
      width,
      desktop,
      bounds,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      errors,
    });
    await page.keyboard.press("Escape");
    if (desktop && width === 1024) {
      // A touch-enabled laptop still uses the desktop disclosure if visible.
      await page.getByRole("button", { name: "More", exact: true }).tap();
      if (
        (await page
          .getByRole("button", { name: "More", exact: true })
          .getAttribute("aria-expanded")) !== "true"
      )
        throw new Error("Touch disclosure failed");
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  `${directory}/capture-results.json`,
  JSON.stringify(results, null, 2) + "\n",
);
console.log(JSON.stringify(results, null, 2));
if (
  results.some(
    (item) =>
      item.errors.length ||
      item.overflow ||
      item.bounds.x < 0 ||
      item.bounds.x + item.bounds.width > item.width,
  )
)
  process.exitCode = 1;

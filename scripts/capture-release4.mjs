import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const dir = "docs/validation/release4";
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
for (const width of [1440, 768, 390, 360]) {
  const page = await browser.newPage({
    viewport: { width, height: width < 700 ? 844 : 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  for (const [name, route] of [
    ["home", "/"],
    ["journal", "/journal"],
    ["article", "/journal/diwali-celebrations-2025"],
    [
      "gallery",
      "/gallery?collection=journal-collection.journal.event.diwali-celebrations-2025",
    ],
    ["events", "/events"],
    ["contact", "/contact"],
  ]) {
    await page.goto("http://127.0.0.1:3000" + route, {
      waitUntil: "networkidle",
    });
    await page.locator("img").evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (img) => {
          img.loading = "eager";
          await img.decode();
        }),
      );
    });
    await page.waitForTimeout(400);
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      errors.push(`Horizontal overflow: ${route}`);
    await page.screenshot({ path: `${dir}/${width}-${name}.png` });
    if (name === "home") {
      if (width === 1440)
        await page.getByRole("button", { name: "More", exact: true }).click();
      else {
        await page.getByRole("button", { name: "Menu", exact: false }).click();
        await page.locator(".mobile-programs summary").click();
      }
      await page.screenshot({ path: `${dir}/${width}-more.png` });
      await page.keyboard.press("Escape");
      await page
        .locator(".journal-preview")
        .screenshot({ path: `${dir}/${width}-home-journal.png` });
    }
    if (name === "events")
      await page
        .locator(".event-archive")
        .screenshot({ path: `${dir}/${width}-events-gallery.png` });
    if (name === "gallery")
      await page
        .locator(".selected-collection")
        .screenshot({ path: `${dir}/${width}-collection.png` });
    if (name === "journal" || name === "article")
      await page.screenshot({
        path: `${dir}/${width}-${name}-full.png`,
        fullPage: true,
      });
  }
  results.push({
    width,
    errors,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  });
  await page.close();
}
await writeFile(
  `${dir}/capture-results.json`,
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
await browser.close();

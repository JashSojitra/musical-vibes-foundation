import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ||
    (existsSync(chrome) ? chrome : undefined),
});
const directory = "docs/validation/migration";
await mkdir(directory, { recursive: true });
const findings = [];
try {
  for (const [target, base] of [
    ["next16", "http://127.0.0.1:3000"],
    ["opennext", "http://127.0.0.1:3002"],
  ]) {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({
        viewport: { width, height: width === 1440 ? 1000 : 844 },
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      const capture = (name) =>
        page.screenshot({
          path: `${directory}/${target}-${width}-${name}.png`,
        });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator(".scene-ready").waitFor({ timeout: 30000 });
      await page.waitForTimeout(800);
      await capture("hero-frame-1");
      await page.waitForTimeout(1200);
      await capture("hero-frame-2");
      await page
        .getByRole("button", { name: "Pause sculpture motion" })
        .click();
      await page.locator(".symphony-story-link").click();
      await page.waitForTimeout(800);
      await capture("story");
      for (const [name, route] of [
        ["journal", "/journal"],
        [
          "gallery",
          "/gallery?collection=journal-collection.journal.event.diwali-celebrations-2025",
        ],
        ["contact", "/contact"],
      ]) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        await page.locator("img").evaluateAll(async (images) => {
          for (const image of images) image.loading = "eager";
          await Promise.all(images.map((image) => image.decode()));
        });
        await capture(name);
        if (name === "journal") {
          if (width === 1440)
            await page
              .getByRole("button", { name: "More", exact: true })
              .click();
          else await page.getByRole("button", { name: "Menu" }).click();
          await capture("navigation");
          await page.keyboard.press("Escape");
        }
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(base, { waitUntil: "networkidle" });
      await capture("reduced-motion");
      findings.push({
        target,
        width,
        errors,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(
  `${directory}/captures.json`,
  JSON.stringify(findings, null, 2) + "\n",
);
console.log(JSON.stringify(findings, null, 2));
if (findings.some((item) => item.errors.length || item.overflow))
  process.exitCode = 1;

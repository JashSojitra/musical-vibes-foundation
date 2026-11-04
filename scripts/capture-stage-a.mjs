import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = "docs/validation/release3-stage-a";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const findings = [];
for (const width of [1440, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: width === 1440 ? 1000 : 844 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const response = await page.goto("http://127.0.0.1:3000/", {
    waitUntil: "networkidle",
  });
  await page.locator(".scene-ready").waitFor({ timeout: 30000 });
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (img) => {
        img.loading = "eager";
        await img.decode();
      }),
    );
  });
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(i === 0 ? 1000 : 1800);
    await page.screenshot({ path: `${out}/${width}-hero-frame-${i}.png` });
  }
  await page.evaluate(() =>
    scrollTo({
      top: document.querySelector("#our-story").offsetTop - 76,
      behavior: "instant",
    }),
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${width}-story.png` });
  for (const progress of [0.25, 0.5, 0.75]) {
    await page.evaluate((p) => {
      const s = document.querySelector("#our-story");
      scrollTo(0, s.offsetTop + s.offsetHeight * p - innerHeight * 0.4);
    }, progress);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${out}/${width}-scroll-${progress}.png` });
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Pause sculpture motion" }).click();
  await page.screenshot({ path: `${out}/${width}-paused.png` });
  await page
    .locator(".living-symphony")
    .screenshot({ path: `${out}/${width}-stage-a.png` });
  if (width === 1440) {
    await page
      .getByRole("button", { name: "Program pages", exact: true })
      .click();
    await page.screenshot({ path: `${out}/${width}-navigation.png` });
    await page.keyboard.press("Escape");
  } else {
    await page.getByRole("button", { name: "Menu", exact: false }).click();
    await page.screenshot({ path: `${out}/${width}-navigation.png` });
    await page.keyboard.press("Escape");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${width}-reduced.png` });
  await page
    .locator(".living-symphony")
    .screenshot({ path: `${out}/${width}-stage-a-poster.png` });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  findings.push({ width, status: response.status(), overflow, errors });
  await page.close();
}
await writeFile(
  `${out}/capture-results.json`,
  JSON.stringify(findings, null, 2),
);
console.log(JSON.stringify(findings, null, 2));
await browser.close();

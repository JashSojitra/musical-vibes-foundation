import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const dir = "docs/validation/release3-premium";
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const results = [];
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 1000 },
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
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
  await page.locator(".scene-ready").waitFor({ timeout: 30000 });
  await page.locator("img").evaluateAll(async (imgs) => {
    await Promise.all(
      imgs.map(async (img) => {
        img.loading = "eager";
        await img.decode();
      }),
    );
  });
  await page.waitForTimeout(1000);
  const journeyPositions = await page
    .locator(".journey-card")
    .evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().top + scrollY),
    );
  await page.screenshot({ path: `${dir}/${width}-hero.png` });
  await page.getByRole("button", { name: "Pause sculpture motion" }).click();
  if (width === 1440)
    await page
      .getByRole("button", { name: "Program pages", exact: true })
      .click();
  else await page.getByRole("button", { name: "Menu", exact: false }).click();
  await page.screenshot({ path: `${dir}/${width}-navigation.png` });
  await page.keyboard.press("Escape");
  for (const [name, selector] of [
    ["story", "#our-story"],
    ["journey", "#journey"],
    ["memories", "#memories"],
  ]) {
    await page.evaluate(
      (sel) =>
        scrollTo({
          top:
            document.querySelector(sel).getBoundingClientRect().top +
            scrollY -
            110,
          behavior: "instant",
        }),
      selector,
    );
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${dir}/${width}-${name}.png` });
    await page
      .locator(selector)
      .screenshot({ path: `${dir}/${width}-${name}-full.png` });
  }
  if (width === 1440) {
    for (let i = 0; i < 3; i++) {
      await page.evaluate(
        (top) => scrollTo({ top: top - 140, behavior: "instant" }),
        journeyPositions[i],
      );
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${dir}/${width}-journey-step-${i}.png` });
    }
  }
  await page.locator("#memories").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Next memory" }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/${width}-memories-next.png` });
  await page.getByRole("button", { name: "Next memory" }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/${width}-memories-last.png` });
  if (width === 390)
    await page.screenshot({
      path: `${dir}/390-homepage-full.png`,
      fullPage: true,
    });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  for (const route of [
    "about",
    "programs",
    "gallery",
    "contact",
    "events",
    "get-involved",
    "faq",
    "programs/healing-through-music",
  ]) {
    await page.goto(`http://127.0.0.1:3000/${route}`, {
      waitUntil: "networkidle",
    });
    await page.locator("img").evaluateAll(async (imgs) => {
      await Promise.all(
        imgs.map(async (img) => {
          img.loading = "eager";
          await img.decode();
        }),
      );
    });
    await page.waitForTimeout(700);
    await page.screenshot({
      path: `${dir}/${width}-${route.replaceAll("/", "-")}.png`,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/${width}-reduced.png` });
  results.push({ width, overflow, errors });
  await page.close();
}
await writeFile(
  `${dir}/capture-results.json`,
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
await browser.close();

import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("responsive image endpoint transforms the requested width and rejects unsupported quality", async ({
  request,
}) => {
  const image =
    "/_next/image?url=%2Fassets%2Fcurated%2Fcommunity-picnic.webp&w=640&q=75";
  const response = await request.get(image, {
    headers: { Accept: "image/webp" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\//);
  expect((await sharp(await response.body()).metadata()).width).toBe(640);
  expect((await request.get(image.replace("q=75", "q=81"))).status()).toBe(400);
});

test("valid Contact enquiry prepares an email without claiming delivery or posting data", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") submissions.push(request.url());
  });
  await page.goto("/contact?interest=volunteer");
  await page.locator("#contact-name").fill("Migration QA");
  await page.locator("#contact-email").fill("qa@example.com");
  await page
    .locator("#contact-message")
    .fill("I would like to learn about joining a community program.");
  await page.getByRole("button", { name: "Prepare my email" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Nothing has been sent.",
  );
  const draft = await page
    .getByRole("link", { name: "Open my email draft" })
    .getAttribute("href");
  expect(draft).toMatch(/^mailto:/);
  expect(decodeURIComponent(draft!)).toContain("qa@example.com");
  expect(submissions).toEqual([]);
});

test("gallery dialog locks scrolling and restores it on dismissal", async ({
  page,
}) => {
  await page.goto("/gallery");
  const previous = await page
    .locator("body")
    .evaluate((body) => body.style.overflow);
  const opener = page.locator(".gallery-photo button").first();
  await opener.click();
  await expect(page.locator(".lightbox[open]")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect
    .poll(() => page.locator("body").evaluate((body) => body.style.overflow))
    .toBe(previous);
});

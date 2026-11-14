/** Focused component browser fixture. No CMS, mail client, credentials or public assets. */
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createServer } from "node:http";

await mkdir(".tmp", { recursive: true });
const dir = await mkdtemp(resolve(".tmp/owner-preview-"));
const entry = join(dir, "entry.tsx");
await writeFile(
  entry,
  `
import React from 'react';
import {createRoot} from 'react-dom/client';
import ContactForm from '../../src/components/contact-form';
createRoot(document.getElementById('root')).render(<ContactForm email="fixture@example.org" />);
`,
);
const bundle = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  platform: "browser",
  jsx: "automatic",
  tsconfig: "tsconfig.json",
});
const server = createServer((_request, response) => {
  response.setHeader("Content-Type", "text/html");
  response.end(
    `<!doctype html><html lang="en"><title>Local contact fixture</title><body><main id="root"></main><script>${bundle.outputFiles[0].text}</script></body></html>`,
  );
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Fixture must never contact a service or open a mail client.
    await page.route("**/*", (route) =>
      new URL(route.request().url()).hostname === "127.0.0.1"
        ? route.continue()
        : route.abort(),
    );
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole("button", { name: "Prepare my email" }).click();
    await page.waitForFunction(
      () => document.activeElement?.id === "contact-name",
    );
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 3);
    await page.getByLabel("Your name").fill("Fixture visitor");
    await page.getByLabel("Email address").fill("visitor@example.org");
    await page
      .getByLabel("Your message")
      .fill("A fixture message with & and ? characters.");
    await page.getByRole("button", { name: "Prepare my email" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("status").waitFor();
    const href = await page
      .getByRole("link", { name: "Open my email draft" })
      .getAttribute("href");
    const draft = new URL(href);
    assert.equal(draft.protocol, "mailto:");
    assert.equal(draft.pathname, "fixture@example.org");
    assert.match(
      draft.searchParams.get("body"),
      /A fixture message with & and \? characters\./,
    );
    await page.getByLabel("Your message").fill("An updated fixture message.");
    assert.equal(await page.getByRole("status").count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    "PASS: contact validation, error focus, keyboard preparation, encoded mail draft and stale-draft clearing at 390/1440px. No message sent; component fixture only.",
  );
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}

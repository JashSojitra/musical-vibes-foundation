import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EditorialBody from "../src/components/editorial-body";
import type { PortableTextBlock } from "@portabletext/types";

test("CMS Portable Text keeps editorial styling and safe links at every viewport", async ({
  page,
}) => {
  const body: PortableTextBlock[] = [
    {
      _type: "block",
      _key: "heading",
      style: "h2",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: "title",
          text: "A story shared together",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "paragraph",
      style: "normal",
      markDefs: [
        { _type: "link", _key: "safe", href: "https://example.org/story" },
        { _type: "link", _key: "unsafe", href: "javascript:alert(1)" },
      ],
      children: [
        {
          _type: "span",
          _key: "one",
          text: "Community music brings people together. ",
          marks: ["strong"],
        },
        { _type: "span", _key: "two", text: "Read our story", marks: ["safe"] },
        {
          _type: "span",
          _key: "three",
          text: " and keep links safe.",
          marks: ["unsafe"],
        },
      ],
    },
    {
      _type: "block",
      _key: "list",
      style: "normal",
      listItem: "bullet",
      level: 1,
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: "item",
          text: "A welcoming place for everyone.",
          marks: [],
        },
      ],
    },
  ];
  const html = renderToStaticMarkup(
    createElement(EditorialBody, { body, paragraphs: [] }),
  );
  await page.goto("/journal/diwali-celebrations-2025");
  // Use the real article container/CSS with SDK-rendered rich content; no live writes are needed.
  const article = page.locator(".journal-article-body > div").first();
  await article.evaluate((element, markup) => {
    element.innerHTML = markup;
  }, html);
  await expect(article.getByRole("heading", { level: 2 })).toHaveText(
    "A story shared together",
  );
  await expect(article.locator("strong")).toContainText("Community music");
  await expect(article.locator("li")).toHaveText(
    "A welcoming place for everyone.",
  );
  await expect(article.getByRole("link")).toHaveCount(1);
  await expect(article.getByRole("link")).toHaveAttribute(
    "href",
    "https://example.org/story",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

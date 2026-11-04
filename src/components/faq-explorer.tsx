"use client";
import ArrowIcon from "@/components/arrow-icon";
import { useState } from "react";
import type { FAQ } from "@/types/content";
export default function FAQExplorer({ items }: { items: FAQ[] }) {
  const [query, setQuery] = useState("");
  const filtered = items.filter((item) =>
    `${item.question} ${item.answer}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="faq-explorer">
      <label htmlFor="faq-search">Find an answer</label>
      <div className="faq-search">
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “join”, “events”, or “volunteer”"
        />
        <span aria-hidden="true">⌕</span>
      </div>
      <p className="faq-count" role="status">
        {filtered.length} {filtered.length === 1 ? "answer" : "answers"}
        {query ? " found" : " to help you get started"}
      </p>
      {filtered.length ? (
        <div className="faq-list">
          {filtered.map((item) => (
            <details key={item.question}>
              <summary>
                <span>{item.question}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div>
                <span className="eyebrow">{item.category}</span>
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="empty-search">
          <h2>Let’s find the answer together.</h2>
          <p>Try another word, or get in touch with the foundation.</p>
          <button className="text-link" onClick={() => setQuery("")}>
            Clear search <ArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}

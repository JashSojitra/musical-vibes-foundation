import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

export default function EditorialBody({
  body,
  paragraphs,
}: {
  body?: PortableTextBlock[];
  paragraphs: string[];
}) {
  return body?.length ? (
    <PortableText
      value={body}
      components={{
        marks: {
          link: ({ value, children }) => {
            const href =
              typeof value?.href === "string" &&
              /^(https?:\/\/|mailto:|tel:|\/)/.test(value.href) &&
              !value.href.startsWith("//") &&
              !value.href.includes("\\")
                ? value.href
                : undefined;
            return href ? <a href={href}>{children}</a> : <>{children}</>;
          },
        },
      }}
    />
  ) : (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

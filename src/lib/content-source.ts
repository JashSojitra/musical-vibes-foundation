import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@sanity/client";
import { content } from "@/data/content";
import { journalSeed } from "@/lib/journal";
import { readSanitySnapshot } from "./sanity-read";

export const getContentSnapshot = cache(async () => {
  // The unconfigured legacy demo stays local. A configured CMS must select a source explicitly.
  const mode =
    process.env.CONTENT_SOURCE ||
    (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ? undefined : "local");
  if (!mode)
    throw new Error(
      "Sanity is configured: set CONTENT_SOURCE explicitly to sanity or local.",
    );
  if (mode === "local") return { source: content, entries: journalSeed };
  if (mode !== "sanity") throw new Error(`Unsupported CONTENT_SOURCE: ${mode}`);
  await connection();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
  if (!projectId || !dataset || !apiVersion)
    throw new Error("Missing public Sanity configuration");
  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    perspective: "published",
    useCdn: false,
  });
  return readSanitySnapshot(client);
});

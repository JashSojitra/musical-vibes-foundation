import type { SanityClient } from "@sanity/client";
import { mapSanity, type CmsDocument } from "./sanity-model";

export async function readSanitySnapshot(client: SanityClient) {
  const { projectId, dataset } = client.config();
  if (!projectId || !dataset)
    throw new Error("Missing Sanity project or dataset");
  const docs = await client.fetch<CmsDocument[]>(
    '*[_type in ["journalEntry", "event", "program", "mediaItem", "siteSettings", "faq"]]{..., "assetExists": defined(image.asset->._id), storyPhotos[]{..., "assetExists": defined(asset->._id)}}',
    {},
    { cache: "no-store", perspective: "published" },
  );
  return mapSanity(docs, projectId, dataset);
}

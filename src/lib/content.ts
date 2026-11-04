import { getContentSnapshot } from "./content-source";
import { permanentRedirect } from "next/navigation";
import { unavailableMedia } from "./media-placeholder";
import type { SiteContent } from "@/types/content";

/** Replace only this adapter with CMS queries later; pages consume stable typed models. */
export async function getSiteContent(): Promise<SiteContent> {
  return (await getContentSnapshot()).source;
}
export async function getPrograms() {
  return (await getSiteContent()).programs;
}
export async function getProgram(slug: string) {
  const items = await getPrograms();
  const item = items.find(
    (item) => item.slug === slug || item.previousSlugs?.includes(slug),
  );
  if (item && item.slug !== slug) permanentRedirect(`/programs/${item.slug}`);
  return item;
}
export async function getEvents() {
  return (await getSiteContent()).events;
}
export async function getEvent(slug: string) {
  const items = await getEvents();
  const item = items.find(
    (item) => item.slug === slug || item.previousSlugs?.includes(slug),
  );
  if (item && item.slug !== slug) permanentRedirect(`/events/${item.slug}`);
  return item;
}
export async function getMedia(id: string) {
  const item = (await getSiteContent()).media.find((item) => item.id === id);
  return item ?? unavailableMedia;
}

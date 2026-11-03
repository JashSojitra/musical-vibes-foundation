import { content } from "@/data/content";
import type { SiteContent } from "@/types/content";

/** Replace only this adapter with CMS queries later; pages consume stable typed models. */
export async function getSiteContent(): Promise<SiteContent> {
  return content;
}
export async function getPrograms() {
  return (await getSiteContent()).programs;
}
export async function getProgram(slug: string) {
  return (await getPrograms()).find((item) => item.slug === slug);
}
export async function getEvents() {
  return (await getSiteContent()).events;
}
export async function getEvent(slug: string) {
  return (await getEvents()).find((item) => item.slug === slug);
}
export async function getMedia(id: string) {
  const item = (await getSiteContent()).media.find((item) => item.id === id);
  if (!item) throw new Error(`Unknown media ID: ${id}`);
  return item;
}

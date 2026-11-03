import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { Invitation, PageIntro } from "@/components/ui";
import GalleryExplorer from "@/components/gallery-explorer";
export const metadata = pageMetadata(
  "The Community Gallery",
  "Real people, shared celebrations, and the moments that connect our community. Explore the Musical Vibes Foundation photo archive.",
  "/gallery",
);
export default async function Gallery() {
  const { media } = await getSiteContent();
  return (
    <>
      <PageIntro
        eyebrow="THE COMMUNITY ARCHIVE"
        title="Connection looks"
        emphasis="good on everyone."
        description="A shared song. A new conversation. A familiar face. A glimpse into life in our community."
        number="04"
      />
      <GalleryExplorer media={media} />
      <p className="gallery-editorial-note wrap">
        These photographs come from the foundation’s original website archive.
        Dates describe past gatherings.
      </p>
      <Invitation title="Picture yourself" emphasis="in good company." />
    </>
  );
}

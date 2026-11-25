import { getPublicContent } from "@/lib/journal";
import { timelineGroups } from "@/lib/archive";
import { pageMetadata } from "@/lib/metadata";
import { Invitation, PageIntro } from "@/components/ui";
import GalleryExplorer from "@/components/gallery-explorer";
export const metadata = pageMetadata(
  "The Community Gallery",
  "Real people, shared celebrations, and the moments that connect our community. Explore the Musical Vibes Foundation photo archive.",
  "/gallery",
);
export default async function Gallery({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const adapter = await getPublicContent();
  const albums = adapter.getArchiveAlbums();
  const query = await searchParams;
  const selected =
    albums.find((album) => album.id === query.collection) ??
    adapter
      .getGalleryCollections()
      .find((album) => album.id === query.collection);
  const timeline = timelineGroups(albums, adapter.getPublicPhotos());
  const introPhoto = timeline[0]?.photos[0];
  return (
    <>
      <PageIntro
        eyebrow="THE COMMUNITY ARCHIVE"
        title="Connection looks"
        emphasis="good on everyone."
        description="A shared song. A new conversation. A familiar face. A glimpse into life in our community."
        number="04"
        artwork={
          introPhoto
            ? {
                src: introPhoto.src,
                alt: introPhoto.alt,
                label: "The community album",
              }
            : null
        }
      />
      <GalleryExplorer
        albums={albums}
        timeline={timeline}
        collection={selected}
        key={selected?.id ?? "all"}
      />
      <p className="gallery-editorial-note wrap">
        Dates reflect when gatherings took place, where recorded.
      </p>
      <Invitation title="Picture yourself" emphasis="in good company." />
    </>
  );
}

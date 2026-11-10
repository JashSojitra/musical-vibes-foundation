import ArrowIcon from "@/components/arrow-icon";
import Link from "next/link";
import { getPublicContent } from "@/lib/journal";
import GalleryPreview from "@/components/gallery-preview";
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
  const collections = adapter.getGalleryCollections();
  const query = await searchParams;
  const selected = collections.find(
    (collection) => collection.id === query.collection,
  );
  const media = selected?.photos ?? adapter.getPublicPhotos();
  const introPhoto =
    adapter.getPublicPhotos().find((photo) => photo.id === "diwali") ??
    adapter.getPublicPhotos()[0];
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
      <section
        className="gallery-stories wrap"
        aria-labelledby="gallery-stories-title"
      >
        <h2 id="gallery-stories-title">
          Every gathering has <em>a story.</em>
        </h2>
        <Link href="/events">See upcoming events</Link>
        <GalleryPreview
          collections={collections.filter((collection) => collection.journalId)}
        />
        {selected ? (
          <div className="selected-collection" id="collection">
            <p className="eyebrow">SELECTED COLLECTION</p>
            <h2>{selected.title}</h2>
            {selected.journalSlug ? (
              <Link href={`/updates/${selected.journalSlug}`}>
                Read the Update <ArrowIcon />
              </Link>
            ) : null}
            {selected.eventSlug ? (
              <Link href={`/events/${selected.eventSlug}`}>Related event</Link>
            ) : null}
            <Link href="/gallery">Show all photographs</Link>
          </div>
        ) : null}
      </section>
      <GalleryExplorer media={media} key={selected?.id ?? "all"} />
      <p className="gallery-editorial-note wrap">
        These photographs come from the foundation’s original website archive.
        Dates describe past gatherings.
      </p>
      <Invitation title="Picture yourself" emphasis="in good company." />
    </>
  );
}

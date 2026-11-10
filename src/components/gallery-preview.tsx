import ArrowIcon from "@/components/arrow-icon";
import Image from "next/image";
import Link from "next/link";
import type { GalleryCollection } from "@/types/content";
import { TextLink } from "./ui";
export const collectionHref = (id: string) =>
  `/gallery?collection=${encodeURIComponent(id)}`;
export default function GalleryPreview({
  collections,
}: {
  collections: GalleryCollection[];
}) {
  return (
    <div className="gallery-archive-preview">
      {collections.length ? (
        <div className="gallery-collection-cards">
          {collections.slice(0, 3).map((collection) => (
            <Link
              href={collectionHref(collection.id)}
              className="gallery-collection-card"
              key={collection.id}
            >
              <div>
                <Image
                  src={collection.photos[0].src}
                  alt={collection.photos[0].alt}
                  fill
                  sizes="(max-width:700px) 88vw, 28vw"
                />
              </div>
              <span>
                <small>
                  {collection.photos.length}{" "}
                  {collection.photos.length === 1
                    ? "photograph"
                    : "photographs"}
                </small>
                <strong>{collection.title}</strong>
                <i aria-hidden="true">
                  <ArrowIcon />
                </i>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
      {collections.map((collection) =>
        collection.journalSlug ? (
          <p key={collection.id}>
            <Link href={`/updates/${collection.journalSlug}`}>
              Read {collection.title}
            </Link>
            {collection.eventSlug ? (
              <>
                {" "}
                ·{" "}
                <Link href={`/events/${collection.eventSlug}`}>
                  Related event
                </Link>
              </>
            ) : null}
          </p>
        ) : null,
      )}
      <TextLink href="/gallery">Explore our memories</TextLink>
    </div>
  );
}

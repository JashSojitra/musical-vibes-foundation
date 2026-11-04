import Image from "next/image";
import Link from "next/link";
import { getPublicContent, journalDate } from "@/lib/journal";
import { pageMetadata } from "@/lib/metadata";
import { Eyebrow, PageIntro, TextLink } from "@/components/ui";
export const metadata = pageMetadata(
  "Community Journal",
  "Community updates and stories from the Musical Vibes Foundation archive.",
  "/journal",
);
export default function Journal() {
  const adapter = getPublicContent();
  const [featured, ...recent] = adapter.getJournalEntries();
  const photo = featured ? adapter.getEntryPhotos(featured)[0] : undefined;
  return (
    <>
      <PageIntro
        eyebrow="THE COMMUNITY JOURNAL"
        title="Our community."
        emphasis="In words and moments."
        description="Stories from our gatherings, notes from the archive, and a place for the foundation’s future updates."
        number="08"
        artwork={
          photo
            ? {
                src: photo.src,
                alt: photo.alt,
                label: "Stories from our shared rhythm",
              }
            : null
        }
      />
      <section className="journal-index wrap">
        <p className="journal-archive-note">
          These opening stories are archive notes drawn from documented 2025
          gatherings. Publication dates refer to these Journal notes, not the
          event dates.
        </p>
        {featured ? (
          <article
            className={`journal-featured ${photo ? "" : "journal-featured-text"}`}
          >
            {photo ? (
              <div className="journal-featured-image">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  priority
                  sizes="(max-width:700px) 88vw, 55vw"
                />
              </div>
            ) : null}
            <div>
              <Eyebrow>FEATURED / FROM THE ARCHIVE</Eyebrow>
              <p className="journal-meta">
                <time dateTime={featured.publishedAt}>
                  {journalDate(featured.publishedAt)}
                </time>
              </p>
              <h2>
                <Link href={`/journal/${featured.slug}`}>{featured.title}</Link>
              </h2>
              <p>{featured.excerpt}</p>
              <TextLink href={`/journal/${featured.slug}`}>
                Read the story
              </TextLink>
            </div>
          </article>
        ) : (
          <p>
            Our next story is taking shape. Please check back for published
            updates.
          </p>
        )}
        {recent.length ? (
          <div className="journal-recent">
            <h2>
              More from <em>our community.</em>
            </h2>
            {recent.map((entry) => (
              <article key={entry.id}>
                <time dateTime={entry.publishedAt}>
                  {journalDate(entry.publishedAt)}
                </time>
                <div>
                  <h3>
                    <Link href={`/journal/${entry.slug}`}>{entry.title}</Link>
                  </h3>
                  <p>{entry.excerpt}</p>
                </div>
                <TextLink href={`/journal/${entry.slug}`}>Read story</TextLink>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { getPublicContent, journalDate } from "@/lib/journal";
import { pageMetadata } from "@/lib/metadata";
import { Eyebrow, PageIntro, TextLink } from "@/components/ui";
export const metadata = pageMetadata(
  "Updates & Stories",
  "Community updates and stories from the Musical Vibes Foundation archive.",
  "/updates",
);
export default async function Journal() {
  const adapter = await getPublicContent();
  const [featured, ...recent] = adapter.getJournalEntries();
  const photo = featured ? adapter.getEntryPhotos(featured)[0] : undefined;
  return (
    <>
      <PageIntro
        eyebrow="UPDATES & STORIES"
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
          {process.env.CONTENT_SOURCE === "sanity"
            ? "Stories, news and updates from our community. Gathering dates are shown separately from publication dates."
            : "These opening stories are archive notes drawn from documented 2025 gatherings. Publication dates refer to these Updates, not the event dates."}
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
                <Link href={`/updates/${featured.slug}`}>{featured.title}</Link>
              </h2>
              <p>{featured.excerpt}</p>
              <TextLink href={`/updates/${featured.slug}`}>
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
            {recent.map((entry) => {
              const thumbnail = adapter.getEntryPhotos(entry)[0];
              return (
                <article key={entry.id}>
                  <Link
                    href={`/updates/${entry.slug}`}
                    className="update-thumbnail"
                    aria-label={`Read ${entry.title}`}
                  >
                    {thumbnail ? (
                      <Image
                        src={thumbnail.src}
                        alt={thumbnail.alt}
                        fill
                        sizes="(max-width:700px) 28vw, 180px"
                      />
                    ) : (
                      <span aria-hidden="true">MVF</span>
                    )}
                  </Link>
                  <time dateTime={entry.publishedAt}>
                    {journalDate(entry.publishedAt)}
                  </time>
                  <div>
                    <h3>
                      <Link href={`/updates/${entry.slug}`}>{entry.title}</Link>
                    </h3>
                    <p>{entry.excerpt}</p>
                  </div>
                  <TextLink href={`/updates/${entry.slug}`}>
                    Read story
                  </TextLink>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </>
  );
}

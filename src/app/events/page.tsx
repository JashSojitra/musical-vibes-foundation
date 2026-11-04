import Link from "next/link";
import { getEvents } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { Eyebrow, Invitation, PageIntro, TextLink } from "@/components/ui";
import GalleryPreview from "@/components/gallery-preview";
import { getPublicContent } from "@/lib/journal";
export const metadata = pageMetadata(
  "Events & Gatherings",
  "Find upcoming Musical Vibes Foundation gatherings and explore our community gallery.",
  "/events",
);
export default async function Events() {
  const upcoming = (await getEvents()).filter(
    (item) => item.status === "upcoming",
  );
  const collections = getPublicContent().getGalleryCollections();
  const introPhoto = collections[0]?.photos[0];
  return (
    <>
      <PageIntro
        eyebrow="EVENTS / A REASON TO COME TOGETHER"
        title="A date to connect."
        emphasis="A moment to remember."
        description="From shared celebrations to community gatherings, these are the moments that bring us closer."
        number="03"
        artwork={
          introPhoto
            ? {
                src: introPhoto.src,
                alt: introPhoto.alt,
                label: "Moments worth sharing",
              }
            : null
        }
      />
      <section className="upcoming-section wrap">
        <Eyebrow>UPCOMING GATHERINGS</Eyebrow>
        {upcoming.length ? (
          <div>
            {upcoming.map((event) => (
              <Link key={event.slug} href={`/events/${event.slug}`}>
                {event.title} · {event.dateLabel}
              </Link>
            ))}
          </div>
        ) : (
          <div className="event-empty">
            <span className="event-empty-symbol" aria-hidden="true">
              ✳
            </span>
            <div>
              <h2>
                The next moment
                <br />
                <em>is still taking shape.</em>
              </h2>
              <p>
                There are no confirmed upcoming events listed right now. Get in
                touch for current plans and ways to take part.
              </p>
              <TextLink href="/contact">Ask about the next gathering</TextLink>
            </div>
          </div>
        )}
      </section>
      <section className="event-archive wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>FROM OUR COMMUNITY ARCHIVE</Eyebrow>
            <h2 data-reveal>
              Good times.
              <br />
              <em>Beautiful memories.</em>
            </h2>
          </div>
          <p>Past events, preserved in photographs.</p>
        </div>
        <GalleryPreview collections={collections} />
      </section>
      <Invitation title="Make room for" emphasis="the next connection." />
    </>
  );
}

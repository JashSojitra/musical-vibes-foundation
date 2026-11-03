import Link from "next/link";
import { getEvents, getMedia } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import {
  Action,
  Arrow,
  Eyebrow,
  Invitation,
  PageIntro,
  Photo,
  TextLink,
} from "@/components/ui";
export const metadata = pageMetadata(
  "Events & Gatherings",
  "Explore past Musical Vibes Foundation gatherings and get in touch about future community events.",
  "/events",
);
export default async function Events() {
  const events = await getEvents(),
    past = events.filter((item) => item.status === "past"),
    upcoming = events.filter((item) => item.status === "upcoming"),
    featured = past[0];
  return (
    <>
      <PageIntro
        eyebrow="EVENTS / A REASON TO COME TOGETHER"
        title="A date to connect."
        emphasis="A moment to remember."
        description="From shared celebrations to community gatherings, these are the moments that bring us closer."
        number="03"
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
        {featured ? (
          <div className="featured-event">
            <Photo media={await getMedia(featured.imageId)} />
            <div>
              <span className="eyebrow">
                FEATURED MEMORY · {featured.dateLabel}
              </span>
              <h3>{featured.title}</h3>
              <p>{featured.description}</p>
              <Action href={`/events/${featured.slug}`}>
                Revisit this gathering
              </Action>
            </div>
          </div>
        ) : null}
        <div className="past-event-list">
          {past.slice(1).map((event) => (
            <Link href={`/events/${event.slug}`} key={event.slug}>
              <time dateTime={event.date}>{event.dateLabel}</time>
              <h3>{event.title}</h3>
              <span className="eyebrow">PAST GATHERING</span>
              <Arrow />
            </Link>
          ))}
        </div>
      </section>
      <Invitation title="Make room for" emphasis="the next connection." />
    </>
  );
}

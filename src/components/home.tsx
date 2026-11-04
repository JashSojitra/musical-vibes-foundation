import Link from "next/link";
import Image from "next/image";
import { getSiteContent, getMedia } from "@/lib/content";
import { Action, Arrow, Eyebrow, Invitation, TextLink } from "./ui";
import LivingSymphony from "./experience/living-symphony";
import ProgramJourney from "./experience/program-journey";
import CommunityMemories from "./experience/community-memories";

export default async function Home() {
  const { programs, events, home, media } = await getSiteContent();
  const picnic = await getMedia("picnic");
  const singer = await getMedia("june-song");
  const circle = await getMedia("circle");
  const featured = events.filter((item) =>
    home.featuredEventSlugs.includes(item.slug),
  );
  return (
    <>
      <LivingSymphony singer={singer} circle={circle} picnic={picnic} />

      <ProgramJourney programs={programs} media={media} />
      <CommunityMemories
        photos={[
          media.find((photo) => photo.id === "diwali")!,
          picnic,
          media.find((photo) => photo.id === "christmas")!,
        ]}
      />

      <section className="home-events wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>MOMENTS WE’VE SHARED</Eyebrow>
            <h2 data-reveal>
              Gathered together.
              <br />
              <em>Remembered warmly.</em>
            </h2>
          </div>
          <TextLink href="/events">Visit the events archive</TextLink>
        </div>
        <div className="home-event-list">
          {await Promise.all(
            featured.map(async (event) => {
              const image = await getMedia(event.imageId);
              return (
                <Link
                  href={`/events/${event.slug}`}
                  className="home-event"
                  key={event.slug}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 700px) 100vw, 25vw"
                  />
                  <div>
                    <span className="eyebrow">
                      FROM THE ARCHIVE · {event.dateLabel}
                    </span>
                    <h3>{event.title}</h3>
                    <span className="text-link">
                      Revisit this gathering <Arrow />
                    </span>
                  </div>
                </Link>
              );
            }),
          )}
        </div>
        <p className="archive-note">
          Looking for the next gathering?{" "}
          <Link href="/contact">Ask us about current plans.</Link>
        </p>
      </section>

      <section className="home-support wrap">
        <Eyebrow>COMPASSION, PUT INTO PRACTICE</Eyebrow>
        <div className="support-overview">
          <h2 data-reveal>
            Bring your time.
            <br />
            Bring your ideas.
            <br />
            <em>Bring your heart.</em>
          </h2>
          <div>
            <p>
              There’s more than one way to make a connection. Volunteer, support
              a community initiative, or explore a collaboration with the
              foundation.
            </p>
            <Action href="/get-involved">Find your way to get involved</Action>
          </div>
        </div>
      </section>
      <Invitation title="Good things happen" emphasis="when we connect." />
    </>
  );
}

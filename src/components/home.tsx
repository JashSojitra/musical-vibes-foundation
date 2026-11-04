import Link from "next/link";
import Image from "next/image";
import { getSiteContent, getMedia } from "@/lib/content";
import { Action, Arrow, Eyebrow, Invitation, Photo, TextLink } from "./ui";
import LivingSymphony from "./experience/living-symphony";
import RhythmMoment from "./experience/rhythm-moment";

export default async function Home() {
  const { programs, events, home } = await getSiteContent();
  const picnic = await getMedia("picnic");
  const singer = await getMedia("june-song");
  const music = await getMedia("song");
  const circle = await getMedia("circle");
  const featured = events.filter((item) =>
    home.featuredEventSlugs.includes(item.slug),
  );
  return (
    <>
      <LivingSymphony singer={singer} circle={circle} picnic={picnic} />

      <section className="home-programs wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>FIND YOUR WAY TO CONNECT</Eyebrow>
            <h2 data-reveal>
              Different paths.
              <br />
              <em>One shared purpose.</em>
            </h2>
          </div>
          <TextLink href="/programs">Explore all six programs</TextLink>
        </div>
        <div className="home-program-feature">
          <Photo media={music} caption />
          <div className="home-program-feature-copy">
            <span className="eyebrow">01 / MUSIC & EXPRESSION</span>
            <h3>
              Some things
              <br />
              only <em>music</em>
              <br />
              can say.
            </h3>
            <p>{programs[0].description}</p>
            <TextLink href={`/programs/${programs[0].slug}`}>
              {programs[0].title}
            </TextLink>
          </div>
        </div>
        <div className="home-program-pair">
          {[programs[2], programs[1]].map((program) => (
            <Link
              href={`/programs/${program.slug}`}
              key={program.slug}
              className={`home-program-path theme-${program.theme}`}
            >
              <span className="eyebrow">
                {program.number} / {program.category}
              </span>
              <h3>
                {program.slug === "meditation-and-yoga" ? (
                  <>
                    A moment to pause.
                    <br />
                    <em>A space to grow.</em>
                  </>
                ) : (
                  <>
                    Come as you are.
                    <br />
                    <em>Leave connected.</em>
                  </>
                )}
              </h3>
              <p>{program.description}</p>
              <span className="path-link">
                {program.title}
                <Arrow />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-photo-story">
        <Photo media={circle} />
        <div className="photo-story-copy">
          <Eyebrow>IN GOOD COMPANY</Eyebrow>
          <h2>
            A familiar face.
            <br />A shared story.
            <br />
            <em>A brighter day.</em>
          </h2>
          <Action href="/gallery" light>
            Meet our community in pictures
          </Action>
        </div>
      </section>

      <section className="home-rhythm wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>CONNECTION HAS A RHYTHM</Eyebrow>
            <h2 data-reveal>
              You don’t have to hear it
              <br />
              <em>to feel it.</em>
            </h2>
          </div>
          <p>
            Different feelings. Different rhythms.
            <br />
            Choose a word and watch the shape change.
          </p>
        </div>
        <RhythmMoment />
      </section>

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

import Link from "next/link";
import Image from "next/image";
import { getSiteContent, getMedia } from "@/lib/content";
import { Action, Arrow, Eyebrow, Invitation, Photo, TextLink } from "./ui";
import SoundSculpture from "./experience/sound-sculpture";
import RhythmMoment from "./experience/rhythm-moment";

export default async function Home() {
  const { programs, events, home } = await getSiteContent();
  const picnic = await getMedia("picnic");
  const music = await getMedia("song");
  const circle = await getMedia("circle");
  const featured = events.filter((item) =>
    home.featuredEventSlugs.includes(item.slug),
  );
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-fine-line" aria-hidden="true" />
        <div className="hero-copy">
          <Eyebrow>MUSIC. WELLNESS. COMMUNITY.</Eyebrow>
          <h1 id="home-title" data-title>
            The art of
            <br />
            <em>connection.</em>
          </h1>
          <p>
            There’s something beautiful about coming together.
            <br className="desktop-break" /> Find it in music. Feel it in
            community.
          </p>
          <div className="hero-actions">
            <Action href="/programs" light>
              Explore programs
            </Action>
            <Action href="/get-involved" secondary>
              Get involved
            </Action>
          </div>
        </div>
        <div className="hero-sculpture">
          <SoundSculpture />
        </div>
        <figure className="hero-community-photo">
          <div className="hero-photo">
            <Image
              src={picnic.src}
              alt={picnic.alt}
              fill
              priority
              quality={85}
              sizes="(max-width: 700px) 100vw, 48vw"
            />
          </div>
          <figcaption>REAL PEOPLE. SHARED MOMENTS. OUR COMMUNITY.</figcaption>
        </figure>
        <div className="hero-footnote">
          <span>ROOTED IN BRAMPTON, ONTARIO</span>
          <Link href="/about">
            DISCOVER OUR STORY <Arrow down />
          </Link>
        </div>
      </section>

      <section className="home-mission wrap">
        <Eyebrow>GOOD THINGS BEGIN TOGETHER</Eyebrow>
        <div>
          <h2 data-reveal>
            More than a melody.
            <br />
            <em>A sense of belonging.</em>
          </h2>
          <div className="connection-rule" aria-hidden="true" />
          <div className="mission-copy">
            <p>
              We bring music, wellness, and compassion into the lives of seniors
              and our wider community.
            </p>
            <div>
              <p>
                Musical Vibes Foundation creates spaces to express yourself,
                share experiences, and feel part of something. Because a little
                connection can change the rhythm of a day.
              </p>
              <TextLink href="/about">The heart of our foundation</TextLink>
            </div>
          </div>
        </div>
      </section>

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

import Image from "next/image";
import type { MediaAsset } from "@/types/content";
import { Action, Arrow, TextLink } from "../ui";
import SoundSculpture from "./sound-sculpture";

export default function LivingSymphony({
  singer,
  circle,
  picnic,
}: {
  singer: MediaAsset;
  circle: MediaAsset;
  picnic: MediaAsset;
}) {
  return (
    <div className="living-symphony">
      <section className="symphony-hero" aria-labelledby="home-title">
        <div className="symphony-photo">
          <Image
            src={singer.src}
            alt={singer.alt}
            fill
            priority
            quality={85}
            sizes="(max-width: 700px) 100vw, 60vw"
            style={{ objectPosition: singer.position }}
          />
        </div>
        <div className="symphony-atmosphere" aria-hidden="true" />
        <div className="symphony-score">
          <SoundSculpture />
        </div>
        <div className="symphony-copy">
          <p className="symphony-kicker">Music. Wellness. Community.</p>
          <h1 id="home-title" data-title>
            The art of
            <br />
            <em>connection.</em>
          </h1>
          <p className="symphony-intro">
            There’s something beautiful about coming together. Find it in music.
            Feel it in community.
          </p>
          <div className="symphony-actions">
            <Action href="/programs" light>
              Explore programs
            </Action>
            <a className="symphony-story-link" href="#our-story">
              Our story <Arrow down />
            </a>
          </div>
        </div>
        <div className="symphony-photo-credit">
          <span>A voice. A moment. A connection.</span>
          <small>From our Seniors Meet · June 2025</small>
        </div>
        <div className="symphony-bottom">
          <span>Brampton, Ontario</span>
          <span>
            The living symphony <i aria-hidden="true" /> 01
          </span>
        </div>
      </section>
      <section
        className="symphony-story"
        id="our-story"
        aria-labelledby="story-title"
      >
        <div className="story-heading">
          <p className="symphony-kicker">01 / Good things begin together</p>
          <h2 id="story-title">
            More than a melody.
            <br />
            <em>A sense of belonging.</em>
          </h2>
        </div>
        <div className="story-composition">
          <figure className="story-main-photo" data-story-depth="main">
            <div className="story-image">
              <Image
                src={circle.src}
                alt={circle.alt}
                fill
                sizes="(max-width: 700px) 95vw, 56vw"
              />
            </div>
            <figcaption>
              A place in the circle. A place to be yourself.
              <small>{circle.caption}</small>
            </figcaption>
          </figure>
          <figure className="story-detail-photo" data-story-depth="detail">
            <div className="story-image">
              <Image
                src={picnic.src}
                alt={picnic.alt}
                fill
                sizes="(max-width: 700px) 62vw, 29vw"
                style={{ objectPosition: picnic.position }}
              />
            </div>
            <figcaption>
              Different stories. One community.<small>{picnic.caption}</small>
            </figcaption>
          </figure>
          <div className="story-copy">
            <span className="story-chapter">The rhythm of belonging</span>
            <p className="story-lead">
              We bring music, wellness, and compassion into the lives of seniors
              and our wider community.
            </p>
            <p>
              Musical Vibes Foundation creates spaces to express yourself, share
              experiences, and feel part of something. Because a little
              connection can change the rhythm of a day.
            </p>
            <TextLink href="/about">The heart of our foundation</TextLink>
          </div>
          <span className="story-margin-note" aria-hidden="true">
            Many voices. A shared rhythm.
          </span>
        </div>
        <div className="story-coda">
          <span>Come as you are.</span>
          <p>There’s a place for you here.</p>
          <TextLink href="/get-involved">Get involved</TextLink>
        </div>
      </section>
    </div>
  );
}

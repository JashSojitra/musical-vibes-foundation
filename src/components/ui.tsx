import ArrowIcon from "@/components/arrow-icon";
import Image from "next/image";
import Link from "next/link";
import type { MediaAsset } from "@/types/content";

export function Arrow({ down = false }: { down?: boolean }) {
  return (
    <span className="arrow" aria-hidden="true">
      <ArrowIcon direction={down ? "down" : "up-right"} />
    </span>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true" />
      {children}
    </p>
  );
}
export function Action({
  href,
  children,
  light = false,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`action ${light ? "action-light" : ""} ${secondary ? "action-secondary" : ""}`}
    >
      {children}
      <Arrow />
    </Link>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-link">
      {children}
      <Arrow />
    </Link>
  );
}
export function Photo({
  media,
  priority = false,
  className = "",
  caption = false,
}: {
  media: MediaAsset;
  priority?: boolean;
  className?: string;
  caption?: boolean;
}) {
  return (
    <figure className={`photo ${className}`} data-image>
      <div className="photo-frame">
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          priority={priority}
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 80vw, 55vw"
          style={{ objectPosition: media.position }}
        />
      </div>
      {caption ? <figcaption>{media.caption}</figcaption> : null}
    </figure>
  );
}
export function PageIntro({
  eyebrow,
  title,
  emphasis,
  description,
  number,
  artwork,
}: {
  eyebrow: string;
  title: string;
  emphasis?: string;
  description: string;
  number?: string;
  artwork?: { src: string; alt: string; label: string } | null;
}) {
  const chapterPhotos: Record<
    string,
    { src: string; alt: string; label: string }
  > = {
    "01": {
      src: "seniors-circle",
      alt: "Seniors sharing a gathering in a sunlit community room.",
      label: "A place in the circle",
    },
    "02": {
      src: "shared-song",
      alt: "A Seniors Club participant singing into a microphone.",
      label: "Expression. Connection. Belonging.",
    },
    "03": {
      src: "celebration",
      alt: "Community members standing together at a Christmas celebration.",
      label: "Moments worth sharing",
    },
    "04": {
      src: "diwali",
      alt: "Community members performing music at a Diwali celebration.",
      label: "The community album",
    },
    "05": {
      src: "picnic-table",
      alt: "Community members together at a summer picnic.",
      label: "A little time. A lot of heart.",
    },
    "06": {
      src: "conversation",
      alt: "Two participants holding microphones at a community gathering.",
      label: "Every connection starts here",
    },
    "07": {
      src: "gathering",
      alt: "Seniors sharing a gathering around tables.",
      label: "A good place to begin",
    },
    "08": {
      src: "diwali",
      alt: "Music at the community Diwali celebration.",
      label: "Stories from our shared rhythm",
    },
  };
  const photo =
    artwork === undefined
      ? number
        ? chapterPhotos[number]
        : undefined
      : artwork;
  return (
    <header className="page-intro wrap" data-chapter={number}>
      <div className="intro-chapter">
        <Eyebrow>{eyebrow}</Eyebrow>
        <span>Musical Vibes / {number ?? "Our community"}</span>
      </div>
      <div className="page-intro-grid">
        <h1 className="display" data-title>
          {title}
          {emphasis ? (
            <>
              <br />
              <em>{emphasis}</em>
            </>
          ) : null}
        </h1>
        <p className="intro-description">{description}</p>
        {photo ? (
          <figure className="intro-photograph">
            <div>
              <Image
                src={
                  photo.src.startsWith("/") || photo.src.startsWith("https://")
                    ? photo.src
                    : `/assets/curated/${photo.src}.webp`
                }
                alt={photo.alt}
                fill
                priority
                sizes="(max-width:700px) 80vw, 32vw"
              />
            </div>
            <figcaption>
              {photo.label}
              <span>{number} / The art of connection</span>
            </figcaption>
          </figure>
        ) : null}
      </div>
      {number ? (
        <span className="page-number" aria-hidden="true">
          {number}
        </span>
      ) : null}
    </header>
  );
}
export function Invitation({
  title = "Every connection starts",
  emphasis = "with a hello.",
  description = "Join a program, lend a hand, or bring a new idea. We’d love to hear from you.",
}: {
  title?: string;
  emphasis?: string;
  description?: string;
}) {
  return (
    <section className="invitation wrap">
      <Eyebrow>A PLACE FOR YOU HERE</Eyebrow>
      <h2 data-reveal>
        {title}
        <br />
        <em>{emphasis}</em>
      </h2>
      <p>{description}</p>
      <Action href="/contact" light>
        Let’s connect
      </Action>
      <div className="invitation-orbits" aria-hidden="true">
        <i />
        <i />
      </div>
    </section>
  );
}
export function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {items.map((item, i) => (
        <span key={item.label}>
          <span aria-hidden="true">/</span>
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current={i === items.length - 1 ? "page" : undefined}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

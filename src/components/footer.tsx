import ArrowIcon from "@/components/arrow-icon";
import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/types/content";

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer wrap">
      <div className="footer-grid">
        <div>
          <Link
            href="/"
            className="footer-brand"
            aria-label="Musical Vibes Foundation home"
          >
            <Image
              src="/assets/legacy/logo.png"
              alt="Musical Vibes Foundation"
              width={1001}
              height={335}
              sizes="260px"
            />
          </Link>
          <p>
            Music brings us together.
            <br />
            Compassion makes us a community.
          </p>
        </div>
        <nav aria-label="Explore the foundation">
          <span className="eyebrow">EXPLORE</span>
          <Link href="/about">Our story</Link>
          <Link href="/programs">Our programs</Link>
          <Link href="/events">Events</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/journal">Journal</Link>
        </nav>
        <nav aria-label="Connect with the foundation">
          <span className="eyebrow">TAKE PART</span>
          <Link href="/get-involved">Get involved</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/faq">Questions & answers</Link>
        </nav>
        <div className="footer-contact">
          <span className="eyebrow">SAY HELLO</span>
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
          <a href="tel:+14168326970">{settings.phone}</a>
          <p>{settings.location}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.name}
        </span>
        <span>The art of connection.</span>
        <a href="#main">
          Back to content <ArrowIcon direction="up" />
        </a>
      </div>
    </footer>
  );
}

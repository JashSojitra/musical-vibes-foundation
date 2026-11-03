"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  ["About", "/about"],
  ["Programs", "/programs"],
  ["Events", "/events"],
  ["Gallery", "/gallery"],
  ["Contact", "/contact"],
];
export default function Navigation({
  programs,
}: {
  programs: { title: string; slug: string }[];
}) {
  const pathname = usePathname();
  const [submenu, setSubmenu] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const programToggle = useRef<HTMLButtonElement>(null);
  const programNav = useRef<HTMLDivElement>(null);
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!programNav.current?.contains(event.target as Node))
        setSubmenu(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  function closeMenu() {
    menuRef.current?.close();
    document.body.style.overflow = "";
    trigger.current?.focus();
  }
  function openMenu() {
    menuRef.current?.showModal();
    document.body.style.overflow = "hidden";
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      void import("gsap").then(({ gsap }) =>
        gsap.fromTo(
          ".mobile-menu-links > a",
          { x: 20 },
          { x: 0, duration: 0.45, stagger: 0.035, clearProps: "transform" },
        ),
      );
  }
  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );
  return (
    <>
      <header className="site-header">
        <Link
          href="/"
          className="brand"
          aria-label="Musical Vibes Foundation home"
        >
          <Image
            src="/assets/legacy/logo.png"
            alt="Musical Vibes Foundation"
            width={1001}
            height={335}
            priority
            sizes="220px"
          />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) =>
            href === "/programs" ? (
              <div
                className="program-navigation"
                key={href}
                ref={programNav}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSubmenu(false);
                    programToggle.current?.focus();
                  }
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    setSubmenu(false);
                }}
              >
                <Link
                  href={href}
                  aria-current={active(href) ? "page" : undefined}
                  onClick={() => setSubmenu(false)}
                >
                  {label}
                </Link>
                <button
                  ref={programToggle}
                  aria-label="Program pages"
                  aria-expanded={submenu}
                  aria-controls="program-submenu"
                  onClick={() => setSubmenu(!submenu)}
                >
                  <span aria-hidden="true">⌄</span>
                </button>
                <div
                  id="program-submenu"
                  className="program-submenu"
                  hidden={!submenu}
                >
                  <span className="eyebrow">FIND YOUR WAY TO CONNECT</span>
                  {programs.map((program, i) => (
                    <Link
                      key={program.slug}
                      href={`/programs/${program.slug}`}
                      onClick={() => setSubmenu(false)}
                    >
                      <span>0{i + 1}</span>
                      {program.title}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ),
          )}
        </nav>
        <Link
          className="header-action"
          href="/get-involved"
          aria-current={pathname === "/get-involved" ? "page" : undefined}
        >
          Get involved <span aria-hidden="true">↗</span>
        </Link>
        <button
          className="menu-toggle"
          ref={trigger}
          onClick={openMenu}
          aria-haspopup="dialog"
          aria-controls="mobile-menu"
        >
          Menu <span aria-hidden="true">+</span>
        </button>
      </header>
      <dialog
        className="mobile-menu"
        id="mobile-menu"
        ref={menuRef}
        onCancel={closeMenu}
        onClose={() => {
          document.body.style.overflow = "";
        }}
        aria-labelledby="menu-title"
      >
        <div className="mobile-menu-top">
          <span id="menu-title">THE ART OF CONNECTION</span>
          <button onClick={closeMenu} autoFocus>
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav className="mobile-menu-links" aria-label="Mobile navigation">
          {[
            ["Home", "/"],
            ...links,
            ["Get involved", "/get-involved"],
            ["FAQ", "/faq"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
        <p className="mobile-menu-note">
          Music. Wellness. Community.
          <br />
          Brampton, Ontario.
        </p>
      </dialog>
    </>
  );
}

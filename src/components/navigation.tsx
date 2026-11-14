"use client";
import ArrowIcon from "@/components/arrow-icon";
import Image from "next/image";
import type { MediaAsset } from "@/types/content";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";

const links = [
  ["About", "/about"],
  ["Programs", "/programs"],
  ["Events", "/events"],
  ["Gallery", "/gallery"],
  ["Updates", "/updates"],
  ["Contact", "/contact"],
];
export default function Navigation({
  programs,
  menuPhoto,
}: {
  programs: { title: string; slug: string }[];
  menuPhoto: MediaAsset;
}) {
  const pathname = usePathname();
  const [submenu, setSubmenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const programToggle = useRef<HTMLButtonElement>(null);
  const programNav = useRef<HTMLDivElement>(null);
  const hoverOpened = useRef(false);
  const clickedOpen = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeSubmenu = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    hoverOpened.current = false;
    clickedOpen.current = false;
    setSubmenu(false);
  }, []);
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  function magnet(event: ReactPointerEvent<HTMLElement>) {
    if (
      event.pointerType !== "mouse" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const item = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-magnetic]",
    );
    if (!item) return;
    const box = item.getBoundingClientRect();
    item.style.setProperty(
      "--magnet-x",
      `${(event.clientX - box.left - box.width / 2) * 0.12}px`,
    );
    item.style.setProperty(
      "--magnet-y",
      `${(event.clientY - box.top - box.height / 2) * 0.12}px`,
    );
  }
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!programNav.current?.contains(event.target as Node)) closeSubmenu();
    };
    document.addEventListener("pointerdown", close);
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        programToggle.current?.getAttribute("aria-expanded") === "true"
      ) {
        closeSubmenu();
        programToggle.current.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [closeSubmenu]);
  function closeMenu() {
    setMobileOpen(false);
    menuRef.current?.close();
    document.body.style.overflow = "";
    trigger.current?.focus();
  }
  function openMenu() {
    setMobileOpen(true);
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
            sizes="168px"
          />
        </Link>
        <nav
          className="desktop-nav"
          aria-label="Main navigation"
          onPointerMove={magnet}
          onPointerLeave={(event) =>
            event.currentTarget
              .querySelectorAll<HTMLElement>("[data-magnetic]")
              .forEach((item) => {
                item.style.setProperty("--magnet-x", "0px");
                item.style.setProperty("--magnet-y", "0px");
              })
          }
        >
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              data-magnetic
              onClick={closeSubmenu}
              aria-current={active(href) ? "page" : undefined}
            >
              <span className="nav-label">{label}</span>
            </Link>
          ))}
          <div
            className="program-navigation"
            ref={programNav}
            onPointerEnter={(event) => {
              if (event.pointerType !== "mouse") return;
              if (closeTimer.current) clearTimeout(closeTimer.current);
              if (!submenu) hoverOpened.current = true;
              setSubmenu(true);
            }}
            onPointerLeave={() => {
              if (!clickedOpen.current)
                closeTimer.current = setTimeout(() => {
                  if (!programNav.current?.contains(document.activeElement))
                    closeSubmenu();
                }, 180);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeSubmenu();
                programToggle.current?.focus();
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                closeSubmenu();
            }}
          >
            <button
              ref={programToggle}
              aria-label="More"
              aria-expanded={submenu}
              aria-controls="program-submenu"
              onClick={() => {
                if (hoverOpened.current) {
                  hoverOpened.current = false;
                  clickedOpen.current = true;
                  setSubmenu(true);
                } else {
                  clickedOpen.current = !submenu;
                  setSubmenu(!submenu);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSubmenu(true);
                  clickedOpen.current = true;
                  requestAnimationFrame(() =>
                    programNav.current
                      ?.querySelector<HTMLAnchorElement>(
                        ".program-menu-links a",
                      )
                      ?.focus(),
                  );
                }
              }}
            >
              More
            </button>
            <div
              id="program-submenu"
              className="program-submenu"
              hidden={!submenu}
            >
              <div className="program-menu-intro">
                <Image
                  src={menuPhoto.src}
                  alt={menuPhoto.alt}
                  width={360}
                  height={270}
                  sizes="180px"
                />
                <p>
                  Find your
                  <br />
                  <em>shared rhythm.</em>
                </p>
                <Link href="/programs" onClick={closeSubmenu}>
                  All programs{" "}
                  <span aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </Link>
              </div>
              <div className="program-menu-links">
                <span className="eyebrow">WAYS TO CONNECT</span>
                {programs.map((program, i) => (
                  <Link
                    key={program.slug}
                    href={`/programs/${program.slug}`}
                    onClick={closeSubmenu}
                  >
                    <span>0{i + 1}</span>
                    {program.title}
                    <span aria-hidden="true">
                      <ArrowIcon />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <Link
          className="header-action"
          href="/get-involved"
          aria-current={pathname === "/get-involved" ? "page" : undefined}
        >
          Get involved{" "}
          <span aria-hidden="true">
            <ArrowIcon />
          </span>
        </Link>
        <button
          className="menu-toggle"
          ref={trigger}
          onClick={openMenu}
          aria-haspopup="dialog"
          aria-controls="mobile-menu"
          aria-expanded={mobileOpen}
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
          setMobileOpen(false);
          document.body.style.overflow = "";
        }}
        aria-labelledby="menu-title"
      >
        <div className="mobile-menu-top">
          <span id="menu-title">
            <Image
              src="/assets/legacy/logo.png"
              alt="Musical Vibes Foundation"
              width={1001}
              height={335}
              sizes="160px"
            />
            <span className="menu-label">Explore our foundation</span>
          </span>
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
          ].map(([label, href], i) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              aria-current={
                (href === "/" ? pathname === "/" : active(href))
                  ? "page"
                  : undefined
              }
            >
              <small aria-hidden="true">0{i + 1}</small>
              {label}
              <span aria-hidden="true">
                <ArrowIcon />
              </span>
            </Link>
          ))}
        </nav>
        <details className="mobile-programs">
          <summary>
            More · Our programs <span aria-hidden="true">+</span>
          </summary>
          <div>
            {programs.map((program) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                onClick={closeMenu}
              >
                {program.title}
                <span aria-hidden="true">
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        </details>
        <p className="mobile-menu-note">
          Music. Wellness. Community.
          <br />
          Brampton, Ontario.
        </p>
      </dialog>
    </>
  );
}

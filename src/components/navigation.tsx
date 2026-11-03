'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
const links = [['Our story', '#story'], ['Our programs', '#programs'], ['In good company', '#gallery'], ['Get in touch', '#contact']];
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return <header className="site-header" id="top">
    <a className="logo" href="#top" aria-label="Musical Vibes Foundation home"><Image src="/assets/legacy/logo.png" alt="Musical Vibes Foundation" width={1001} height={335} priority /></a>
    <nav className="desktop-nav" aria-label="Main navigation">{links.slice(0, 3).map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
    <a className="header-contact" href="#contact">Let’s connect <span aria-hidden="true">↗</span></a>
    <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? 'Close −' : 'Menu +'}<span className="sr-only"> navigation</span></button>
    <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" hidden={!open}>{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">↗</span></a>)}</nav>
  </header>;
}

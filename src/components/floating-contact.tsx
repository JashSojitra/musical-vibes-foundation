"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
export default function FloatingContact() {
  const pathname = usePathname();
  if (pathname === "/contact") return null;
  return (
    <Link
      href="/contact"
      className="floating-contact"
      aria-label="Contact the foundation"
    >
      <MessageCircle aria-hidden="true" size={21} strokeWidth={1.5} />
      <span>Contact</span>
    </Link>
  );
}

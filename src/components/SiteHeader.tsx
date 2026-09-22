"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import crest from "../../assets/crest.png";
import { QUIZ_VERSION } from "@/data/questions";

const navLinks = [
  { href: "/", label: "Quiz" },
  { href: "/pairings", label: "Spec pairings" },
  { href: "/methodology", label: "How it works" },
];

const MENU_ID = "site-menu";

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/result/") : pathname.startsWith(href);
}

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const linkClass = (href: string) =>
    `focus-ring t-small transition-colors ${isCurrent(pathname, href) ? "text-[var(--bone)] underline decoration-[var(--bronze)] decoration-2 underline-offset-8" : "text-[var(--dim)] hover:text-[var(--bone)]"}`;

  return (
    <header className="border-b border-[var(--line)]">
      <nav aria-label="Main">
        <div className="mx-auto flex w-full max-w-[78rem] items-center gap-6 px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="focus-ring mr-auto block shrink-0"
            aria-label="What Should I Play? — return to quiz start"
            onNavigate={(event) => {
              event.preventDefault();
              setOpen(false);
              try { sessionStorage.removeItem(`wow-forever-quiz:${QUIZ_VERSION}`); }
              catch {}
              if (window.location.pathname === "/") window.location.reload();
              else router.push("/");
            }}
          >
            <Image src={crest} alt="" priority sizes="44px" className="h-11 w-auto" />
          </Link>

          <ul className="hidden items-center gap-6 sm:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((value) => !value)}
            className="focus-ring flex h-11 w-11 cursor-pointer items-center justify-center border border-[var(--control-line)] text-[var(--bone)] sm:hidden"
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden="true" className="text-xl leading-none">{open ? "×" : "☰"}</span>
          </button>
        </div>

        <ul id={MENU_ID} hidden={!open} className="border-t border-[var(--line)] px-5 py-2 sm:hidden">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`${linkClass(link.href)} flex min-h-11 items-center`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

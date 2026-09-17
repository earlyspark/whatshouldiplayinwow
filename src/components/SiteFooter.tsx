import Link from "next/link";
import { DATA_CHECKED_LABEL } from "@/data/forever";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] pb-6 pt-8 text-center">
      <p className="t-small">
        <Link href="/methodology" className="link-bronze focus-ring">How it works &amp; privacy</Link>
      </p>
      <p className="mt-3 text-[0.8125rem] leading-normal text-[var(--dim)]">
        Unofficial fan project. World of Warcraft is a trademark of Blizzard Entertainment.
      </p>
      <p className="mt-0.5 text-[0.8125rem] leading-normal text-[var(--dim)]">
        Updated: {DATA_CHECKED_LABEL} ·{" "}©&nbsp;
        <a href="https://earlyspark.com" target="_blank" rel="noopener noreferrer" className="link-bronze focus-ring">
          earlyspark
        </a>
      </p>
    </footer>
  );
}

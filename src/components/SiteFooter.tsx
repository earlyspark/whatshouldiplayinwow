import Link from "next/link";
import { DATA_CHECKED_LABEL } from "@/data/forever";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] pb-6 pt-8 text-center">
      <p className="t-small text-[var(--dim)]">
        Unofficial fan project. World of Warcraft is a trademark of Blizzard Entertainment. ·{" "}
        <Link href="/methodology" className="link-bronze focus-ring">How it works</Link>
      </p>
      <p className="t-small mt-2 text-[var(--dim)]">Sourced from: {DATA_CHECKED_LABEL}</p>
      <p className="t-small mt-0.5 text-[var(--dim)]">
        ©&nbsp;
        <a href="https://earlyspark.com" target="_blank" rel="noopener noreferrer" className="link-bronze focus-ring">
          earlyspark
        </a>
      </p>
    </footer>
  );
}

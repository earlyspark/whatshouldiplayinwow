import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QuizFlow from "./QuizFlow";
import crest from "../../assets/crest.png";
import { DATA_CHECKED_LABEL } from "@/data/forever";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "What Should I Play? WoW Forever Race & Class Quiz",
  description: "Which World of Warcraft: Forever race and class should you play? Rank your playstyle, fantasy, and favorite content to get a personalized pick.",
  alternates: { canonical: siteUrl },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "What Should I Play? WoW Forever Race & Class Quiz",
    url: siteUrl,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: "A deterministic quiz that recommends a World of Warcraft: Forever race and class from playstyle and preference answers.",
  };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <div className="mx-auto w-full max-w-[78rem] px-5 sm:px-8">
        <header className="pb-14 pt-4 sm:pb-16 sm:pt-5">
          <Image
            src={crest}
            alt="What Should I Play?"
            priority
            sizes="130px"
            className="mx-auto mb-5 h-[110px] w-auto sm:h-[130px]"
          />

          <div className="flex flex-col items-start gap-5">
            <p className="t-eyebrow text-[var(--bronze)]">World of Warcraft: Forever</p>
            <h1 className="t-display">Which race and class should you play?</h1>
            <p className="t-body text-[var(--dim)]">
              A playstyle-first quiz for new adventurers, returning veterans, and everyone trying to
              figure out what race and class they want to play in{" "}
              <a
                href="https://worldofwarcraft.blizzard.com/en-us/forever"
                target="_blank"
                rel="noopener noreferrer"
                className="link-bronze focus-ring"
              >
                World of Warcraft: Forever
              </a>
              . Take this quiz to find out what matches your style and share with your friends!
            </p>
          </div>
        </header>

        <QuizFlow />

        <footer className="mt-24 border-t border-[var(--line)] pb-6 pt-8 text-center">
          <p className="t-small text-[var(--dim)]">
            Unofficial fan project. World of Warcraft is a trademark of Blizzard Entertainment.
            <span aria-hidden="true"> · </span>
            <Link href="/methodology" className="link-bronze focus-ring">How it works</Link>
          </p>
          <p className="t-small mt-2 text-[var(--dim)]">Data last checked: {DATA_CHECKED_LABEL}</p>
          <p className="t-small mt-0.5 text-[var(--dim)]">
            ©&nbsp;
            <a
              href="https://earlyspark.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link-bronze focus-ring"
            >
              earlyspark
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

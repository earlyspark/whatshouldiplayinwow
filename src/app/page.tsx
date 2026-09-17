import type { Metadata } from "next";
import QuizFlow from "./QuizFlow";
import AdSenseUnit from "@/components/AdSenseUnit";
import LogoHomeLink from "@/components/LogoHomeLink";
import SiteFooter from "@/components/SiteFooter";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "What Should I Play? WoW Forever Race & Class Quiz",
  description: "Which World of Warcraft: Forever race and class should you play? Rank your playstyle, fantasy, and preferred adventures to get a personalized pick.",
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
        <header className="pb-7 pt-4 sm:pb-9 sm:pt-5">
          <LogoHomeLink />

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
        <AdSenseUnit viewport="mobile" />

        <SiteFooter />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import crest from "../../../assets/crest.png";
import AdSlot from "@/components/AdSlot";
import AmazonBanner from "@/components/AmazonBanner";
import SiteFooter from "@/components/SiteFooter";
import AnalyticsSettingsButton from "@/components/AnalyticsSettingsButton";
import { DATA_CHECKED_LABEL, DATA_SOURCES } from "@/data/forever";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const shareTitle = "How this WoW Forever quiz works";
const shareDescription = "See how your playstyle answers become a WoW Forever race and class recommendation.";

export const metadata: Metadata = {
  title: shareTitle,
  description: shareDescription,
  alternates: { canonical: `${siteUrl}/methodology` },
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    type: "website",
    url: `${siteUrl}/methodology`,
    siteName: "What Should I Play?",
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
  },
};

export default function MethodologyPage() {
  return (
    <main id="main-content">
      <div className="mx-auto w-full max-w-[78rem] px-5 sm:px-8">
        <header className="pb-7 pt-4 sm:pb-9 sm:pt-5">
          <Link href="/" className="focus-ring mx-auto mb-5 block w-fit" aria-label="What Should I Play? — home">
            <Image src={crest} alt="" priority sizes="130px" className="h-[110px] w-auto sm:h-[130px]" />
          </Link>
          <div className="flex flex-col items-start gap-5">
            <p className="t-eyebrow text-[var(--bronze)]">World of Warcraft: Forever</p>
            <h1 className="t-display">How this works</h1>
          </div>
        </header>

        <article>
          <section className="space-y-5">
            <p className="t-body text-[var(--dim)]">Your answers are compared with every playable race and class pairing. How you like to fight, the character fantasy you want, and whether you prefer a focused or flexible style shape your class match. The quiz picks your class first, then finds its best playable race using your faction, atmosphere, content, and racial utility preferences. When you started playing gives a small nudge toward racials with more timed control or lower-maintenance benefits. More recent or first-time play also slightly favors classes with a forgiving solo start. It does not measure your skill.</p>
            <p className="t-body text-[var(--dim)]">Your first-ranked choices matter most. Ranking both healing and damage gives Priest an extra signal for a Discipline-style mix. Ranking protection and damage with disruption can favor Warlock&apos;s pet and curses; choosing adaptation favors classes that can switch group jobs and gives Hunter and Warlock a smaller cue for using pets to change tactics. Frustrations and a preference for focused play can count against a class that might feel like a poor fit, without ruling it out. The same answers and game data always lead to the same result. Class fit is chosen before race fit, so a race preference cannot change your class.</p>
            <p className="t-body text-[var(--dim)]">Your main result is the strongest class match with its best-fitting race. One alternative keeps the class but changes the race; the other gives you the next class with its best race. These recommendations draw on published Forever details and broader WoW class identity where Forever details are still limited. They suggest what you may enjoy playing, not the best launch-day build.</p>
          </section>

          <section className="surface mt-12 p-6 sm:p-8">
            <p id="sources" className="t-label text-[var(--dim)]">Behind the data</p>
            <h2 className="t-section mt-3">Sources checked on: {DATA_CHECKED_LABEL}</h2>
            <p className="t-body mt-4 text-[var(--dim)]">We check race/class combinations and racials against the sources below. Shared results keep the version they were made with, and older results offer a retake when the game data or quiz scoring changes.</p>
            <p className="t-small mt-6 text-[var(--dim)]">Current sources:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6 marker:text-[var(--bronze)]">
              {DATA_SOURCES.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="link-bronze focus-ring">{source.label}</a></li>)}
            </ul>
          </section>

          <section id="privacy" className="surface mt-12 space-y-5 p-6 sm:p-8" aria-labelledby="privacy-title">
            <h2 id="privacy-title" className="t-section">Privacy and cookies</h2>
            <p className="t-small text-[var(--dim)]">
              This quiz saves your answers, recommendation, result ID, data version, and creation date so your result link can be shared. Results are stored for 12 months after creation, then expire. Anyone with your result link can view that result. Avoid sharing the link if you want to keep your choices private.
            </p>
            <p className="t-small text-[var(--dim)]">
              Completed quizzes also contribute to monthly aggregate counts, such as answers chosen and recommended classes. We do not keep a per-person breakdown of those counts, so we cannot reliably attribute or subtract one person&apos;s contribution after it has been counted.
            </p>
            <p className="t-small text-[var(--dim)]">
              Your browser uses session storage to keep an unfinished quiz and the one-time receipt used to count a completed quiz. Session storage normally clears when the tab session ends. We use your IP address to limit result creation and protect the service; hosting providers may also process request logs.
            </p>
            <p className="t-small text-[var(--dim)]">
              If you accept analytics, Google Analytics loads and uses cookies to measure page visits, quiz interactions, and affiliate-link clicks. If you decline, Google Analytics does not load. Your choice is saved in this browser&apos;s local storage. Withdrawing consent stops future Google Analytics activity on this site and clears its first-party cookies where the browser allows.
            </p>
            {process.env.VERCEL_ENV === "production" && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <p className="t-small text-[var(--dim)]">To change your choice, open <AnalyticsSettingsButton />.</p>
            )}
            <p className="t-small text-[var(--dim)]">
              Vercel Speed Insights measures page performance; result IDs are removed from its page URLs. Amazon supplies affiliate product images and links; clicking a paid link takes you to Amazon, which applies its own privacy practices. Result pages may load Wowhead&apos;s tooltip script when a racial ability has a Wowhead link. These services can receive browser request information when their resources load.
            </p>
            <p className="t-small text-[var(--dim)]">
              The site is an unofficial project by <a href="https://earlyspark.com" className="link-bronze focus-ring">earlyspark</a>. For privacy questions, email <a href="mailto:business@earlyspark.com" className="link-bronze focus-ring">business@earlyspark.com</a>.
            </p>
          </section>
        </article>

        <div className="mt-12 flex justify-center">
          <Link href="/" className="btn focus-ring">Go to the quiz</Link>
        </div>

        <div className="mt-8">
          <Suspense fallback={<AdSlot placement="inline" />}>
            <AmazonBanner placement="inline" keywords="World of Warcraft" />
          </Suspense>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

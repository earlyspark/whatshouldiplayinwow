import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import LogoHomeLink from "@/components/LogoHomeLink";
import AdSlot from "@/components/AdSlot";
import AmazonBanner from "@/components/AmazonBanner";
import SiteFooter from "@/components/SiteFooter";
import AnalyticsSettingsButton from "@/components/AnalyticsSettingsButton";
import { isProductionDeployment } from "@/lib/deploy-env";
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
          <LogoHomeLink />
          <div className="flex flex-col items-start gap-5">
            <p className="t-eyebrow text-[var(--bronze)]">World of Warcraft: Forever</p>
            <h1 className="t-display">How this works</h1>
          </div>
        </header>

        <article>
          <section className="space-y-5">
            <p className="t-body text-[var(--dim)]">Your answers are compared with every playable race and class pairing. How you like to fight, what you enjoy doing, and the character fantasy you want shape your class match. Your race match also considers identity, content, and useful racials. Choosing a faction doesn&apos;t necessarily rule out the other faction.</p>
            <p className="t-body text-[var(--dim)]">Your first-ranked choices matter most, and the frustrations you identify can count against a poor fit. It is a consistent scoring system: the same answers and game data lead to the same result.</p>
            <p className="t-body text-[var(--dim)]">Your main result is the strongest match. One alternative keeps the class but changes the race; the other gives you a different class to consider. Think of them as nearby paths. Most importantly: this is about what you may enjoy playing, not a prediction of the best launch-day build!</p>
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

          <div className="mt-12 flex justify-center">
            <Link href="/" className="btn focus-ring">Go to the quiz</Link>
          </div>

          <section id="privacy" className="surface mt-12 space-y-5 p-6 sm:p-8" aria-labelledby="privacy-title">
            <h2 id="privacy-title" className="t-section">Privacy and cookies</h2>
            <p className="t-small text-[var(--dim)]">
              This quiz saves your answers, recommendation, result ID, data version, and creation date so your result link can be shared. Results are stored for 12 months after creation, then expire. Anyone with your result link can view that result. Avoid sharing the link if you want to keep your choices private.
            </p>
            <p className="t-small text-[var(--dim)]">
              Completed quizzes also contribute to monthly aggregate counts, such as answers chosen and recommended classes. We do not keep a per-person breakdown of those counts, so we cannot reliably attribute or subtract one person&apos;s contribution after it has been counted.
            </p>
            <p className="t-small text-[var(--dim)]">
              Rating a recommendation is optional and does not require analytics consent. Only the quiz-taker with the creator receipt in this tab session can rate the main pick and either alternative; people opening a shared link cannot vote. We store one current thumbs-up or thumbs-down vote per pick and result ID until that result expires. Changing a vote replaces the old one. The public quiz stats page shows only aggregate counts for the first, second, and third picks, which remain after individual results expire. Other visitors cannot see your ratings on the shared result page.
            </p>
            <p className="t-small text-[var(--dim)]">
              Your browser uses session storage to keep an unfinished quiz, the one-time receipt used to count a completed quiz, and a separate copy of that receipt for rating your result. The counting copy is deleted after use; the rating copy normally clears when the tab session ends. We use your IP address to limit result creation and protect the service; hosting providers may also process request logs.
            </p>
            <p className="t-small text-[var(--dim)]">
              Google AdSense may show an advertisement below Amazon products on the quiz and result pages. Google and its ad partners may process browser information to deliver and measure ads. Google Analytics measures page visits, quiz interactions, affiliate-link clicks, and error pages only when analytics consent is granted. Error events group routes without sending result IDs or error messages.
            </p>
            <p className="t-small text-[var(--dim)]">
              In the EEA, UK, and Switzerland, Google&apos;s consent message handles ads and analytics choices, including detailed options. Elsewhere, the site&apos;s single banner lets you accept or decline both. The site saves its choice in this browser&apos;s local storage. Declining keeps the Google Analytics tag and manual AdSense ads off. Changing a choice stops future activity and clears first-party analytics cookies where the browser allows.
            </p>
            {isProductionDeployment() && (
              <p className="t-small text-[var(--dim)]">To change your choice, open <AnalyticsSettingsButton />.</p>
            )}
            <p className="t-small text-[var(--dim)]">
              Amazon supplies affiliate product images and links; clicking a paid link takes you to Amazon, which applies its own privacy practices. Result pages may load Wowhead&apos;s tooltip script when a racial ability has a Wowhead link. These services can receive browser request information when their resources load.
            </p>
            <p className="t-small text-[var(--dim)]">
              The site is an unofficial project by <a href="https://earlyspark.com" className="link-bronze focus-ring">earlyspark</a>. For privacy questions, email <a href="mailto:business@earlyspark.com" className="link-bronze focus-ring">business@earlyspark.com</a>.
            </p>
          </section>
        </article>

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

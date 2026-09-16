import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import crest from "../../../assets/crest.png";
import AdSlot from "@/components/AdSlot";
import AmazonBanner from "@/components/AmazonBanner";
import SiteFooter from "@/components/SiteFooter";
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
            <p className="t-body text-[var(--dim)]">Your answers are compared with every playable race and class pairing. How you like to fight, what you enjoy doing, and the character fantasy you want shape your class match. Your race match also considers identity, content, and useful racials. Class fit carries more weight, and choosing a faction doesn&apos;t necessarily rule out the other faction.</p>
            <p className="t-body text-[var(--dim)]">Your first-ranked choices matter most, and the frustrations you identify can count against a poor fit. It is a consistent scoring system: the same answers and game data lead to the same result.</p>
            <p className="t-body text-[var(--dim)]">Your main result is the strongest match. One alternative keeps the class but changes the race; the other gives you a different class to consider. Think of them as nearby paths. Most importantly: this is about what you may enjoy playing, not a prediction of the best launch-day build!</p>
          </section>

          <section className="surface mt-12 p-6 sm:p-8">
            <p id="sources" className="t-label text-[var(--dim)]">Behind the data</p>
            <h2 className="t-section mt-3">Sources checked on: {DATA_CHECKED_LABEL}</h2>
            <p className="t-body mt-4 text-[var(--dim)]">We check race/class combinations and racials against the sources below. Shared results keep the version they were made with, and older results offer a retake when the data changes.</p>
            <p className="t-small mt-6 text-[var(--dim)]">Current sources:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6 marker:text-[var(--bronze)]">
              {DATA_SOURCES.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="link-bronze focus-ring">{source.label}</a></li>)}
            </ul>
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

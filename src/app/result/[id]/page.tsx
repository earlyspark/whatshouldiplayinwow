import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
import AdSlot from "@/components/AdSlot";
import AmazonBanner from "@/components/AmazonBanner";
import SiteFooter from "@/components/SiteFooter";
import crest from "../../../../assets/crest.png";
import { withArticle } from "@/lib/article";
import { DATA_VERSION } from "@/data/forever";
import { getResult } from "@/lib/result-store";
import ResultActions from "./ResultActions";
import ResultCompletion from "./ResultCompletion";

interface ResultPageProps { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic";
const getCachedResult = cache(getResult);

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getCachedResult(id);
  if (!result) return { title: "Result not found", robots: { index: false, follow: false } };
  const name = `${result.primary.raceName} ${result.primary.className}`;
  const phrase = withArticle(name);
  const description = `My WoW Forever pick is ${name}. ${result.primary.verdict}`;
  return {
    title: `You should play ${phrase}`,
    description,
    robots: { index: false, follow: true },
    openGraph: { title: `You should play ${phrase}`, description, type: "article", url: `/result/${id}` },
    twitter: { card: "summary_large_image", title: `You should play ${phrase}`, description },
  };
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const result = await getCachedResult(id);
  if (!result) notFound();
  const isOutdated = result.dataVersion !== DATA_VERSION;
  const title = `${result.primary.raceName} ${result.primary.className}`;
  const summary = `This pick balances ${result.primary.classTagline} with ${result.primary.raceTagline}.`;
  // Ties the result page ads to the pick the reader just received, rather than
  // the generic pool the quiz pages rotate through.
  const resultKeywords = `World of Warcraft ${result.primary.className}`;

  return (
    <main id="main-content" className="min-h-screen">
      <ResultCompletion id={id} />
      <div className="mx-auto w-full max-w-[78rem] px-5 sm:px-8">
        <header className="pb-7 pt-4 sm:pb-9 sm:pt-5">
          <Link href="/" className="focus-ring mx-auto mb-5 block w-fit" aria-label="What Should I Play? — home">
            <Image src={crest} alt="" priority sizes="130px" className="h-[110px] w-auto sm:h-[130px]" />
          </Link>
          <div className="flex flex-col items-start gap-5">
            <p className="t-eyebrow text-[var(--bronze)]">What should I play in WoW: Forever?</p>
            <h1 className="t-display">{title}</h1>
            <p className="t-body text-[var(--dim)]">{summary}</p>
          </div>
          {isOutdated && (
            <div className="t-small mt-6 border-l-2 border-[var(--bronze)] bg-[rgba(200,150,74,.08)] px-4 py-3">
              This result used data checked {result.dataCheckedLabel}. Newer information is available; <Link href="/" className="link-bronze focus-ring">retake the quiz</Link> for a current recommendation.
            </div>
          )}
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-8">
            <section className="surface p-6 sm:p-8">
              <p className="t-label text-[var(--dim)]">Race</p>
              <h2 className="t-section mt-3">{result.primary.raceName}</h2>
              <p className="t-body mt-4 text-[var(--dim)]">{result.primary.whyRace}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {result.primary.racials.map((racial) => (
                  <article key={racial.name} className="inset border-l-2 border-l-[var(--plum)] p-4">
                    <h3 className="t-card">{racial.name}</h3>
                    <p className="t-small mt-1 text-[var(--dim)]">{racial.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="lg:hidden"><Suspense fallback={<AdSlot placement="sidebar" />}><AmazonBanner placement="sidebar" keywords={resultKeywords} focusTerm={result.primary.className} /></Suspense></div>

            <section className="surface p-6 sm:p-8">
              <p className="t-label text-[var(--dim)]">Class</p>
              <h2 className="t-section mt-3">{result.primary.className}</h2>
              <p className="t-body mt-4 text-[var(--dim)]">{result.primary.whyClass}</p>
            </section>

            <section className="pt-8" aria-labelledby="alternatives-title">
              <p className="t-label text-[var(--dim)]">Runner Ups</p>
              <h2 id="alternatives-title" className="t-section mt-3">Alternatives that also match your style</h2>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                {result.alternatives.map((alternative) => (
                  <article key={`${alternative.raceId}-${alternative.classId}`} className="surface p-6">
                    <h3 className="t-card text-[var(--bronze)]">{alternative.raceName} {alternative.className}</h3>
                    <p className="t-small mt-3 text-[var(--dim)]">{alternative.tradeoff}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface p-6 sm:p-8">
              <h2 className="t-section">Share the results with your friends</h2>
              <div className="mt-6"><ResultActions /></div>
            </section>
          </div>
          <div className="hidden lg:sticky lg:top-6 lg:block"><Suspense fallback={<AdSlot placement="sidebar" />}><AmazonBanner placement="sidebar" keywords={resultKeywords} focusTerm={result.primary.className} /></Suspense></div>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

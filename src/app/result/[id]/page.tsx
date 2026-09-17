import type { Metadata } from "next";
import { Bree_Serif } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
import AdSlot from "@/components/AdSlot";
import AmazonBanner from "@/components/AmazonBanner";
import AdSenseUnit from "@/components/AdSenseUnit";
import CreatorShopCard from "@/components/CreatorShopCard";
import SiteFooter from "@/components/SiteFooter";
import WowheadTooltips from "@/components/WowheadTooltips";
import LogoHomeLink from "@/components/LogoHomeLink";
import SupportButton from "@/components/SupportButton";
import { withArticle } from "@/lib/article";
import { QUIZ_VERSION } from "@/data/questions";
import { getResult } from "@/lib/result-store";
import { wowheadRacialUrl } from "@/lib/wowhead-tooltips";
import ResultActions from "./ResultActions";
import ResultCompletion from "./ResultCompletion";
import { ResultFeedback, ResultFeedbackProvider } from "./ResultFeedback";

interface ResultPageProps { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic";
const getCachedResult = cache(getResult);
const supportButtonFont = Bree_Serif({ subsets: ["latin"], weight: "400", display: "swap" });

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
  const quizChanged = result.quizVersion !== QUIZ_VERSION;
  const title = `${result.primary.raceName} ${result.primary.className}`;
  const summary = `This pick balances ${result.primary.classTagline} with ${result.primary.raceTagline}.`;
  const hasWowheadTooltips = result.primary.racials.some((racial) => wowheadRacialUrl(result.primary.raceId, racial.name, result.primary.classId));

  return (
    <main id="main-content" className="min-h-screen">
      {hasWowheadTooltips && <WowheadTooltips resultId={id} />}
      <ResultCompletion id={id} />
      <div className="mx-auto w-full max-w-[78rem] px-5 sm:px-8">
        <header className="pt-4 sm:pt-5">
          <LogoHomeLink />
          <div className="flex flex-col items-start gap-5">
            <p className="t-eyebrow text-[var(--bronze)]">What should I play in WoW: Forever?</p>
            <h1 className="t-display">{title}</h1>
            <p className="t-body text-[var(--dim)]">{summary}</p>
          </div>
          {quizChanged && (
            <div className="t-small mt-6 border-l-2 border-[var(--bronze)] bg-[rgba(200,150,74,.08)] px-4 py-3">
              <>The quiz questions or scoring have changed since this result was created. </>
              <Link href="/" className="link-bronze focus-ring">Retake the quiz</Link> for a current recommendation.
            </div>
          )}
        </header>

        <div className="result-layout mt-8">
          <ResultFeedbackProvider id={id}>
          <div className="space-y-8">
            <SupportButton fontClassName={supportButtonFont.className} />
            <section className="surface p-6 sm:p-8">
              <p className="t-label text-[var(--dim)]">Race</p>
              <h2 className="t-section mt-3">{result.primary.raceName}</h2>
              <p className="t-body mt-4 text-[var(--dim)]">{result.primary.whyRace}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {result.primary.racials.map((racial) => (
                  <article key={racial.name} className="inset border-l-2 border-l-[var(--plum)] p-4">
                    <h3 className={wowheadRacialUrl(result.primary.raceId, racial.name, result.primary.classId) ? undefined : "t-card"}>
                      {wowheadRacialUrl(result.primary.raceId, racial.name, result.primary.classId) ? (
                        <a
                          href={wowheadRacialUrl(result.primary.raceId, racial.name, result.primary.classId)!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {racial.name}
                        </a>
                      ) : racial.name}
                    </h3>
                    <p className="t-small mt-1 text-[var(--dim)]">{racial.description}</p>
                  </article>
                ))}
              </div>
              {hasWowheadTooltips && (
                <p className="t-small mt-4 text-[var(--dim)]">Hover over a racial name for its current Wowhead tooltip. Saved results retain the descriptions from when they were created.</p>
              )}
              <div className="mt-8 border-t border-[var(--line)] pt-8">
                <p className="t-label text-[var(--dim)]">Class</p>
                <h2 className="t-section mt-3">{result.primary.className}</h2>
                <p className="t-body mt-4 text-[var(--dim)]">{result.primary.whyClass}</p>
                <ResultFeedback position="primary" name={`${result.primary.raceName} ${result.primary.className}`} />
              </div>
            </section>

            <section className="pt-8" aria-labelledby="alternatives-title">
              <p className="t-label text-[var(--dim)]">Runner Ups</p>
              <h2 id="alternatives-title" className="t-section mt-3">Alternatives that also match your style</h2>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                {result.alternatives.map((alternative, index) => (
                  <article key={`${alternative.raceId}-${alternative.classId}`} className="surface p-6">
                    <h3 className="t-card text-[var(--bronze)]">{alternative.raceName} {alternative.className}</h3>
                    <p className="t-small mt-3 text-[var(--dim)]">{alternative.tradeoff}</p>
                    <ResultFeedback position={index === 0 ? "runner-up-1" : "runner-up-2"} name={`${alternative.raceName} ${alternative.className}`} />
                  </article>
                ))}
              </div>
            </section>

            <section className="surface p-6 sm:p-8">
              <h2 className="t-section">Share the results with your friends</h2>
              <p className="t-body mt-3 text-[var(--dim)]">These results are based on your answers, but the most important thing is having fun with your character. In the end, choose whatever you think you&apos;ll enjoy playing!</p>
              <div className="mt-6"><ResultActions /></div>
            </section>
          </div>
          </ResultFeedbackProvider>
          <div className="result-ads space-y-5">
            <CreatorShopCard />
            <Suspense fallback={<AdSlot placement="sidebar" />}><AmazonBanner placement="sidebar" equipment /></Suspense>
            <AdSenseUnit />
          </div>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

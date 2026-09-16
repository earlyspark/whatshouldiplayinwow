import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import AdSlot from "@/components/AdSlot";
import crest from "../../../../assets/crest.png";
import { indefiniteArticle, withArticle } from "@/lib/article";
import { DATA_VERSION } from "@/data/forever";
import { getResult } from "@/lib/result-store";
import ResultActions from "./ResultActions";

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

  return (
    <main id="main-content" className="min-h-screen">
      <header className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <Link href="/" className="focus-ring inline-block" aria-label="What Should I Play? — home">
            <Image src={crest} alt="" priority sizes="56px" className="h-14 w-auto" />
          </Link>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        <div className="max-w-4xl">
          <p className="t-label text-[var(--bronze)]">Your WoW Forever pick</p>
          <h1 className="t-display mt-4">You should play {indefiniteArticle(title)} <span className="text-[var(--bronze)]">{title}</span>.</h1>
          <p className="t-body mt-6 max-w-[54ch] text-[var(--dim)]">{result.primary.verdict}</p>
          <p className="stamp mt-7">Racials and combinations checked · {result.dataCheckedLabel}</p>
          {isOutdated && (
            <div className="t-small mt-6 border-l-2 border-[var(--bronze)] bg-[rgba(200,150,74,.08)] px-4 py-3">
              This result used data checked {result.dataCheckedLabel}. Newer information is available; <Link href="/#quiz" className="link-bronze focus-ring">retake the quiz</Link> for a current recommendation.
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-8">
            <section className="surface p-6 sm:p-8">
              <p className="t-label text-[var(--dim)]">Why the class fits</p>
              <h2 className="t-section mt-3">{result.primary.className}</h2>
              <p className="t-body mt-4 text-[var(--dim)]">{result.primary.whyClass}</p>
            </section>

            <div className="lg:hidden"><AdSlot placement="sidebar" /></div>

            <section className="surface p-6 sm:p-8">
              <p className="t-label text-[var(--dim)]">Why the race fits</p>
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
              <p className="t-small mt-6 text-[var(--dim)]">Forever is still evolving. Trait wording and values may change after this result’s {result.dataCheckedLabel} data review.</p>
            </section>
          </div>
          <div className="hidden lg:sticky lg:top-6 lg:block"><AdSlot placement="sidebar" /></div>
        </div>

        <section className="mt-16" aria-labelledby="alternatives-title">
          <p className="t-label text-[var(--dim)]">Close calls</p>
          <h2 id="alternatives-title" className="t-section mt-3">Two paths worth considering</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {result.alternatives.map((alternative) => (
              <article key={`${alternative.raceId}-${alternative.classId}`} className="surface p-6">
                <h3 className="t-card text-[var(--bronze)]">{alternative.raceName} {alternative.className}</h3>
                <p className="t-small mt-3 text-[var(--dim)]">{alternative.tradeoff}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10"><AdSlot placement="inline" /></div>

        <section className="surface mt-12 p-6 sm:p-8">
          <h2 className="t-section">Take this pick with you</h2>
          <p className="t-body mt-3 mb-6 max-w-[60ch] text-[var(--dim)]">This link keeps the recommendation, reasoning, alternatives, and data version you received today.</p>
          <ResultActions title={title} />
        </section>

        <section id="sources" className="t-small mt-12 border-t border-[var(--line)] pt-8 text-[var(--dim)]">
          <p className="t-label text-[var(--dim)]">Sources for this result</p>
          <ul className="mt-3 space-y-2">
            {result.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="link-bronze focus-ring">{source.label}</a></li>)}
          </ul>
          <p className="mt-7">Unofficial fan-made quiz. World of Warcraft and related marks belong to Blizzard Entertainment. Not affiliated with or endorsed by Blizzard.</p>
          {process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG && <p className="mt-3">As an Amazon Associate, this site may earn from qualifying purchases.</p>}
        </section>
      </div>
    </main>
  );
}

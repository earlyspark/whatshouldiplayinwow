import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { DATA_VERSION } from "@/data/forever";
import { getResult } from "@/lib/result-store";
import ResultActions from "./ResultActions";

interface ResultPageProps { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getResult(id);
  if (!result) return { title: "Result not found", robots: { index: false, follow: false } };
  const name = `${result.primary.raceName} ${result.primary.className}`;
  const description = `My WoW Forever pick is ${name}. ${result.primary.verdict}`;
  return {
    title: `You should play a ${name}`,
    description,
    robots: { index: false, follow: true },
    openGraph: { title: `You should play a ${name}`, description, type: "article", url: `/result/${id}` },
    twitter: { card: "summary_large_image", title: `You should play a ${name}`, description },
  };
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const result = await getResult(id);
  if (!result) notFound();
  const isOutdated = result.dataVersion !== DATA_VERSION;
  const title = `${result.primary.raceName} ${result.primary.className}`;

  return (
    <main id="main-content" className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-8 sm:px-8">
        <Link href="/" className="display-font text-lg font-bold text-[var(--gold-bright)]">What Should I Pick?</Link>
        <Link href="/methodology" className="focus-ring rounded text-sm text-[var(--muted)] hover:text-white">How it works</Link>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        <div className="max-w-4xl">
          <p className="eyebrow">Your WoW Forever pick</p>
          <h1 className="display-font mt-4 text-5xl leading-[0.96] sm:text-7xl">You should play a <span className="text-[var(--gold-bright)]">{title}</span>.</h1>
          <p className="mt-7 max-w-3xl text-xl leading-8 text-[var(--muted)] sm:text-2xl sm:leading-9">{result.primary.verdict}</p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/[.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--teal)]">
            <span aria-hidden="true">◉</span> Data checked {result.dataCheckedLabel}
          </div>
          {isOutdated && (
            <div className="mt-5 rounded-2xl border border-[rgba(215,173,97,.35)] bg-[rgba(215,173,97,.08)] p-4 text-sm leading-6">
              This result used data checked {result.dataCheckedLabel}. Newer information is available; <Link href="/#quiz" className="font-bold underline underline-offset-4">retake the quiz</Link> for a current recommendation.
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-8">
            <section className="glass-panel rounded-3xl p-6 sm:p-8">
              <p className="eyebrow">Why the class fits</p>
              <h2 className="display-font mt-3 text-3xl">{result.primary.className}</h2>
              <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{result.primary.whyClass}</p>
            </section>

            <div className="lg:hidden"><AdSlot placement="sidebar" /></div>

            <section className="glass-panel rounded-3xl p-6 sm:p-8">
              <p className="eyebrow">Why the race fits</p>
              <h2 className="display-font mt-3 text-3xl">{result.primary.raceName}</h2>
              <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{result.primary.whyRace}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {result.primary.racials.map((racial) => (
                  <article key={racial.name} className="rounded-2xl border border-[var(--line)] bg-black/15 p-4">
                    <h3 className="font-bold text-[var(--gold-bright)]">{racial.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{racial.description}</p>
                  </article>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Forever is still evolving. Trait wording and values may change after this result’s {result.dataCheckedLabel} data review.</p>
            </section>
          </div>
          <div className="hidden lg:sticky lg:top-6 lg:block"><AdSlot placement="sidebar" /></div>
        </div>

        <section className="mt-16" aria-labelledby="alternatives-title">
          <p className="eyebrow">Close calls</p>
          <h2 id="alternatives-title" className="display-font mt-3 text-4xl">Two paths worth considering</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {result.alternatives.map((alternative) => (
              <article key={`${alternative.raceId}-${alternative.classId}`} className="rounded-3xl border border-[var(--line)] bg-white/[.025] p-6">
                <h3 className="display-font text-3xl text-[var(--gold-bright)]">{alternative.raceName} {alternative.className}</h3>
                <p className="mt-4 leading-7 text-[var(--muted)]">{alternative.tradeoff}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10"><AdSlot placement="inline" /></div>

        <section className="mt-12 rounded-3xl border border-[var(--line)] bg-white/[.025] p-6 sm:p-8">
          <h2 className="display-font text-3xl">Take this pick with you</h2>
          <p className="mt-3 mb-6 max-w-2xl leading-7 text-[var(--muted)]">This link keeps the recommendation, reasoning, alternatives, and data version you received today.</p>
          <ResultActions title={title} />
        </section>

        <section className="mt-12 border-t border-[var(--line)] pt-8 text-sm leading-6 text-[var(--muted)]">
          <p className="font-bold text-white">Sources for this result</p>
          <ul className="mt-3 space-y-2">
            {result.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-white">{source.label}</a></li>)}
          </ul>
          <p className="mt-7">Unofficial fan-made quiz. World of Warcraft and related marks belong to Blizzard Entertainment. Not affiliated with or endorsed by Blizzard.</p>
          {process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG && <p className="mt-3">As an Amazon Associate, this site may earn from qualifying purchases.</p>}
        </section>
      </div>
    </main>
  );
}

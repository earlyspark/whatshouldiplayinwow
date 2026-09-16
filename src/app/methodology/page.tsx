import type { Metadata } from "next";
import Link from "next/link";
import { DATA_CHECKED_LABEL, DATA_SOURCES, classes, races } from "@/data/forever";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Quiz methodology and Forever data",
  description: "See how the What Should I Pick? quiz scores playstyle, ranks race and class combinations, and keeps WoW Forever data current.",
  alternates: { canonical: `${siteUrl}/methodology` },
};

export default function MethodologyPage() {
  return (
    <main id="main-content">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-8 sm:px-8">
        <Link href="/" className="display-font text-lg font-bold text-[var(--gold-bright)]">What Should I Pick?</Link>
        <Link href="/#quiz" className="focus-ring rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-bold text-[#172022]">Take the quiz</Link>
      </header>

      <article className="mx-auto max-w-4xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <p className="eyebrow">Transparent by design</p>
        <h1 className="display-font mt-4 text-5xl leading-tight sm:text-6xl">How the recommendation works</h1>
        <p className="mt-6 text-xl leading-9 text-[var(--muted)]">The quiz is not a simulated conversation or a hidden AI judgment. It is a versioned scoring model built around the way you want to fight, adventure, contribute, and inhabit Azeroth.</p>

        <div className="gold-rule my-12" />

        <section className="space-y-5">
          <h2 className="display-font text-3xl">The scoring model</h2>
          <p className="leading-8 text-[var(--muted)]">Class fit makes up 65% of the final score; race fit makes up 35%. Faction and confirmed race/class availability are hard gates. Ranked answers use normalized 5:3:1 weighting, so a first choice matters most without rewarding people simply for choosing more options.</p>
          <p className="leading-8 text-[var(--muted)]">The combat-instinct question receives extra weight because wanting to dive into the fray or deliberately read a fight from the back line changes the lived experience of a class. Dealbreakers subtract points. They do not silently remove a class.</p>
        </section>

        <section className="mt-12">
          <h2 className="display-font text-3xl">How alternatives are chosen</h2>
          <ol className="mt-5 space-y-3 text-[var(--muted)]">
            <li><strong className="text-white">1.</strong> The highest-scoring valid race/class combination is the primary pick.</li>
            <li><strong className="text-white">2.</strong> The first alternative keeps the class and shows the strongest different race.</li>
            <li><strong className="text-white">3.</strong> The second alternative changes class and shows a genuinely different path.</li>
          </ol>
        </section>

        <section className="mt-12">
          <p className="eyebrow">Current pool</p>
          <h2 className="display-font mt-3 text-3xl">Nine classes, ten faction-specific races</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {classes.map((item) => <span key={item.id} className="rounded-full border border-[var(--line)] bg-white/[.03] px-3 py-2 text-sm">{item.name}</span>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {races.map((item) => <span key={item.id} className="rounded-full border border-[var(--line)] bg-white/[.03] px-3 py-2 text-sm">{item.name}</span>)}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-[var(--line)] bg-white/[.025] p-6 sm:p-8">
          <p className="eyebrow">Freshness</p>
          <h2 className="display-font mt-3 text-3xl">Last checked {DATA_CHECKED_LABEL}</h2>
          <p className="mt-4 leading-8 text-[var(--muted)]">Forever is still evolving, so every stored result records the data version that created it. When the source data changes, old links retain their original reasoning and clearly offer a current retake.</p>
          <ul className="mt-6 space-y-3">
            {DATA_SOURCES.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-white">{source.label}</a></li>)}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="display-font text-3xl">What this quiz does not claim</h2>
          <p className="mt-5 leading-8 text-[var(--muted)]">It does not predict the future meta, prescribe a specialization, or promise that one racial is universally best. It turns your preferences into a useful starting point with an explanation you can inspect.</p>
        </section>
      </article>
    </main>
  );
}

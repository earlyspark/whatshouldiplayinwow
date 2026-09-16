import type { Metadata } from "next";
import Link from "next/link";
import QuizFlow from "./QuizFlow";
import { DATA_CHECKED_LABEL } from "@/data/forever";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "WoW Forever Race & Class Quiz",
  description: "Which World of Warcraft: Forever race and class should you play? Rank your playstyle, fantasy, and favorite content to get a personalized pick.",
  alternates: { canonical: siteUrl },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "What Should I Pick? WoW Forever Race & Class Quiz",
        url: siteUrl,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        description: "A deterministic quiz that recommends a World of Warcraft: Forever race and class from playstyle and preference answers.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Does the quiz pick a specialization?",
            acceptedAnswer: { "@type": "Answer", text: "No. The result recommends a race and class without prescribing a specialization or build." },
          },
          {
            "@type": "Question",
            name: "Is this a best-DPS calculator?",
            acceptedAnswer: { "@type": "Answer", text: "No. It balances class playstyle, faction, character identity, preferred content, and situational racial utility." },
          },
          {
            "@type": "Question",
            name: "What happens when World of Warcraft: Forever changes?",
            acceptedAnswer: { "@type": "Answer", text: "The data is versioned. Existing links retain the result they were created with, while new results use the latest reviewed information." },
          },
        ],
      },
    ],
  };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12">
        <nav className="flex items-center justify-between gap-4" aria-label="Primary navigation">
          <Link href="/" className="display-font text-lg font-bold text-[var(--gold-bright)]">What Should I Pick?</Link>
          <Link href="/methodology" className="focus-ring rounded-md text-sm text-[var(--muted)] hover:text-white">How it works</Link>
        </nav>
        <div className="mx-auto max-w-4xl pb-8 pt-20 text-center sm:pb-12 sm:pt-28">
          <p className="eyebrow">World of Warcraft: Forever</p>
          <h1 className="display-font mt-5 text-5xl leading-[0.98] sm:text-7xl">Which race and class should you pick?</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">A playstyle-first quiz for new adventurers, returning veterans, and everyone still staring at character creation.</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">Data last checked {DATA_CHECKED_LABEL}</p>
        </div>
      </header>

      <div className="px-4 sm:px-6"><QuizFlow /></div>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-24 sm:px-8 md:grid-cols-3" aria-labelledby="why-title">
        <div className="md:col-span-3">
          <p className="eyebrow">Built for an actual decision</p>
          <h2 id="why-title" className="display-font mt-3 max-w-2xl text-4xl sm:text-5xl">More than a disguised racial-trait picker.</h2>
        </div>
        {[
          ["Your pace", "Whether you charge into a fight or prefer time and distance to read it."],
          ["Your people", "How you like to adventure—from quiet solo progress to coordinated raid nights."],
          ["Your priorities", "The class fantasy, content, identity, and situational utility you actually care about."],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-3xl border border-[var(--line)] bg-white/[.025] p-6">
            <h3 className="display-font text-2xl text-[var(--gold-bright)]">{title}</h3>
            <p className="mt-3 leading-7 text-[var(--muted)]">{copy}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-[var(--line)] bg-black/15">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
          <p className="eyebrow">Questions people ask</p>
          <h2 className="display-font mt-3 text-4xl">Before you choose</h2>
          <div className="mt-8 divide-y divide-[var(--line)]">
            <details className="group py-5" open><summary className="focus-ring cursor-pointer list-none font-bold">Does the quiz pick a specialization?</summary><p className="mt-3 leading-7 text-[var(--muted)]">No. Forever’s class details are still developing, so the result recommends a race and class without pretending the final build meta is settled.</p></details>
            <details className="group py-5"><summary className="focus-ring cursor-pointer list-none font-bold">Is this a best-DPS calculator?</summary><p className="mt-3 leading-7 text-[var(--muted)]">No. It balances class playstyle, faction, character identity, preferred content, and situational racial utility.</p></details>
            <details className="group py-5"><summary className="focus-ring cursor-pointer list-none font-bold">What happens when Forever changes?</summary><p className="mt-3 leading-7 text-[var(--muted)]">The data is versioned. Existing links keep the result they were created with, while newer visitors use the latest reviewed information.</p></details>
          </div>
          <Link href="/methodology" className="focus-ring mt-8 inline-block rounded-full border border-[var(--gold)] px-5 py-3 text-sm font-bold text-[var(--gold-bright)] hover:bg-white/5">Read the methodology</Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm leading-6 text-[var(--muted)] sm:px-8">
        <p>Unofficial fan-made quiz. World of Warcraft and related marks belong to Blizzard Entertainment. Not affiliated with or endorsed by Blizzard.</p>
      </footer>
    </main>
  );
}

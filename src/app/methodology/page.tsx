import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import crest from "../../../assets/crest.png";
import { DATA_CHECKED_LABEL, DATA_SOURCES, classes, races } from "@/data/forever";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Quiz methodology and Forever data",
  description: "See how the What Should I Play? quiz scores playstyle, ranks race and class combinations, and keeps WoW Forever data current.",
  alternates: { canonical: `${siteUrl}/methodology` },
};

export default function MethodologyPage() {
  return (
    <main id="main-content">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-8 sm:px-8">
        <Link href="/" className="focus-ring inline-block" aria-label="What Should I Play? — home">
            <Image src={crest} alt="" priority sizes="56px" className="h-14 w-auto" />
          </Link>
        <Link href="/#quiz" className="btn focus-ring">Take the quiz</Link>
      </header>

      <article className="mx-auto max-w-4xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <p className="t-label text-[var(--bronze)]">Transparent by design</p>
        <h1 className="t-display mt-4">How the recommendation works</h1>
        <p className="t-body mt-6 max-w-[62ch] text-[var(--dim)]">The quiz is not a simulated conversation or a hidden AI judgment. It is a versioned scoring model built around the way you want to fight, adventure, contribute, and inhabit Azeroth.</p>

        <div className="my-12 h-px bg-[var(--line)]" />

        <section className="space-y-5">
          <h2 className="t-section">The scoring model</h2>
          <p className="t-body max-w-[66ch] text-[var(--dim)]">Class fit makes up 65% of the final score; race fit makes up 35%. Faction and confirmed race/class availability are hard gates. Ranked answers use normalized 5:3:1 weighting, so a first choice matters most without rewarding people simply for choosing more options.</p>
          <p className="t-body max-w-[66ch] text-[var(--dim)]">The combat-instinct question receives extra weight because wanting to dive into the fray or deliberately read a fight from the back line changes the lived experience of a class. Dealbreakers subtract points. They do not silently remove a class.</p>
        </section>

        <section className="mt-12">
          <h2 className="t-section">How alternatives are chosen</h2>
          <ol className="t-body mt-5 max-w-[66ch] space-y-3 text-[var(--dim)]">
            <li><strong className="text-[var(--bone)]">1.</strong> The highest-scoring valid race/class combination is the primary pick.</li>
            <li><strong className="text-[var(--bone)]">2.</strong> The first alternative keeps the class and shows the strongest different race.</li>
            <li><strong className="text-[var(--bone)]">3.</strong> The second alternative changes class and shows a genuinely different path.</li>
          </ol>
        </section>

        <section className="mt-12">
          <p className="t-label text-[var(--dim)]">Current pool</p>
          <h2 className="t-section mt-3">Nine classes, ten faction-specific races</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {classes.map((item) => <span key={item.id} className="t-small border border-[var(--line)] bg-[var(--raised)] px-3 py-1.5">{item.name}</span>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {races.map((item) => <span key={item.id} className="t-small border border-[var(--line)] bg-[var(--raised)] px-3 py-1.5">{item.name}</span>)}
          </div>

          <h3 className="t-card mt-10">Current race and class combinations</h3>
          <p className="t-small mt-3 max-w-[66ch] text-[var(--dim)]">A recommendation is only eligible when the combination appears below. On smaller screens, scroll the table horizontally.</p>
          <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8">
            <table className="min-w-[880px] border-separate border-spacing-0 text-sm">
              <caption className="sr-only">Available WoW Forever classes for each faction-specific race, checked {DATA_CHECKED_LABEL}</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 border-b border-[var(--line)] bg-[var(--ground)] px-4 py-3 text-left font-semibold">Race</th>
                  {classes.map((item) => <th key={item.id} scope="col" className="border-b border-[var(--line)] px-3 py-3 text-center font-bold">{item.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {races.map((race) => (
                  <tr key={race.id}>
                    <th scope="row" className="sticky left-0 z-10 border-b border-[var(--line)] bg-[var(--ground)] px-4 py-3 text-left font-semibold">
                      {race.name}
                      <span className="t-label mt-1 block text-[var(--dim)]">{race.faction}</span>
                    </th>
                    {classes.map((classProfile) => {
                      const available = race.classes.includes(classProfile.id);
                      return (
                        <td key={classProfile.id} className="border-b border-[var(--line)] px-3 py-3 text-center">
                          <span className={available ? "text-[var(--bronze)]" : "text-[var(--dim)] opacity-30"} aria-label={available ? `${race.name} can be a ${classProfile.name}` : `${race.name} cannot be a ${classProfile.name}`}>
                            {available ? "✓" : "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface mt-12 p-6 sm:p-8">
          <p id="sources" className="t-label text-[var(--dim)]">Freshness</p>
          <h2 className="t-section mt-3">Last checked {DATA_CHECKED_LABEL}</h2>
          <p className="t-body mt-4 max-w-[62ch] text-[var(--dim)]">Forever is still evolving, so every stored result records the data version that created it. When the source data changes, old links retain their original reasoning and clearly offer a current retake.</p>
          <ul className="mt-6 space-y-3">
            {DATA_SOURCES.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="link-bronze focus-ring">{source.label}</a></li>)}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="t-section">What this quiz does not claim</h2>
          <p className="t-body mt-5 max-w-[66ch] text-[var(--dim)]">It does not predict the future meta, prescribe a specialization, or promise that one racial is universally best. It turns your preferences into a useful starting point with an explanation you can inspect.</p>
        </section>
      </article>
    </main>
  );
}

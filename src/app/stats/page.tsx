import type { Metadata } from "next";
import Link from "next/link";
import { classes, races } from "@/data/forever";
import { questions } from "@/data/questions";
import { feedbackPositions } from "@/lib/feedback-types";
import { readMonthlyQuizStats, type MonthlyQuizStats } from "@/lib/quiz-stats";
import { VersionFeedback } from "./VersionFeedback";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quiz stats", robots: { index: false, follow: false } };

const earlierEraOptions = [
  { id: "original-cata", label: "Vanilla WoW through Cataclysm (earlier quiz)" },
  { id: "mists-legion", label: "Mists of Pandaria through Legion (earlier quiz)" },
];

function percent(count: number, total: number) {
  return total ? `${Math.round((count / total) * 100)}%` : "0%";
}

function combinedCounts(months: MonthlyQuizStats[]) {
  const counts: Record<string, number> = {};
  for (const month of months) {
    for (const [key, value] of Object.entries(month.counts)) counts[key] = (counts[key] ?? 0) + value;
  }
  return counts;
}

function ResultsBreakdown({ counts, prefix = "" }: { counts: Record<string, number>; prefix?: string }) {
  return (
    <div className="mt-10 grid gap-8 sm:grid-cols-2">
      <div>
        <h3 className="t-card">Recommended classes</h3>
        {classes.map((item) => (
          <div key={item.id} className="t-small flex justify-between gap-3 border-b border-[var(--line)] py-1.5">
            <span>{item.name}</span><span className="text-[var(--dim)]">{counts[`${prefix}result:class:${item.id}`] ?? 0}</span>
          </div>
        ))}
      </div>
      <div>
        <h3 className="t-card">Recommended races</h3>
        {races.map((item) => (
          <div key={item.id} className="t-small flex justify-between gap-3 border-b border-[var(--line)] py-1.5">
            <span>{item.name}</span><span className="text-[var(--dim)]">{counts[`${prefix}result:race:${item.id}`] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSection({ title, counts }: { title: string; counts: Record<string, number> }) {
  const total = counts.total ?? 0;
  const hasFeedback = feedbackPositions.some((position) => (counts[`feedback:${position}:up`] ?? 0) + (counts[`feedback:${position}:down`] ?? 0) > 0);
  return (
    <section className="surface p-6 sm:p-8">
      <h2 className="t-section">{title}</h2>
      <p className="t-body mt-2 text-[var(--dim)]">{total.toLocaleString()} completed {total === 1 ? "result" : "results"}</p>
      {(total > 0 || hasFeedback) && (
        <div className="mt-8">
          <h3 className="t-card">Recommendation feedback</h3>
          <p className="t-small mt-2 text-[var(--dim)]">Ratings from quiz-takers only. Each pick can receive one current rating; changing it replaces the earlier vote.</p>
          <div className="mt-3 space-y-2">
            {feedbackPositions.map((position, index) => {
              const up = counts[`feedback:${position}:up`] ?? 0;
              const down = counts[`feedback:${position}:down`] ?? 0;
              const responses = up + down;
              return (
                <div key={position} className="flex flex-wrap justify-between gap-x-4 border-b border-[var(--line)] py-2 t-small">
                  <span>{["First recommendation", "Second recommendation", "Third recommendation"][index]}</span>
                  <span className="text-[var(--dim)]">{up.toLocaleString()} 👍 · {down.toLocaleString()} 👎 · {responses.toLocaleString()} {responses === 1 ? "response" : "responses"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {total > 0 && questions.map((question) => (
        <div key={question.id} className="mt-8">
          <h3 className="t-card">{question.prompt}</h3>
          <div className="mt-3 space-y-2">
            {[...question.options, ...(question.id === "q1" ? earlierEraOptions.filter((option) => counts[`answer:q1:${option.id}`]) : [])].map((option) => {
              const count = counts[`answer:${question.id}:${option.id}`] ?? 0;
              const first = counts[`first:${question.id}:${option.id}`] ?? 0;
              return (
                <div key={option.id} className="flex justify-between gap-4 border-b border-[var(--line)] py-1.5 t-small">
                  <span>{option.label}</span>
                  <span className="shrink-0 text-right text-[var(--dim)]">
                    {count.toLocaleString()} · {percent(count, total)}
                    {question.type === "ranked" && <span className="block text-xs">1st: {first.toLocaleString()}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {total > 0 && <ResultsBreakdown counts={counts} />}
    </section>
  );
}

export default async function StatsPage() {
  const months = await readMonthlyQuizStats();
  const allTime = combinedCounts(months);
  const versionIds = [...new Set(Object.keys(allTime).flatMap((key) => {
    const match = key.match(/^version:([^:]+):(?:result:class:|feedback:)/);
    return match ? [match[1]] : [];
  }))].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Link href="/" className="link-bronze focus-ring">← Home</Link>
      <h1 className="t-display mt-8">Quiz stats</h1>
      <p className="t-body mb-8 mt-4 text-[var(--dim)]">
        Counted once when the quiz-taker reaches their result page. Retakes count as new results; reloads and shared-link visits do not.
        Ranked-answer percentages can add up to more than 100%. Totals begin when this feature is deployed, with no retroactive count.
        Local and preview results are never tallied.
        Recommendation feedback starts when this feature is deployed.
        Version-separated recommendation counts start when this update is deployed and are not backfilled; earlier results remain in the all-time and monthly totals.
      </p>
      {months.length === 0 && <p className="t-body mb-8">No production completions have been counted yet.</p>}
      <div className="space-y-8">
        <StatsSection title="All time" counts={allTime} />
        {versionIds.map((version) => (
          <section key={version} className="surface p-6 sm:p-8">
            <h2 className="t-section">Quiz version {version}</h2>
            <p className="t-body mt-2 text-[var(--dim)]">
              {classes.reduce((total, item) => total + (allTime[`version:${version}:result:class:${item.id}`] ?? 0), 0).toLocaleString()} completed results counted since version-separated tracking began.
            </p>
            <ResultsBreakdown counts={allTime} prefix={`version:${version}:`} />
            <VersionFeedback counts={allTime} version={version} />
          </section>
        ))}
        {months.map((month) => <StatsSection key={month.month} title={month.month} counts={month.counts} />)}
      </div>
    </main>
  );
}

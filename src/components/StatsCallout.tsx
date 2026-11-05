import TrackedLink from "@/components/TrackedLink";
import { STATS_SNAPSHOT_RESULTS } from "@/data/stats-snapshot";

export default function StatsCallout() {
  return (
    <aside aria-labelledby="stats-callout-title" className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-8 sm:px-6">
      <div className="min-w-0 flex-1">
        <p id="stats-callout-title" className="t-eyebrow text-[var(--bronze)]">Quiz results · {STATS_SNAPSHOT_RESULTS.toLocaleString("en-US")} players</p>
        <p className="t-small mt-2">See how other players answered and which races and classes came up most.</p>
      </div>
      <TrackedLink href="/about#stats" className="link-bronze focus-ring t-small shrink-0 self-start sm:self-auto">See the results →</TrackedLink>
    </aside>
  );
}

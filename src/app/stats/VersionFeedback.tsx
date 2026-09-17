import { classes } from "@/data/forever";
import { versionClassFeedbackField, versionFeedbackField, versionPairedFeedbackField } from "@/lib/feedback-stats";

export function VersionFeedback({ counts, version }: { counts: Record<string, number>; version: string }) {
  const positions = ["primary", "runner-up-1", "runner-up-2"] as const;
  const labels = ["First", "Second: same class, another race", "Third: different class"];
  const hasVotes = positions.some((position) =>
    (counts[versionFeedbackField(version, position, "up")] ?? 0) +
    (counts[versionFeedbackField(version, position, "down")] ?? 0) > 0,
  );
  if (!hasVotes) return <p className="t-small mt-6 text-[var(--dim)]">No newly tracked feedback for this quiz version yet.</p>;

  return (
    <div className="mt-8">
      <h3 className="t-card">Feedback for this quiz version</h3>
      <p className="t-small mt-2 text-[var(--dim)]">
        Tracked from this update onward, including later votes on older saved results. Earlier votes are not backfilled.
        Ratings are voluntary; small differences and small samples do not establish recommendation accuracy.
      </p>
      <div className="mt-3 space-y-2">
        {positions.map((position, index) => {
          const up = counts[versionFeedbackField(version, position, "up")] ?? 0;
          const down = counts[versionFeedbackField(version, position, "down")] ?? 0;
          return (
            <div key={position} className="t-small flex flex-wrap justify-between gap-x-4 border-b border-[var(--line)] py-2">
              <span>{labels[index]}</span>
              <span className="text-[var(--dim)]">{up} 👍 · {down} 👎 · {up + down} responses</span>
            </div>
          );
        })}
      </div>
      <h4 className="t-card mt-7">When both recommendations were rated</h4>
      <p className="t-small mt-2 text-[var(--dim)]">The denominator includes only results with both votes tracked after this update; one person can like more than one recommendation.</p>
      <div className="mt-3 space-y-2">
        {(["runner-up-1", "runner-up-2"] as const).map((alternative, index) => {
          const firstDownOtherUp = counts[versionPairedFeedbackField(version, alternative, "down", "up")] ?? 0;
          const both = (["up", "down"] as const).reduce((total, first) =>
            total + (["up", "down"] as const).reduce((subtotal, other) =>
              subtotal + (counts[versionPairedFeedbackField(version, alternative, first, other)] ?? 0), 0), 0);
          return (
            <div key={alternative} className="t-small flex flex-wrap justify-between gap-x-4 border-b border-[var(--line)] py-2">
              <span>First 👎, {index === 0 ? "second" : "third"} 👍</span>
              <span className="text-[var(--dim)]">{firstDownOtherUp} of {both} both-rated results</span>
            </div>
          );
        })}
      </div>
      <h4 className="t-card mt-7">Ratings by recommended class</h4>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-left t-small">
          <thead><tr className="border-b border-[var(--line)]"><th scope="col" className="py-2 pr-4">Class</th>{labels.map((label) => <th scope="col" key={label} className="py-2 pr-4">{label}</th>)}</tr></thead>
          <tbody>{classes.map((item) => (
            <tr key={item.id} className="border-b border-[var(--line)]">
              <th scope="row" className="py-2 pr-4 font-normal">{item.name}</th>
              {positions.map((position) => (
                <td key={position} className="py-2 pr-4 text-[var(--dim)]">
                  {counts[versionClassFeedbackField(version, item.id, position, "up")] ?? 0} 👍 · {counts[versionClassFeedbackField(version, item.id, position, "down")] ?? 0} 👎
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

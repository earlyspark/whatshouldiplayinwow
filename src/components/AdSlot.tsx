interface AdSlotProps {
  placement: "sidebar" | "inline";
  href?: string;
  headline?: string;
  body?: string;
}

export default function AdSlot({ placement, href, headline, body }: AdSlotProps) {
  const size = placement === "sidebar" ? "min-h-[250px] lg:min-h-[300px]" : "min-h-[110px]";
  return (
    <aside className={`${size} flex w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-5 text-center`} aria-label="Advertisement">
      {href && headline ? (
        <a href={href} target="_blank" rel="sponsored nofollow" className="focus-ring rounded-lg text-sm hover:text-white">
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Advertisement</span>
          <strong className="mt-3 block text-[var(--gold-bright)]">{headline}</strong>
          {body && <span className="mt-2 block leading-6 text-[var(--muted)]">{body}</span>}
        </a>
      ) : (
        <div>
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Advertisement</span>
          <span className="mt-2 block text-xs text-white/25">Reserved ad space</span>
        </div>
      )}
    </aside>
  );
}

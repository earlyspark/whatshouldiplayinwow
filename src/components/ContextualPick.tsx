import AmazonProductLink from "@/components/AmazonProductLink";
import { getContextualProduct } from "@/lib/amazon";

interface ContextualPickProps {
  /** Wording that ties the recommendation to the surrounding section. */
  lead: string;
  /**
   * Stable input for choosing the product. The same seed always resolves to the
   * same product, so a shared permalink reads the same on every visit.
   */
  seed: string;
  /** Overrides the configured pool query, e.g. to match a quiz result. */
  keywords?: string;
}

/**
 * In-content affiliate text link.
 *
 * Text links sit next to the content rather than in a banner slot, which is the
 * format that actually converts for affiliates. This renders nothing when there
 * is no product to show, so the surrounding prose is never left dangling.
 */
export default async function ContextualPick({ lead, seed, keywords }: ContextualPickProps) {
  const product = await getContextualProduct(seed, keywords);
  if (!product) return null;

  return (
    <p className="mt-5 border-l-2 border-[var(--gold-bright)]/40 pl-4 text-sm leading-6 text-[var(--muted)]">
      {lead}{" "}
      <AmazonProductLink
        href={product.url}
        asin={product.asin}
        placement="inline"
        className="focus-ring rounded font-bold text-[var(--gold-bright)] underline decoration-[var(--gold-bright)]/40 underline-offset-4 hover:text-white"
      >
        {product.title}
      </AmazonProductLink>
      {product.price && <span> — {product.price}</span>}
      <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.12em] text-white/30">
        Paid link · As an Amazon Associate this site earns from qualifying purchases
      </span>
    </p>
  );
}

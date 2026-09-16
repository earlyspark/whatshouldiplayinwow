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
  focusTerm?: string;
}

/**
 * In-content affiliate text link.
 *
 * Text links sit next to the content rather than in a banner slot, which is the
 * format that actually converts for affiliates. This renders nothing when there
 * is no product to show, so the surrounding prose is never left dangling.
 */
export default async function ContextualPick({ lead, seed, keywords, focusTerm }: ContextualPickProps) {
  const product = await getContextualProduct(seed, keywords, focusTerm);
  if (!product) return null;

  return (
    <p className="t-small mt-5 border-l-2 border-[var(--plum)] pl-4 text-[var(--dim)]">
      {lead}{" "}
      <AmazonProductLink
        href={product.url}
        asin={product.asin}
        placement="inline"
        className="link-bronze focus-ring font-semibold"
      >
        {product.title}
      </AmazonProductLink>
      <span className="t-label mt-1 block text-[var(--dim)] opacity-60">
        Paid link · As an Amazon Associate this site earns from qualifying purchases
      </span>
    </p>
  );
}

import AmazonProductLink from "@/components/AmazonProductLink";
import { getContextualProduct } from "@/lib/amazon";

interface ContextualPickProps {
  lead: string;
  seed: string;
  keywords?: string;
  focusTerm?: string;
}

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
      <span className="t-label mt-1 block text-[var(--dim)]">
        Paid link · As an Amazon Associate this site earns from qualifying purchases
      </span>
    </p>
  );
}

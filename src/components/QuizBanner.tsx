"use client";

import { useEffect, useState } from "react";
import AmazonProductLink from "@/components/AmazonProductLink";
import type { AmazonProduct } from "@/lib/amazon";

interface QuizBannerProps {
  /** Zero-based question index. Advancing the quiz advances the product. */
  questionIndex: number;
}

/**
 * Affiliate banner for the quiz, rotating one product per question.
 *
 * The pool is fetched once and then indexed by question, so moving back and
 * forth through the quiz shows a stable product per step rather than
 * reshuffling under the reader. Renders nothing until there is something to
 * show, so the quiz layout does not jump on load.
 */
export default function QuizBanner({ questionIndex }: QuizBannerProps) {
  const [products, setProducts] = useState<AmazonProduct[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/product-pool")
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data) => {
        if (active) setProducts(data.products ?? []);
      })
      .catch(() => {
        // An ad that fails to load is not worth surfacing to the reader.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!products.length) return null;
  const product = products[questionIndex % products.length];

  return (
    <aside
      className="mx-auto mt-6 flex max-w-3xl items-center gap-4 rounded-2xl border border-[var(--line)] bg-white/[.025] p-4"
      aria-label="Advertisement"
    >
      {product.imageUrl && (
        // Amazon requires product images unmodified from its own CDN, so
        // next/image optimisation is deliberately not used.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt=""
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-lg bg-white/90 object-contain p-1"
        />
      )}
      <div className="min-w-0">
        <span className="block text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          Advertisement
        </span>
        <AmazonProductLink
          href={product.url}
          asin={product.asin}
          placement="inline"
          className="focus-ring mt-1 block truncate text-sm font-semibold text-[var(--gold-bright)] hover:text-white"
        >
          {product.title}
        </AmazonProductLink>
        <span className="mt-0.5 block text-xs text-[var(--muted)]">
          {product.price ? `${product.price} · ` : ""}Paid link
        </span>
      </div>
    </aside>
  );
}

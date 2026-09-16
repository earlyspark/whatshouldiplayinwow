"use client";

import { useEffect, useState } from "react";
import AmazonProductLink from "@/components/AmazonProductLink";
import type { AmazonProduct } from "@/lib/amazon";

interface QuizBannerProps {
  /** Zero-based question index. Advancing the quiz advances the product. */
  questionIndex: number;
  layout?: "banner" | "sidebar";
}

interface ProductPoolResponse {
  products: AmazonProduct[];
  pinnedAsin: string | null;
}

/** A six-hour search pool, with a stable rotation during this page visit. */
export default function QuizBanner({ questionIndex, layout = "banner" }: QuizBannerProps) {
  const [pool, setPool] = useState<ProductPoolResponse>({ products: [], pinnedAsin: null });
  const [visitOffset, setVisitOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/product-pool")
      .then((response) => (response.ok ? response.json() : { products: [], pinnedAsin: null }))
      .then((data: ProductPoolResponse) => {
        if (active && Array.isArray(data.products)) {
          setVisitOffset(window.crypto.getRandomValues(new Uint32Array(1))[0]);
          setPool(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const pinned = pool.products.find((product) => product.asin === pool.pinnedAsin);
  const rotating = pool.products.filter((product) => product.asin !== pool.pinnedAsin);
  const step = Math.max(0, questionIndex + 1);
  const start = rotating.length ? (visitOffset + step * 3) % rotating.length : 0;
  const products = [
    ...(pinned ? [pinned] : []),
    ...Array.from({ length: Math.min(pinned ? 3 : 4, rotating.length) }, (_, index) => rotating[(start + index) % rotating.length]),
  ];

  return (
    <aside
      className={`surface min-h-[240px] w-full p-5 sm:p-6 ${layout === "banner" ? "mb-8" : ""}`}
      aria-label="Advertisement"
    >
      <span className="t-label block text-[var(--dim)]">Advertisement</span>
      {products.length ? (
        <div className={`mt-4 grid grid-cols-2 gap-3 ${layout === "banner" ? "lg:grid-cols-4" : ""}`}>
          {products.map((product) => (
            <AmazonProductLink
              key={product.asin}
              href={product.url}
              asin={product.asin}
              placement="inline"
              className={`focus-ring group flex min-w-0 flex-col gap-2 rounded-xl bg-white/[.03] transition-colors hover:bg-white/[.07] ${layout === "sidebar" ? "p-2" : "p-3"}`}
            >
              {product.imageUrl && (
                // Amazon images are served directly, without transformation.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt="" loading="lazy" className={`w-full rounded-lg bg-white/90 object-contain p-2 ${layout === "sidebar" ? "h-24" : "h-28 sm:h-32"}`} />
              )}
              <span className="t-small line-clamp-2 text-[var(--dim)] group-hover:text-[var(--bone)]">{product.title}</span>
            </AmazonProductLink>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex min-h-36 items-center justify-center text-center">
          <span className="t-small text-[var(--dim)] opacity-60">
            {loaded ? "Product picks unavailable right now" : "Loading product picks…"}
          </span>
        </div>
      )}
      <p className="t-small mt-4 text-[var(--dim)] opacity-70">
        Ads help me pay the bills for this site, thanks for supporting a small creator! As an Amazon Associate, this site earns from qualifying purchases.
      </p>
    </aside>
  );
}

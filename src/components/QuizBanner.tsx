"use client";

import { useEffect, useState } from "react";
import AmazonProductLink from "@/components/AmazonProductLink";
import type { EquipmentGroup } from "@/lib/amazon";
import { selectQuizEquipment } from "@/lib/equipment-selection";

interface QuizBannerProps {
  questionIndex: number;
  layout?: "banner" | "sidebar";
  pool: ProductPoolResponse;
  visitOffset: number;
  loaded: boolean;
  count?: number;
}

interface ProductPoolResponse {
  groups: EquipmentGroup[];
}

export function useQuizProductPool() {
  const [pool, setPool] = useState<ProductPoolResponse>({ groups: [] });
  const [visitOffset, setVisitOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/product-pool")
      .then((response) => (response.ok ? response.json() : { groups: [] }))
      .then((data: ProductPoolResponse) => {
        if (active && Array.isArray(data.groups)) {
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

  return { pool, visitOffset, loaded };
}

export default function QuizBanner({ questionIndex, layout = "banner", pool, visitOffset, loaded, count }: QuizBannerProps) {
  const products = selectQuizEquipment(pool.groups, visitOffset, questionIndex, count);

  return (
    <aside
      className={`surface min-h-[240px] w-full p-5 sm:p-6 ${layout === "banner" ? "mb-8" : ""}`}
      aria-label="Advertisement"
    >
      <span className="t-label block text-[var(--dim)]">Advertisement</span>
      {products.length ? (
        <div className={`mt-4 grid grid-cols-2 gap-3 ${layout === "banner" ? "lg:grid-cols-4" : ""}`}>
          {products.map(({ product, category }) => (
            <AmazonProductLink
              key={product.asin}
              href={product.url}
              asin={product.asin}
              category={category}
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
          <span className="t-small text-[var(--dim)]">
            {loaded ? "Product picks unavailable right now" : "Loading product picks…"}
          </span>
        </div>
      )}
      <p className="t-small mt-4 text-[var(--dim)]">
        Ads help me pay the bills for this site, thanks for supporting a small creator! As an Amazon Associate, this site earns from qualifying purchases.
      </p>
    </aside>
  );
}

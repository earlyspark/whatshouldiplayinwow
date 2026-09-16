import AdSlot from "@/components/AdSlot";
import AmazonProductLink from "@/components/AmazonProductLink";
import { getBannerProducts } from "@/lib/amazon";

interface AmazonBannerProps {
  placement: "sidebar" | "inline";
  /** Overrides the configured pool query, e.g. to match a quiz result. */
  keywords?: string;
  /** Keep contextual products aligned with the primary recommendation. */
  focusTerm?: string;
}

/**
 * Affiliate banner backed by the Amazon Creators API.
 *
 * Amazon retired the old static banner and iframe creatives with PA-API 5.0, so
 * a banner is now built from catalog data the API returns. Rendering happens on
 * the server: the credentials never reach the browser, and the products are
 * cached so a page view does not mean an API call.
 *
 * Falls back to the reserved ad space whenever there is nothing to show.
 */
export default async function AmazonBanner({ placement, keywords, focusTerm }: AmazonBannerProps) {
  const limit = 4;
  const products = await getBannerProducts(limit, keywords, focusTerm);
  if (!products.length) return <AdSlot placement={placement} />;

  const isSidebar = placement === "sidebar";

  return (
    <aside
      className="surface w-full p-5"
      aria-label="Advertisement"
    >
      <span className="t-label block text-[var(--dim)]">
        Advertisement
      </span>

      <div className={isSidebar ? "mt-4 grid grid-cols-2 gap-3" : "mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4"}>
        {products.map((product) => (
          <AmazonProductLink
            key={product.asin}
            href={product.url}
            asin={product.asin}
            placement={placement}
            className="focus-ring group flex flex-col gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[.04]"
          >
            {product.imageUrl && (
              // Amazon requires product images to be served unmodified from its
              // own CDN, so next/image optimisation is deliberately not used.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                width={product.imageWidth ?? undefined}
                height={product.imageHeight ?? undefined}
                loading="lazy"
                className={`mx-auto w-full rounded-lg bg-white/90 object-contain p-2 ${isSidebar ? "h-24" : "h-auto max-h-[180px] max-w-full"}`}
              />
            )}
            <span className="t-small line-clamp-3 text-[var(--dim)] group-hover:text-[var(--bone)]">
              {product.title}
            </span>
          </AmazonProductLink>
        ))}
      </div>

      <p className="t-small mt-4 text-[var(--dim)] opacity-70">
        Ads help me pay the bills for this site, thanks for supporting a small creator! As an Amazon Associate, this site earns from qualifying purchases.
      </p>
    </aside>
  );
}

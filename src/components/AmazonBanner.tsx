import AdSlot from "@/components/AdSlot";
import AmazonProductLink from "@/components/AmazonProductLink";
import { getBannerProducts } from "@/lib/amazon";

interface AmazonBannerProps {
  placement: "sidebar" | "inline";
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
export default async function AmazonBanner({ placement }: AmazonBannerProps) {
  const limit = placement === "sidebar" ? 1 : 3;
  const products = await getBannerProducts(limit);
  if (!products.length) return <AdSlot placement={placement} />;

  const isSidebar = placement === "sidebar";

  return (
    <aside
      className="w-full rounded-2xl border border-[var(--line)] bg-white/[.025] p-5"
      aria-label="Advertisement"
    >
      <span className="block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
        Advertisement
      </span>

      <div className={isSidebar ? "mt-4 space-y-4" : "mt-4 grid gap-4 sm:grid-cols-3"}>
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
                className="mx-auto h-auto max-h-[180px] w-auto max-w-full rounded-lg bg-white/90 object-contain p-2"
              />
            )}
            <span className="line-clamp-3 text-sm leading-6 text-[var(--muted)] group-hover:text-white">
              {product.title}
            </span>
            {product.price && (
              <strong className="text-sm text-[var(--gold-bright)]">{product.price}</strong>
            )}
          </AmazonProductLink>
        ))}
      </div>

      <p className="mt-4 text-[0.65rem] leading-5 text-[var(--muted)]">
        As an Amazon Associate, this site earns from qualifying purchases. Prices and availability are
        accurate as of the time shown and are subject to change.
      </p>
    </aside>
  );
}

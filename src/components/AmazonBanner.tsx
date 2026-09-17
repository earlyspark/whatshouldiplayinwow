import AdSlot from "@/components/AdSlot";
import AmazonProductLink from "@/components/AmazonProductLink";
import { getBannerProducts, getEquipmentGroups } from "@/lib/amazon";

interface AmazonBannerProps {
  placement: "sidebar" | "inline";
  keywords?: string;
  focusTerm?: string;
  equipment?: boolean;
}

export default async function AmazonBanner({ placement, keywords, focusTerm, equipment = false }: AmazonBannerProps) {
  const limit = 4;
  const products = equipment
    ? (await getEquipmentGroups("results")).flatMap((group) => group.products.length
      ? [{ ...group.products[0], category: group.category }]
      : [])
    : (await getBannerProducts(limit, keywords, focusTerm)).map((product) => ({ ...product, category: undefined }));
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
            category={product.category}
            placement={placement}
            className="focus-ring group flex flex-col gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[.04]"
          >
            {product.imageUrl && (
              // Amazon requires product images served unmodified from its CDN.
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

      {!equipment && <p className="t-small mt-4 text-[var(--dim)]">
        Ads help me pay the bills for this site, thanks for supporting a small creator! As an Amazon Associate, this site earns from qualifying purchases.
      </p>}
    </aside>
  );
}

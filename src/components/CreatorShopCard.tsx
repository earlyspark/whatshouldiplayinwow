import Image from "next/image";
import printImage from "../../assets/sinister-squashling.webp";
import bookImage from "../../assets/little-kids-coloring-book.webp";
import CreatorShopLink from "@/components/CreatorShopLink";
import CreatorVideoLink from "@/components/CreatorVideoLink";
import { creatorMaps } from "@/lib/creator-maps";
import AmazonProductLink from "@/components/AmazonProductLink";
import { CREATOR_BOOK_ASIN } from "@/lib/amazon";
import type { AdPlacement } from "@/lib/gtag";
import { AD_TILE_CLASS } from "@/lib/ad-styles";

const BOOK_TITLE = "Little Kids Coloring Book: Irvine and Orange County, California";

const linkClass = "focus-ring group flex min-w-0 flex-col gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[.04]";

// Most pages showing this card are prerendered, where the catalog credentials
// are absent, so the book is static rather than fetched from Amazon.
function bookUrl() {
  const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
  return `https://www.amazon.com/dp/${CREATOR_BOOK_ASIN}${tag ? `?tag=${tag}` : ""}`;
}

const gridColumns = { banner: "grid-cols-2 lg:grid-cols-4", row: "grid-cols-2 sm:grid-cols-4", sidebar: "grid-cols-2" };

export default function CreatorShopCard({ placement = "result_creator_sidebar", layout = "sidebar" }: { placement?: AdPlacement; layout?: "banner" | "row" | "sidebar" }) {
  return (
    <aside className="surface w-full p-5" aria-label="Buy my wares">
      <p className="t-label text-[var(--dim)]">Buy my wares</p>
      <div className={`mt-4 grid gap-3 ${gridColumns[layout]}`}>
        {creatorMaps.map((map) => (
          <CreatorVideoLink key={map.itemId} placement={placement} {...map} />
        ))}
        <CreatorShopLink placement={placement}>
          <Image src={printImage} alt="" sizes="(min-width: 640px) 176px, 40vw" className={AD_TILE_CLASS} />
          <span className="t-small line-clamp-3 text-[var(--dim)] group-hover:text-[var(--bone)]">Sinister Squashling watercolor print</span>
        </CreatorShopLink>
        <AmazonProductLink href={bookUrl()} asin={CREATOR_BOOK_ASIN} category="creator-book" placement={placement} className={linkClass}>
          <Image src={bookImage} alt="" sizes="(min-width: 640px) 176px, 40vw" className={AD_TILE_CLASS} />
          <span className="t-small line-clamp-3 text-[var(--dim)] group-hover:text-[var(--bone)]">{BOOK_TITLE}</span>
        </AmazonProductLink>
      </div>
      <p className="t-small mt-4 text-[var(--dim)]">
        Visit my <a href="https://earlyspark.etsy.com" target="_blank" rel="noopener noreferrer" className="focus-ring underline underline-offset-2 hover:text-[var(--bone)]">Etsy store</a> and shop my coloring book on Amazon.
      </p>
    </aside>
  );
}

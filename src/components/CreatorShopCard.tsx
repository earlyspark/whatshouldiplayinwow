import Image from "next/image";
import printImage from "../../assets/sinister-squashling.webp";
import CreatorShopLink from "@/components/CreatorShopLink";
import AmazonProductLink from "@/components/AmazonProductLink";
import { getCreatorBookProduct } from "@/lib/amazon";

export default async function CreatorShopCard() {
  const book = await getCreatorBookProduct();
  return (
    <aside className="surface w-full p-5" aria-label="Hey, i made this">
      <p className="t-label text-[var(--dim)]">Hey, i made this</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <CreatorShopLink>
          <Image
            src={printImage}
            alt=""
            sizes="(min-width: 1024px) 130px, (min-width: 640px) 280px, 40vw"
            className="h-24 w-full rounded-lg bg-white/90 object-contain p-2"
          />
          <span className="t-small line-clamp-3 text-[var(--dim)] group-hover:text-[var(--bone)]">Sinister Squashling watercolor print</span>
        </CreatorShopLink>
        {book && <AmazonProductLink href={book.url} asin={book.asin} category="creator-book" placement="sidebar" className="focus-ring group flex min-w-0 flex-col gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[.04]">
            {book.imageUrl && (
              // Amazon images are served directly, without transformation.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.imageUrl} alt="" width={book.imageWidth ?? undefined} height={book.imageHeight ?? undefined} loading="lazy" className="h-24 w-full rounded-lg bg-white/90 object-contain p-2" />
            )}
            <span className="t-small line-clamp-3 text-[var(--dim)] group-hover:text-[var(--bone)]">{book.title}</span>
          </AmazonProductLink>}
      </div>
      <p className="t-small mt-4 text-[var(--dim)]">
        Visit my <a href="https://earlyspark.etsy.com" target="_blank" rel="noopener noreferrer" className="focus-ring underline underline-offset-2 hover:text-[var(--bone)]">Etsy store</a> and shop my coloring book on Amazon. Clicks help offset the cost of this fun, free quiz!
      </p>
    </aside>
  );
}

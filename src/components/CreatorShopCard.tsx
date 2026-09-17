import Image from "next/image";
import printImage from "../../assets/sinister-squashling.webp";
import CreatorShopLink from "@/components/CreatorShopLink";
import AmazonProductLink from "@/components/AmazonProductLink";
import { getCreatorBookProduct } from "@/lib/amazon";

export default async function CreatorShopCard() {
  const book = await getCreatorBookProduct();
  return (
    <aside className="surface creator-shop w-full p-5" aria-label="From the creator">
      <p className="t-label text-[var(--dim)]">From the creator</p>
      <div className="creator-products mt-4 grid gap-5">
        <div>
          <Image
            src={printImage}
            alt="Framed Sinister Squashling watercolor print"
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 480px, 100vw"
            className="h-auto w-full rounded-lg"
          />
          <h2 className="t-card mt-5 text-[var(--bone)]">Sinister Squashling watercolor print</h2>
          <p className="t-small mt-2 text-[var(--dim)]">
            A framed print of my original Hallow&apos;s End-inspired watercolor, made for fellow WoW fans.
          </p>
          <CreatorShopLink />
        </div>
        {book && <div>
          <AmazonProductLink href={book.url} asin={book.asin} category="creator-book" placement="sidebar" className="focus-ring group block rounded-xl transition-colors hover:bg-white/[.04]">
            {book.imageUrl && (
              // Amazon images are served directly, without transformation.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.imageUrl} alt="" width={book.imageWidth ?? undefined} height={book.imageHeight ?? undefined} loading="lazy" className="mx-auto h-auto max-h-64 w-full rounded-lg bg-white/90 object-contain p-2" />
            )}
            <span className="t-card mt-4 block text-[var(--bone)] group-hover:text-[var(--bronze)]">{book.title}</span>
          </AmazonProductLink>
        </div>}
      </div>
      <p className="t-small mt-4 text-[var(--dim)]">
        Ads help me pay the bills for this site, thanks for supporting a small creator! As an Amazon Associate, this site earns from qualifying purchases.
      </p>
    </aside>
  );
}

import Image from "next/image";
import printImage from "../../assets/sinister-squashling.webp";
import CreatorShopLink from "@/components/CreatorShopLink";

export default function CreatorShopCard() {
  return (
    <aside className="surface w-full p-5" aria-label="From the creator">
      <p className="t-label text-[var(--dim)]">From the creator</p>
      <Image
        src={printImage}
        alt="Framed Sinister Squashling watercolor print"
        sizes="(min-width: 1024px) 260px, (min-width: 640px) 480px, 100vw"
        className="mt-4 h-auto w-full rounded-lg"
      />
      <h2 className="t-card mt-5 text-[var(--bone)]">Sinister Squashling watercolor print</h2>
      <p className="t-small mt-2 text-[var(--dim)]">
        A framed print of my original Hallow&apos;s End-inspired watercolor, made for fellow WoW fans.
      </p>
      <CreatorShopLink />
    </aside>
  );
}

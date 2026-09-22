import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import AdSenseUnit from "@/components/AdSenseUnit";
import AdSlot from "@/components/AdSlot";
import AmazonBanner from "@/components/AmazonBanner";
import CreatorShopCard from "@/components/CreatorShopCard";
import SiteFooter from "@/components/SiteFooter";
import { pairingSearchString, parsePairingParams } from "@/lib/pairings-params";
import { genericShare, selectionShare, shareImagePath, toParamReader } from "@/lib/pairings-share";
import { siteUrl } from "@/lib/site-url";
import PairingsFinder from "./PairingsFinder";

export const dynamic = "force-dynamic";

interface PairingsPageProps { searchParams: Promise<Record<string, string | string[] | undefined>> }

// Canonical stays /pairings so selections aren't indexed as separate pages; og:url keeps the shared selection so its unfurl matches.
export async function generateMetadata({ searchParams }: PairingsPageProps): Promise<Metadata> {
  const selection = parsePairingParams(toParamReader(await searchParams));
  const share = selectionShare(selection);
  const title = share?.title ?? genericShare.title;
  const description = share?.description ?? genericShare.description;
  const image = { url: shareImagePath(selection), width: 1200, height: 630, alt: share?.imageAlt ?? genericShare.imageAlt };
  const url = `${siteUrl}/pairings${share ? pairingSearchString({ ...selection, sort: "pve", role: "all" }) : ""}`;
  return {
    // Absolute skips the layout suffix, which pushed the title past what Google shows.
    title: { absolute: title },
    description,
    alternates: { canonical: `${siteUrl}/pairings` },
    openGraph: { title, description, type: "website", url, siteName: "What Should I Play?", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function PairingsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WoW Forever Best Spec Pairings",
    url: `${siteUrl}/pairings`,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: genericShare.description,
  };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <div className="mx-auto w-full max-w-[78rem] px-5 sm:px-8">
        <header className="pb-2 pt-8 sm:pt-10">
          <div className="flex flex-col items-start gap-5">
            <p className="t-eyebrow text-[var(--bronze)]">World of Warcraft: Forever</p>
            <h1 className="t-display">Best spec pairings</h1>
          </div>
        </header>

        <Suspense fallback={<div className="surface min-h-64" aria-hidden="true" />}>
          <PairingsFinder
            intro={
              <p className="t-body text-[var(--dim)]">
                Already know what class you want to play? Pick your spec to see what pairs best with yours in PvE
                and PvP, and what each of you brings. Still deciding on your own pick?{" "}
                <Link href="/" className="link-bronze focus-ring">Take the quiz</Link>.
              </p>
            }
            sidebar={
              <>
                <CreatorShopCard placement="pairings_creator" />
                <div className="pairings-sticky mt-5">
                  <Suspense fallback={<AdSlot placement="sidebar" />}>
                    <AmazonBanner placement="sidebar" equipment />
                  </Suspense>
                </div>
              </>
            }
            inlineCreatorCard={<CreatorShopCard placement="pairings_creator" layout="row" />}
          />
        </Suspense>

        <div className="pairings-inline mt-8">
          <Suspense fallback={<AdSlot placement="inline" />}>
            <AmazonBanner placement="inline" equipment />
          </Suspense>
        </div>
        <AdSenseUnit viewport="mobile" />

        <SiteFooter />
      </div>
    </main>
  );
}

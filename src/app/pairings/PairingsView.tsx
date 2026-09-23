import { Suspense } from "react";
import Link from "next/link";
import AdSenseUnit from "@/components/AdSenseUnit";
import AdSlot from "@/components/AdSlot";
import AmazonBanner from "@/components/AmazonBanner";
import CreatorShopCard from "@/components/CreatorShopCard";
import SiteFooter from "@/components/SiteFooter";
import type { SpecId } from "@/data/specs";
import { genericShare } from "@/lib/pairings-share";
import { siteUrl } from "@/lib/site-url";
import PairingsFinder from "./PairingsFinder";
import SpecBrowse from "./SpecBrowse";

export default function PairingsView({ heading, path, specId = null }: { heading: string; path: string; specId?: SpecId | null }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WoW Forever Best Spec Pairings",
    url: `${siteUrl}${path}`,
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
            <h1 className="t-display">{heading}</h1>
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

        <SpecBrowse currentSpecId={specId} />

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

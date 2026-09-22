import Link from "next/link";
import ErrorAnalytics from "@/components/ErrorAnalytics";
import NotFoundAds from "@/components/NotFoundAds";
import CreatorShopCard from "@/components/CreatorShopCard";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center gap-16 px-5 py-16 text-center">
      <ErrorAnalytics type="not_found" />
      <div className="max-w-xl">
        <p className="t-label text-[var(--bronze)]">Lost in Azeroth</p>
        <h1 className="t-display mt-4">This page could not be found.</h1>
        <p className="t-body mt-5 text-[var(--dim)]">The address may be incomplete, or a shared result may have expired.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/#quiz" className="btn focus-ring">Take the quiz</Link>
          <Link href="/pairings" className="btn-outline focus-ring">See what pairs with your spec</Link>
        </div>
      </div>
      <div className="w-full max-w-[78rem] space-y-8 text-left">
        <CreatorShopCard placement="not_found_creator" layout="banner" />
        <NotFoundAds />
      </div>
    </main>
  );
}

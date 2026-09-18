import Link from "next/link";
import ErrorAnalytics from "@/components/ErrorAnalytics";

export default function ResultNotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-5 py-16 text-center">
      <ErrorAnalytics type="not_found" />
      <div className="max-w-xl">
        <p className="t-label text-[var(--bronze)]">Result expired</p>
        <h1 className="t-display mt-4">This result is no longer available.</h1>
        <p className="t-body mt-5 text-[var(--dim)]">
          This link has expired or is incorrect. Take the quiz again for a fresh recommendation.
        </p>
        <Link href="/#quiz" className="btn focus-ring mt-8">Take the quiz again</Link>
      </div>
    </main>
  );
}

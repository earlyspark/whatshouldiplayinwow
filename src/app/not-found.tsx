import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-5 py-16 text-center">
      <div className="max-w-xl">
        <p className="t-label text-[var(--bronze)]">Lost in Azeroth</p>
        <h1 className="t-display mt-4">This page could not be found.</h1>
        <p className="t-body mt-5 text-[var(--dim)]">The address may be incomplete, or a shared result may have expired.</p>
        <Link href="/#quiz" className="btn focus-ring mt-8">Take the quiz</Link>
      </div>
    </main>
  );
}

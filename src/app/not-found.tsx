import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-5 py-16 text-center">
      <div className="max-w-xl">
        <p className="eyebrow">Lost in Azeroth</p>
        <h1 className="display-font mt-4 text-5xl">That result could not be found.</h1>
        <p className="mt-5 leading-7 text-[var(--muted)]">The link may be incomplete, or the result may no longer be available.</p>
        <Link href="/#quiz" className="focus-ring mt-8 inline-flex min-h-12 items-center rounded-full bg-[var(--gold)] px-6 py-3 font-bold text-[#172022]">Take the quiz</Link>
      </div>
    </main>
  );
}

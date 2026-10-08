import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { siteUrl } from "@/lib/site-url";

const shareTitle = "About this WoW Forever quiz";
const shareDescription = "Who made the WoW Forever race and class quiz, and why.";

export const metadata: Metadata = {
  title: shareTitle,
  description: shareDescription,
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    type: "website",
    url: `${siteUrl}/about`,
    siteName: "What Should I Play?",
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
  },
};

const external = { target: "_blank", rel: "noopener noreferrer", className: "link-bronze focus-ring" };

export default function AboutPage() {
  return (
    <main id="main-content">
      <div className="mx-auto w-full max-w-[78rem] px-5 sm:px-8">
        <header className="pb-7 pt-8 sm:pb-9 sm:pt-10">
          <div className="flex flex-col items-start gap-5">
            <p className="t-eyebrow text-[var(--bronze)]">Who made this website?</p>
            <h1 className="t-display">About</h1>
          </div>
        </header>

        <article>
          <section className="space-y-5">
            <p className="t-body text-[var(--dim)]">Greetings, traveler. You&apos;re wondering who made this site, if it&apos;s legit, and why it was made. This page will hopefully sate your curiosity.</p>
            <p className="t-body text-[var(--dim)]">
              I&apos;m <a href="https://earlyspark.com" {...external}>earlyspark</a>, and I technically started playing World of Warcraft in WotLK but didn&apos;t really understand how to play until Cata. Raided with my guild in MoP, which felt like a{" "}
              <a href="https://www.everydayray.com/2013/08/13/first-lei-shen-kill-with-my-guild-lost-requiem-on-gilneas/" {...external}>big accomplishment</a>{" "}
              for me at the time. I was a casual (terrible) PvPer, esports fan, and supported{" "}
              <a href="https://www.twitch.tv/videos/30370456" {...external}>OG WoW streamers</a>. I played through BfA but by that point, none of my IRL friends were playing and I got busy with work and life things and stopped playing myself. In 2026, I heard about WoW Forever and that it was launching during a break in my career -- perfect timing for me to degen (<a href="https://x.com/earlyspark/status/2101441495782048170" {...external}>responsibly</a>).
            </p>
            <p className="t-body text-[var(--dim)]">I&apos;m looking forward to playing again, even if it&apos;s just for a little bit, and be a part of the WoW community. I made this quiz because I couldn&apos;t decide what I wanted to play, and also made the &quot;<Link href="/pairings" className="link-bronze focus-ring">Spec pairings</Link>&quot; page so I can figure out what class/race complements what I would play. I made the quiz public for others like me trying to decide what they want to play, just for fun, and I hope it&apos;s useful and enjoyable.</p>
            <p className="t-body text-[var(--dim)]">
              You can read more about <Link href="/methodology" className="link-bronze focus-ring">how this quiz works</Link> and the sources used to determine the recommendations. It&apos;s not a perfect quiz, but I iterated on it a lot to try to get it into good shape, using the voting system to determine where I needed to improve, and I&apos;m proud of the work that I put into this as a fun game.
            </p>
            <p className="t-body text-[var(--dim)]">
              Coincidentally, around the same time as the birth of this site, I also re-launched <a href="https://earlyspark.etsy.com" {...external}>my Etsy store</a>, so I decided to shamelessly peddle my wares here as well. I&apos;m experimenting with doing things that I enjoy, figuring out how to provide value to others, while also getting rewarded for it. I haven&apos;t solved this yet but if you&apos;d like to support me, or my efforts, feel free to{" "}
              <a href="https://buymeacoffee.com/earlyspark" {...external}>buy me a coffee</a>.
            </p>
            <p className="t-body text-[var(--dim)]">A human came up with the words to write on this page. (I&apos;m the human.)</p>
          </section>
        </article>

        <SiteFooter />
      </div>
    </main>
  );
}

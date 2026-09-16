import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071012",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "What Should I Pick? WoW Forever Race & Class Quiz", template: "%s | What Should I Pick?" },
  description: "Answer 12 playstyle questions to discover which World of Warcraft: Forever race and class you should pick.",
  applicationName: "What Should I Pick?",
  openGraph: {
    type: "website",
    siteName: "What Should I Pick?",
    title: "What Should I Pick? WoW Forever Race & Class Quiz",
    description: "Find the WoW Forever race and class that fits the way you want to play.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "What Should I Pick? WoW Forever Race & Class Quiz",
    description: "Find the WoW Forever race and class that fits the way you want to play.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="focus-ring fixed left-3 top-3 z-50 -translate-y-24 rounded-md bg-white px-4 py-2 text-sm text-black focus:translate-y-0">
          Skip to content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

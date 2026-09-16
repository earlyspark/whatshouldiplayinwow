import type { Metadata, Viewport } from "next";
import { body, display, mono } from "./fonts";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PrivacySafeSpeedInsights from "@/components/PrivacySafeSpeedInsights";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171220",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "What Should I Play? WoW Forever Race & Class Quiz", template: "%s | What Should I Play?" },
  description: "Answer playstyle questions to discover which World of Warcraft: Forever race and class you should play.",
  applicationName: "What Should I Play?",
  openGraph: {
    type: "website",
    siteName: "What Should I Play?",
    title: "What Should I Play? WoW Forever Race & Class Quiz",
    description: "Find the WoW Forever race and class that fits the way you want to play.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "What Should I Play? WoW Forever Race & Class Quiz",
    description: "Find the WoW Forever race and class that fits the way you want to play.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a href="#main-content" className="focus-ring fixed left-3 top-3 z-50 -translate-y-24 bg-[var(--bone)] px-4 py-2 text-sm font-semibold text-[var(--ground)] focus:translate-y-0">
          Skip to content
        </a>
        {children}
        <PrivacySafeSpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  );
}

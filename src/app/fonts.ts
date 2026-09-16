import { Marcellus, EB_Garamond, IBM_Plex_Mono } from "next/font/google";

/**
 * Self-hosted at build time, so there is no third-party request, no layout
 * shift, and no silent fallback to a system face.
 */
export const display = Marcellus({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
  fallback: ["Palatino Linotype", "Palatino", "Georgia", "serif"],
});

export const body = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

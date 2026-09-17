import { Marcellus, EB_Garamond, IBM_Plex_Mono } from "next/font/google";

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

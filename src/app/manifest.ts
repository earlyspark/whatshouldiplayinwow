import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "What Should I Play? WoW Forever Race & Class Quiz",
    short_name: "What Should I Play?",
    description: "Answer playstyle questions to discover which World of Warcraft: Forever race and class you should play.",
    start_url: "/",
    display: "standalone",
    background_color: "#171220",
    theme_color: "#171220",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
  };
}

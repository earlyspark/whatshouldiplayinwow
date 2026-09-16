import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "What Should I Pick? WoW Forever Race & Class Quiz",
    short_name: "What Should I Pick?",
    description: "Answer 12 playstyle questions to discover which World of Warcraft: Forever race and class you should pick.",
    start_url: "/",
    display: "standalone",
    background_color: "#071012",
    theme_color: "#071012",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

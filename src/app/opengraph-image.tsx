import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "What Should I Play? WoW Forever Race & Class Quiz";
export const size = { width: 1200, height: 630 };
// The og:image URL hash comes from this file's contents; editing it makes social crawlers refetch cached images.
export const contentType = "image/png";

const [crest, marcellus, garamond, plexMono] = await Promise.all([
  readFile(join(process.cwd(), "assets/crest.png")),
  readFile(join(process.cwd(), "assets/fonts/marcellus.ttf")),
  readFile(join(process.cwd(), "assets/fonts/ebgaramond.ttf")),
  readFile(join(process.cwd(), "assets/fonts/plexmono.ttf")),
]);
const crestSrc = `data:image/png;base64,${crest.toString("base64")}`;

// Satori cannot read next/font, so the faces are passed as binaries.
const fonts = [
  { name: "Marcellus", data: marcellus, style: "normal" as const, weight: 400 as const },
  { name: "EB Garamond", data: garamond, style: "normal" as const, weight: 400 as const },
  { name: "IBM Plex Mono", data: plexMono, style: "normal" as const, weight: 400 as const },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#171220",
          color: "#f0e9dd",
          display: "flex",
          gap: 58,
          height: "100%",
          padding: "0 86px",
          width: "100%",
        }}
      >
        <img src={crestSrc} alt="" width={232} height={238} />

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ color: "#c8964a", display: "flex", fontSize: 23, fontFamily: "IBM Plex Mono", letterSpacing: 5 }}>
            WORLD OF WARCRAFT: FOREVER
          </div>
          <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 74, lineHeight: 1.08, maxWidth: 700 }}>
            Which race and class should you play?
          </div>
          <div style={{ color: "#a79cb0", display: "flex", fontSize: 29, maxWidth: 660 }}>
            Take this quiz to find out and share with your friends!
          </div>
          <div style={{ color: "#8fa68e", display: "flex", fontFamily: "IBM Plex Mono", fontSize: 20, letterSpacing: 1, marginTop: 8 }}>
            whatshouldiplayinwowforever.com
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

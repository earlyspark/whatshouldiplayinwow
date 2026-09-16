import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "How this WoW Forever race and class quiz works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const [crest, marcellus, garamond, plexMono] = await Promise.all([
  readFile(join(process.cwd(), "assets/crest.png")),
  readFile(join(process.cwd(), "assets/fonts/marcellus.ttf")),
  readFile(join(process.cwd(), "assets/fonts/ebgaramond.ttf")),
  readFile(join(process.cwd(), "assets/fonts/plexmono.ttf")),
]);
const crestSrc = `data:image/png;base64,${crest.toString("base64")}`;

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
          <div style={{ color: "#c8964a", display: "flex", fontFamily: "IBM Plex Mono", fontSize: 23, letterSpacing: 5 }}>
            WORLD OF WARCRAFT: FOREVER
          </div>
          <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 78, lineHeight: 1.08, maxWidth: 700 }}>
            How it works
          </div>
          <div style={{ color: "#a79cb0", display: "flex", fontFamily: "EB Garamond", fontSize: 33, lineHeight: 1.22, maxWidth: 660 }}>
            A look behind your race and class recommendation.
          </div>
          <div style={{ color: "#8fa68e", display: "flex", fontFamily: "IBM Plex Mono", fontSize: 20, letterSpacing: 1, marginTop: 8 }}>
            whatshouldiplayinwowforever.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Marcellus", data: marcellus, style: "normal", weight: 400 },
        { name: "EB Garamond", data: garamond, style: "normal", weight: 400 },
        { name: "IBM Plex Mono", data: plexMono, style: "normal", weight: 400 },
      ],
    },
  );
}

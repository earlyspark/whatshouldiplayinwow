import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getResult } from "@/lib/result-store";

export const alt = "Personalized WoW Forever race and class quiz result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

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

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getResult(id);
  const resultName = result
    ? `${result.primary.raceName} ${result.primary.className}`
    : "Find your race and class";
  const description = result
    ? `Best balances ${result.primary.classTagline} with ${result.primary.raceTagline}.`
    : "Take the WoW Forever race and class quiz.";
  const titleSize = resultName.length > 25 ? 67 : resultName.length > 20 ? 74 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#171220",
          color: "#f0e9dd",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px 80px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
          <img src={crestSrc} alt="" width={78} height={80} />
          <span style={{ color: "#c8964a", display: "flex", fontFamily: "IBM Plex Mono", fontSize: 21, letterSpacing: 5 }}>
            WHAT SHOULD I PLAY?
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#c8964a", display: "flex", fontFamily: "Marcellus", fontSize: titleSize, lineHeight: 1.06, maxWidth: 1040 }}>
            {resultName}
          </div>
          <div style={{ color: "#a79cb0", display: "flex", fontSize: 26, lineHeight: 1.45, marginTop: 26, maxWidth: 930 }}>
            {description}
          </div>
        </div>

        <div style={{ color: "#8fa68e", display: "flex", fontFamily: "IBM Plex Mono", fontSize: 20 }}>
          whatshouldiplayinwowforever.com
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { PairingMode } from "@/data/pairings-config";
import { parsePairingParams } from "@/lib/pairings-params";
import { selectionShare, type SelectionShare } from "@/lib/pairings-share";

const size = { width: 1200, height: 630 };
const colors = { ground: "#171220", surface: "#211a2c", line: "#342a42", bone: "#f0e9dd", dim: "#a79cb0", bronze: "#c8964a", sage: "#8fa68e" };
const modeHeadings: Record<PairingMode, string> = { pve: "PvE · leveling and dungeons", pvp: "PvP · world PvP and battlegrounds" };

const [crest, marcellus, garamond, plexMono] = await Promise.all([
  readFile(join(process.cwd(), "assets/crest.png")),
  readFile(join(process.cwd(), "assets/fonts/marcellus.ttf")),
  readFile(join(process.cwd(), "assets/fonts/ebgaramond.ttf")),
  readFile(join(process.cwd(), "assets/fonts/plexmono.ttf")),
]);
const crestSrc = `data:image/png;base64,${crest.toString("base64")}`;
const fonts = [
  { name: "Marcellus", data: marcellus, style: "normal" as const, weight: 400 as const },
  { name: "EB Garamond", data: garamond, style: "normal" as const, weight: 400 as const },
  { name: "IBM Plex Mono", data: plexMono, style: "normal" as const, weight: 400 as const },
];

function GenericImage() {
  return (
    <div style={{ alignItems: "center", background: colors.ground, color: colors.bone, display: "flex", gap: 58, height: "100%", padding: "0 86px", width: "100%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={crestSrc} alt="" width={232} height={238} />
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ color: colors.bronze, display: "flex", fontFamily: "IBM Plex Mono", fontSize: 23, letterSpacing: 5 }}>
          WORLD OF WARCRAFT: FOREVER
        </div>
        <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 78, lineHeight: 1.08, maxWidth: 700 }}>Best spec pairings</div>
        <div style={{ color: colors.dim, display: "flex", fontFamily: "EB Garamond", fontSize: 33, lineHeight: 1.22, maxWidth: 660 }}>
          For teammates in PvE and PvP.
        </div>
        <div style={{ color: colors.sage, display: "flex", fontFamily: "IBM Plex Mono", fontSize: 20, letterSpacing: 1, marginTop: 8 }}>
          whatshouldiplayinwowforever.com
        </div>
      </div>
    </div>
  );
}

function SelectionImage({ share }: { share: SelectionShare }) {
  return (
    <div style={{ background: colors.ground, color: colors.bone, display: "flex", flexDirection: "column", height: "100%", padding: "52px 64px 44px", width: "100%" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={crestSrc} alt="" width={58} height={60} />
        <div style={{ color: colors.bronze, display: "flex", fontFamily: "IBM Plex Mono", fontSize: 20, letterSpacing: 4 }}>
          WOW FOREVER · SPEC PAIRINGS
        </div>
      </div>
      <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 54, lineHeight: 1.1, marginTop: 26, maxWidth: 1070 }}>{share.heading}</div>
      <div style={{ display: "flex", gap: 32, marginTop: "auto" }}>
        {(["pve", "pvp"] as PairingMode[]).map((mode) => (
          <div key={mode} style={{ background: colors.surface, border: `1px solid ${colors.line}`, display: "flex", flex: 1, flexDirection: "column", padding: "22px 26px" }}>
            <div style={{ color: colors.bronze, display: "flex", fontFamily: "IBM Plex Mono", fontSize: 17, letterSpacing: 2, marginBottom: 10 }}>
              {modeHeadings[mode].toUpperCase()}
            </div>
            {share.top[mode].map((row, index) => (
              <div key={row.spec.id} style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ display: "flex", fontFamily: "EB Garamond", fontSize: 31 }}>
                  <span style={{ color: colors.dim, marginRight: 14 }}>{index + 1}</span>
                  {row.spec.name} {row.className}
                </div>
                <div style={{ color: colors.sage, display: "flex", fontFamily: "IBM Plex Mono", fontSize: 16, letterSpacing: 1 }}>
                  {row[mode].tier.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ color: colors.sage, display: "flex", fontFamily: "IBM Plex Mono", fontSize: 18, letterSpacing: 1, marginTop: 22 }}>
        whatshouldiplayinwowforever.com/pairings
      </div>
    </div>
  );
}

// Only known spec, race, and faction IDs are rendered, so the query can't inject arbitrary text into the image.
export function GET(request: Request) {
  const share = selectionShare(parsePairingParams(new URL(request.url).searchParams));
  return new ImageResponse(share ? <SelectionImage share={share} /> : <GenericImage />, {
    ...size,
    fonts,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
  });
}

import { ImageResponse } from "next/og";

export const alt = "What Should I Pick? WoW Forever Race & Class Quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "linear-gradient(135deg, #071012 0%, #10292c 58%, #23170d 100%)",
          color: "#eef4f5",
          display: "flex",
          height: "100%",
          padding: "58px",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid rgba(215, 173, 97, .55)",
            borderRadius: "32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px 62px",
            width: "100%",
          }}
        >
          <div style={{ color: "#f0cc83", display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
            WHAT SHOULD I PICK?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", fontFamily: "Georgia", fontSize: 70, fontWeight: 700, lineHeight: 1.04, maxWidth: 980 }}>
              Find your WoW Forever race &amp; class.
            </div>
            <div style={{ color: "#b7c7c9", display: "flex", fontSize: 29 }}>
              12 playstyle questions. One clear recommendation.
            </div>
          </div>
          <div style={{ alignItems: "center", display: "flex", fontSize: 22, justifyContent: "space-between" }}>
            <span style={{ color: "#64bdba" }}>Playstyle over tier lists</span>
            <span style={{ color: "#b7c7c9" }}>whatshouldiplayinwowforever.com</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { getResult } from "@/lib/result-store";

export const alt = "Personalized WoW Forever race and class quiz result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getResult(id);
  const race = result?.primary.raceName ?? "your perfect";
  const className = result?.primary.className ?? "class";
  const tagline = result?.primary.verdict ?? "Take the WoW Forever race and class quiz.";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#071012", color: "#eef4f5", padding: "72px 80px", border: "12px solid #162c2f" }}>
      <div style={{ display: "flex", color: "#d7ad61", fontSize: 24, letterSpacing: "0.18em", textTransform: "uppercase" }}>What Should I Pick?</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", color: "#9eafb2", fontSize: 30, marginBottom: 16 }}>You should play a</div>
        <div style={{ display: "flex", fontFamily: "serif", fontSize: 76, lineHeight: 1.05, color: "#f0cc83" }}>{race} {className}</div>
        <div style={{ display: "flex", maxWidth: 930, marginTop: 28, fontSize: 26, lineHeight: 1.45, color: "#b9c8ca" }}>{tagline}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#64bdba", fontSize: 22 }}>
        <span>WoW Forever Race & Class Quiz</span>
        <span>{result?.dataCheckedLabel ?? ""}</span>
      </div>
    </div>,
    size,
  );
}

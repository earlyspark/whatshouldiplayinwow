"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#171220", color: "#f0e9dd", fontFamily: "Georgia, serif" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "24px" }}>
          <div style={{ maxWidth: "560px", textAlign: "center" }}>
            <p style={{ color: "#c8964a", fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Something went wrong</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "48px", lineHeight: 1.05, margin: "18px 0" }}>That path through Azeroth hit a snag.</h1>
            <p style={{ color: "#a79cb0", fontSize: "18px", lineHeight: 1.7 }}>Your browser is still here. Try loading this page again, or return to the quiz if the problem continues.</p>
            <button
              onClick={reset}
              style={{ background: "#c8964a", border: 0, color: "#1d1608", cursor: "pointer", fontSize: "16px", fontWeight: 700, marginTop: "24px", padding: "13px 22px" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

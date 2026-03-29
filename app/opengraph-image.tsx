import { ImageResponse } from "next/og";
import { APP_NAME } from "@/app/lib/seo";

export const runtime = "edge";
export const alt = `${APP_NAME} open-source web music player`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #050816 0%, #111827 45%, #2563eb 100%)",
          color: "white",
          padding: "64px",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "9999px",
              background: "#3b82f6",
            }}
          />
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em" }}>
            {APP_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "900px" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
            }}
          >
            Open-source web music player
          </div>
          <div style={{ fontSize: 32, color: "rgba(255,255,255,0.85)" }}>
            Search, stream, and play music with a fast, privacy-first interface.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

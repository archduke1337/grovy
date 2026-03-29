import { ImageResponse } from "next/og";
import { APP_NAME } from "@/app/lib/seo";

export const runtime = "edge";
export const alt = `${APP_NAME} social preview`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
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
            "radial-gradient(circle at top right, #2563eb 0%, #111827 45%, #030712 100%)",
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

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "920px" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.03,
            }}
          >
            Open-source music, zero lock-in
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.85)" }}>
            Grovy brings fast discovery, playlists, and streaming into one web app.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

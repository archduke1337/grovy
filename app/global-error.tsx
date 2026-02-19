"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    console.error("Critical Global Error:", error);
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ 
        backgroundColor: "#000", 
        color: "#e5e7eb", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        margin: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center", gap: "2rem" }}>
          <div style={{
            width: "6rem",
            height: "6rem",
            borderRadius: "50%",
            backgroundColor: "rgba(239,68,68,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem"
          }}>
            ⚠️
          </div>

          <div style={{ maxWidth: "28rem" }}>
            <h2 style={{ fontSize: "1.875rem", fontWeight: 900, color: "#ef4444", letterSpacing: "-0.025em", margin: "0 0 1rem 0" }}>
              System Critical{dots}
            </h2>
            <p style={{ color: "#9ca3af", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
              We encountered a critical error preventing the app from rendering.
              Please refresh or check the console for details.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => reset ? reset() : window.location.reload()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                boxShadow: "0 10px 15px -3px rgba(59,130,246,0.3)"
              }}
            >
              Force Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

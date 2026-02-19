"use client";

import { useEffect, useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    console.error("Error Boundary Caught:", error);
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "1.5rem", textAlign: "center", gap: "2rem" }}>
      <div
        style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}
      >
        ⚠️
      </div>

      <div style={{ maxWidth: 420 }}>
        <h2 style={{ fontSize: "1.875rem", fontWeight: 900, marginBottom: "1rem" }}>
          Oops, something went wrong{dots}
        </h2>
        <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
          We encountered an unexpected error. Don&apos;t worry, your music queue is safe.
          Let&apos;s try getting you back on track.
        </p>
        {process.env.NODE_ENV === "development" && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(0,0,0,0.05)", borderRadius: 12, textAlign: "left", overflow: "auto", maxHeight: 192, fontSize: 12, fontFamily: "monospace", color: "#ef4444" }}>
            {error.message}
            {error.digest && <><br /><span style={{ color: "#9ca3af" }}>Digest: {error.digest}</span></>}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => reset()}
          style={{ padding: "0.75rem 1.5rem", borderRadius: 9999, background: "#2563eb", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}
        >
          ↻ Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          style={{ padding: "0.75rem 1.5rem", borderRadius: 9999, background: "#f3f4f6", color: "#4b5563", fontWeight: 700, border: "none", cursor: "pointer" }}
        >
          🏠 Go Home
        </button>
      </div>
    </div>
  );
}

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
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-8">
      <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-5xl">
        ⚠️
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Oops, something went wrong{dots}
        </h2>
        <p className="text-gray-500 dark:text-white/40 leading-relaxed font-medium">
          We encountered an unexpected error. Don&apos;t worry, your music queue
          is safe. Let&apos;s try getting you back on track.
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl text-left overflow-auto max-h-48 text-xs font-mono text-red-500">
            {error.message}
            {error.digest && (
              <>
                <br />
                <span className="text-gray-400">Digest: {error.digest}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors active:scale-95"
        >
          ↻ Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/50 font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors active:scale-95"
        >
          🏠 Go Home
        </button>
      </div>
    </div>
  );
}

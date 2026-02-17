"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

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
      <body className="bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center px-6 text-center space-y-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
             <AlertTriangle size={48} className="text-red-500 relative z-10" />
          </motion.div>

          <div className="space-y-4 max-w-md">
            <h2 className="text-3xl font-black text-red-500 tracking-tight">
              System Critical{dots}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              We encountered a critical error preventing the app from rendering.
              Please refresh or check the console for details.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => reset ? reset() : window.location.reload()}
              className="px-6 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30"
            >
              Force Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

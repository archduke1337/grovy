"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error);
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-8">
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
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Oops, something went wrong{dots}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
          We encountered an unexpected error. Don't worry, your music queue is safe. 
          Let's try getting you back on track.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl text-left overflow-auto max-h-48 text-xs font-mono text-red-500">
            {error.message}
            <br/>
            {error.digest && <span className="text-gray-400">Digest: {error.digest}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
        <button
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
        >
          <Home size={18} />
          Go Home
        </button>
      </div>
    </div>
  );
}

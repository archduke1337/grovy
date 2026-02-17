"use client";

import React, { useEffect, useRef } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, useAnimationFrame } from "framer-motion";

interface AmbientBackgroundProps {
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ className }) => {
  const { colors } = usePlayer();
  // Analyser logic removed in favor of smoother CSS/Framer animations
  // to prevent context/performance issues and match the new "calm" aesthetic.

  return (
    <div className={`inset-0 -z-10 overflow-hidden pointer-events-none bg-gray-50 dark:bg-black transition-colors duration-1000 ${className || "fixed"}`}>
      {/* Dynamic Blobs */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] dark:blur-[180px] opacity-40 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundColor: colors.primary, willChange: "transform, opacity" }}
      />
      
      <motion.div
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 100, -50, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] dark:blur-[180px] opacity-40 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundColor: colors.secondary, willChange: "transform, opacity" }}
      />

      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear", delay: 5 }}
        className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[140px] dark:blur-[200px] opacity-30 dark:opacity-15 mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundColor: colors.accent || colors.primary, willChange: "transform, opacity" }}
      />
      
      {/* Noise Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.04] dark:opacity-[0.07] mix-blend-overlay pointer-events-none" />
      
      {/* Dark Mode Overlay for Depth */}
      <div className="absolute inset-0 bg-white/30 dark:bg-black/80 mix-blend-overlay dark:mix-blend-hard-light pointer-events-none" />
    </div>
  );
};

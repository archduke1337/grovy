"use client";

import React, { useEffect, useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { AnimatePresence, motion } from "framer-motion";

interface AmbientBackgroundProps {
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ className }) => {
  const { colors, isPlaying } = usePlayer();
  const [liteMode, setLiteMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMode = () => {
      const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4;
      const smallScreen = window.innerWidth < 768;
      setLiteMode(media.matches || lowPowerDevice || smallScreen);
    };

    updateMode();
    media.addEventListener("change", updateMode);
    window.addEventListener("resize", updateMode, { passive: true });

    return () => {
      media.removeEventListener("change", updateMode);
      window.removeEventListener("resize", updateMode);
    };
  }, []);

  // Create a mesh of 3 moving blobs for a liquid effect
  const blobs = [
    { color: colors.primary, initialX: -20, initialY: -20, scale: 1.5, delay: 0 },
    { color: colors.secondary, initialX: 120, initialY: -20, scale: 1.2, delay: 2 },
    { color: colors.accent || colors.primary, initialX: 50, initialY: 120, scale: 1.8, delay: 4 },
  ];
  const activeBlobs = liteMode ? blobs.slice(0, 1) : blobs;

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-white dark:bg-black transition-colors duration-1000 ${className}`}>
      {/* Base gradient layer for depth - Darker for B&W focus */}
      <div 
        className="absolute inset-0 opacity-20 dark:opacity-30 transition-colors duration-2000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.primary}10 0%, transparent 80%)`
        }}
      />
      
      {/* Animated Mesh Gradients */}
      <AnimatePresence>
        {isPlaying && activeBlobs.map((blob, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              x: liteMode ? ["0%", "8%", "-8%", "0%"] : ["0%", "20%", "-20%", "0%"],
              y: liteMode ? ["0%", "6%", "-6%", "0%"] : ["0%", "15%", "-15%", "0%"],
              scale: liteMode ? [1, 1.05, 0.98, 1] : [1, 1.2, 0.9, 1],
              rotate: liteMode ? [0, 20, -20, 0] : [0, 90, 180, 0],
              opacity: 1
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: liteMode ? 14 + i * 2 : 20 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.33, 0.66, 1],
              delay: blob.delay
            }}
            className={`absolute rounded-full mix-blend-multiply dark:mix-blend-screen ${
              liteMode
                ? "filter blur-3xl opacity-10 dark:opacity-15"
                : "filter blur-[120px] md:blur-[160px] opacity-[0.12] dark:opacity-[0.15]"
            }`}
            style={{
              backgroundColor: blob.color,
              top: `${blob.initialY}%`,
              left: `${blob.initialX}%`,
              width: `${50 * blob.scale}vw`,
              height: `${50 * blob.scale}vw`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </AnimatePresence>

      {/* Rhythmic Pulse synced to isPlaying state */}
      <motion.div
        animate={{
          opacity: liteMode ? (isPlaying ? 0.02 : 0) : (isPlaying ? [0, 0.03, 0] : 0),
        }}
        transition={{
          duration: liteMode ? 0.4 : 2.5,
          repeat: liteMode ? 0 : Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-white dark:bg-white mix-blend-overlay pointer-events-none"
      />

      {/* Cinematic Grain & Vignette — subtle, not overpowering */}
      <div className="absolute inset-0 bg-noise opacity-[0.025] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)] opacity-30 dark:opacity-40 pointer-events-none" />
    </div>
  );
};

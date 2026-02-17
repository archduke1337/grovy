"use client";

import React, { useEffect, useRef } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { AnimatePresence, motion, useAnimationFrame } from "framer-motion";

interface AmbientBackgroundProps {
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ className }) => {
  const { colors, isPlaying } = usePlayer();

  // Create a mesh of 3 moving blobs for a liquid effect
  const blobs = [
    { color: colors.primary, initialX: -20, initialY: -20, scale: 1.5, delay: 0 },
    { color: colors.secondary, initialX: 120, initialY: -20, scale: 1.2, delay: 2 },
    { color: colors.accent || colors.primary, initialX: 50, initialY: 120, scale: 1.8, delay: 4 },
  ];

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-white dark:bg-black transition-colors duration-1000 ${className}`}>
      {/* Base gradient layer for depth - Darker for B&W focus */}
      <div 
        className="absolute inset-0 opacity-20 dark:opacity-30 transition-colors duration-[2000ms]"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.primary}10 0%, transparent 80%)`
        }}
      />
      
      {/* Animated Mesh Gradients */}
      <AnimatePresence>
        {isPlaying && blobs.map((blob, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              x: ["0%", "20%", "-20%", "0%"],
              y: ["0%", "15%", "-15%", "0%"],
              scale: [1, 1.2, 0.9, 1],
              rotate: [0, 90, 180, 0],
              opacity: 1
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.33, 0.66, 1],
              delay: blob.delay
            }}
            className="absolute rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] md:blur-[120px] opacity-20 dark:opacity-25"
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
          opacity: isPlaying ? [0, 0.05, 0] : 0,
        }}
        transition={{
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-white dark:bg-white mix-blend-overlay pointer-events-none"
      />

      {/* Cinematic Grain & Vignette */}
      <div className="absolute inset-0 bg-noise opacity-[0.04] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-20 dark:opacity-90 pointer-events-none" />
    </div>
  );
};

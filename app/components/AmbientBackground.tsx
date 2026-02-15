"use client";

import React, { useEffect, useRef } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, useAnimationFrame } from "framer-motion";

export const AmbientBackground: React.FC = () => {
  const { analyser, isPlaying, colors } = usePlayer();
  const blobRef1 = useRef<HTMLDivElement>(null);
  const blobRef2 = useRef<HTMLDivElement>(null);
  const dataArray = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (analyser) {
      dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, [analyser]);

  useAnimationFrame(() => {
    if (!analyser || !dataArray.current || !isPlaying) return;

    analyser.getByteFrequencyData(dataArray.current as any);
    
    // Get average low-end frequency for bass response
    const bass = dataArray.current.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const scale = 1 + (bass / 255) * 0.5;
    const opacity = 0.1 + (bass / 255) * 0.3;

    if (blobRef1.current) {
      blobRef1.current.style.transform = `scale(${scale}) translate(-20%, -20%)`;
      blobRef1.current.style.opacity = opacity.toString();
    }

  });

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-50 dark:opacity-30">
      {/* Dynamic Blobs */}
      <motion.div
        ref={blobRef1}
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -50, 50, 0],
          backgroundColor: colors.primary,
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-[60vw] h-[60vw] rounded-full blur-[150px]"
      />

      
      {/* Noise Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />
    </div>
  );
};

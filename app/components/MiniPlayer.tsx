"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import NextImage from "next/image";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize2,
} from "lucide-react";

interface MiniPlayerProps {
  visible: boolean;
  onExpand: () => void;
}

export default function MiniPlayer({ visible, onExpand }: MiniPlayerProps) {
  const {
    songs,
    currentSongIndex,
    isPlaying,
    togglePlayPause,
    nextTrack,
    previousTrack,
    currentTime,
    duration,
  } = usePlayer();

  const currentSong = songs[currentSongIndex];
  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-[60] hidden sm:flex items-center gap-3 rounded-2xl
                     bg-black/80 backdrop-blur-xl border border-white/10 p-2 pr-4 shadow-2xl
                     max-w-[min(340px,calc(100vw-2rem))]"
        >
          {/* Progress ring around album art */}
          <div className="relative flex-shrink-0 w-12 h-12">
            <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24" cy="24" r="21"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              <circle
                cx="24" cy="24" r="21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 21}`}
                strokeDashoffset={`${2 * Math.PI * 21 * (1 - progress / 100)}`}
                className="text-white/70 transition-all duration-300"
              />
            </svg>
            <NextImage
              src={currentSong.cover || "/icons/logo.png"}
              alt={currentSong.title}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover absolute top-1 left-1"
            />
          </div>

          {/* Song info */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate leading-tight">
              {currentSong.title}
            </p>
            <p className="text-white/50 text-[10px] truncate leading-tight">
              {currentSong.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={previousTrack}
              className="p-1 text-white/60 hover:text-white transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-1.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-1 text-white/60 hover:text-white transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={14} />
            </button>
          </div>

          {/* Expand button */}
          <button
            onClick={onExpand}
            className="p-1 text-white/40 hover:text-white transition-colors"
            aria-label="Expand player"
          >
            <Maximize2 size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

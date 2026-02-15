"use client";

import React, { useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";

export const PlayerControls: React.FC = () => {
  const {
    isPlaying,
    togglePlayPause,
    nextTrack,
    previousTrack,
    isLoop,
    toggleLoop,
    isShuffle,
    toggleShuffle,
    volume,
    setVolume,
  } = usePlayer();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        nextTrack();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        previousTrack();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.1));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.1));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [togglePlayPause, nextTrack, previousTrack, volume, setVolume]);

  return (
    <div className="space-y-6">
      {/* Main controls */}
      {/* Main controls */}
      <div className="flex items-center justify-center gap-4 md:gap-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={previousTrack}
          className="p-3 md:p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          aria-label="Previous track"
        >
          <SkipBack size={24} className="text-gray-700 dark:text-gray-300 md:w-8 md:h-8" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={32} className="text-white fill-white md:w-10 md:h-10" />
          ) : (
            <Play size={32} className="text-white fill-white ml-1 md:w-10 md:h-10" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={nextTrack}
          className="p-3 md:p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          aria-label="Next track"
        >
          <SkipForward size={24} className="text-gray-700 dark:text-gray-300 md:w-8 md:h-8" />
        </motion.button>
      </div>

      {/* Secondary controls */}
      <div className="flex items-center justify-center gap-4 md:gap-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleShuffle}
          className={`p-2 rounded-full transition-colors ${
            isShuffle
              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          aria-label="Toggle shuffle"
        >
          <Shuffle size={20} className="md:w-6 md:h-6" />
        </motion.button>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5">
          {volume === 0 ? (
            <VolumeX size={18} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <Volume2 size={18} className="text-gray-600 dark:text-gray-400" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-gray-300 dark:bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
            aria-label="Volume"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          className={`p-2 rounded-full transition-colors ${
            isLoop
              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          aria-label="Toggle loop"
        >
          {isLoop ? <Repeat1 size={20} className="md:w-6 md:h-6" /> : <Repeat size={20} className="md:w-6 md:h-6" />}
        </motion.button>
      </div>
    </div>
  );
};

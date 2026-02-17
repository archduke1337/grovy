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
      // Ignore if typing in a text input or textarea
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' && (
          (target as HTMLInputElement).type === 'text' || 
          (target as HTMLInputElement).type === 'search' || 
          (target as HTMLInputElement).type === 'password' || 
          (target as HTMLInputElement).type === 'email'
        )) || 
        target.tagName === 'TEXTAREA'
      ) return;

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
      <div className="flex items-center justify-center gap-6 md:gap-10">
        <motion.button
          whileHover={{ scale: 1.1, color: "var(--player-primary)" }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); previousTrack(); }}
          className="p-2 md:p-3 rounded-full text-gray-500 hover:bg-white/10 dark:text-gray-400 dark:hover:bg-white/10 transition-all"
        >
          <SkipBack size={28} className="md:w-8 md:h-8" fill="currentColor" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px var(--player-primary)" }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
          className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl relative group overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, var(--player-primary), var(--player-secondary))`,
            boxShadow: `0 10px 40px -10px var(--player-primary)`
          }}
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
          {isPlaying ? (
            <Pause size={40} className="text-white fill-white relative z-10 md:w-10 md:h-10" />
          ) : (
            <Play size={40} className="text-white fill-white ml-1 relative z-10 md:w-10 md:h-10" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, color: "var(--player-primary)" }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); nextTrack(); }}
          className="p-2 md:p-3 rounded-full text-gray-500 hover:bg-white/10 dark:text-gray-400 dark:hover:bg-white/10 transition-all"
        >
          <SkipForward size={28} className="md:w-8 md:h-8" fill="currentColor" />
        </motion.button>
      </div>

      {/* Secondary controls */}
      <div className="flex items-center justify-center gap-6 md:gap-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
          style={{ 
            color: isShuffle ? "var(--player-primary)" : undefined
          }}
          className={`p-2.5 rounded-full transition-all ${
            isShuffle
              ? "bg-[var(--player-primary)]/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Shuffle size={20} className="md:w-5 md:h-5" />
        </motion.button>

        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/5 group/vol">
          <button 
             onClick={() => setVolume(volume === 0 ? 1 : 0)}
             className="text-gray-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer">
             <div 
               className="absolute inset-0 bg-white/10" 
             />
             <motion.div 
               layout
               className="h-full rounded-full"
               style={{ 
                 width: `${volume * 100}%`,
                 backgroundColor: "var(--player-primary)" 
               }}
             />
             <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
             />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); toggleLoop(); }}
          style={{ 
            color: isLoop ? "var(--player-primary)" : undefined
          }}
          className={`p-2.5 rounded-full transition-all ${
            isLoop
              ? "bg-[var(--player-primary)]/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {isLoop ? <Repeat1 size={20} className="md:w-5 md:h-5" /> : <Repeat size={20} className="md:w-5 md:h-5" />}
        </motion.button>
      </div>
    </div>
  );
};

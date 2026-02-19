"use client";

import React, { useState, useRef } from "react";
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
import { SleepTimerButton, SleepTimerModal } from "@/app/components/SleepTimer";

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
    playbackSpeed,
    setPlaybackSpeed,
    sleepTimerMinutes,
    setSleepTimer,
    sleepTimerEndTime,
  } = usePlayer();

  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const prevVolumeRef = useRef(0.8);

  // Keyboard shortcuts are handled globally in PlayerContext — no duplicate handler here

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8">
      {/* Main controls - Prominent & Tactile */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-12">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); previousTrack(); }}
          className="p-3 sm:p-4 rounded-full text-white/70 hover:text-white active:text-white transition-all bg-transparent hover:bg-white/10 active:bg-white/10"
        >
          <SkipBack size={24} className="sm:w-8 sm:h-8 md:w-9 md:h-9" fill="currentColor" strokeWidth={0} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,255,255,0.3)" }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
          className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full relative group overflow-hidden border border-white/20 backdrop-blur-2xl"
          style={{ 
            background: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)"
          }}
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-500" />
          {isPlaying ? (
            <Pause size={32} className="text-white fill-white relative z-10 sm:w-10 sm:h-10 md:w-10 md:h-10" />
          ) : (
            <Play size={32} className="text-white fill-white ml-1.5 sm:ml-2 relative z-10 sm:w-10 sm:h-10 md:w-10 md:h-10" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); nextTrack(); }}
          className="p-3 sm:p-4 rounded-full text-white/70 hover:text-white active:text-white transition-all bg-transparent hover:bg-white/10 active:bg-white/10"
        >
          <SkipForward size={24} className="sm:w-8 sm:h-8 md:w-9 md:h-9" fill="currentColor" strokeWidth={0} />
        </motion.button>
      </div>

      {/* Secondary controls - Glass Capsule (responsive wrapping) */}
      <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-4 md:gap-6 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-2xl sm:rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg max-w-full">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
          className={`p-2 rounded-full transition-all ${
            isShuffle
              ? "text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "text-white/40 hover:text-white active:text-white"
          }`}
        >
          <Shuffle size={18} className="sm:w-5 sm:h-5" />
        </motion.button>

        <div className="w-px h-5 sm:h-6 bg-white/10 hidden sm:block" />

        {/* Volume - icon toggles mute on mobile, full slider on desktop */}
        <div className="flex items-center gap-2 sm:gap-4 group/vol">
          <button 
             onClick={() => {
               if (volume === 0) {
                 setVolume(prevVolumeRef.current || 0.8);
               } else {
                 prevVolumeRef.current = volume;
                 setVolume(0);
               }
             }}
             className="text-white/60 hover:text-white active:text-white transition-colors p-1"
          >
            {volume === 0 ? <VolumeX size={18} className="sm:w-5 sm:h-5" /> : <Volume2 size={18} className="sm:w-5 sm:h-5" />}
          </button>
          
          <div className="hidden sm:block w-20 md:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group-hover/vol:h-2 transition-all">
             <motion.div 
               layout
               className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
               style={{ 
                 width: `${volume * 100}%`,
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

        <div className="w-px h-5 sm:h-6 bg-white/10 hidden sm:block" />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); toggleLoop(); }}
          className={`p-2 rounded-full transition-all ${
            isLoop
              ? "text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "text-white/40 hover:text-white active:text-white"
          }`}
        >
          {isLoop ? <Repeat1 size={18} className="sm:w-5 sm:h-5" /> : <Repeat size={18} className="sm:w-5 sm:h-5" />}
        </motion.button>

        <div className="w-px h-5 sm:h-6 bg-white/10 hidden sm:block" />

        {/* Playback Speed */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
            const idx = speeds.indexOf(playbackSpeed);
            setPlaybackSpeed(speeds[(idx + 1) % speeds.length]);
          }}
          className={`px-2 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold transition-all ${
            playbackSpeed !== 1
              ? "text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "text-white/40 hover:text-white active:text-white"
          }`}
          title={`Playback speed: ${playbackSpeed}x`}
        >
          {playbackSpeed}x
        </motion.button>

        <div className="w-px h-5 sm:h-6 bg-white/10 hidden sm:block" />

        {/* Sleep Timer */}
        <SleepTimerButton
          sleepMinutes={sleepTimerMinutes}
          sleepEndTime={sleepTimerEndTime}
          onClick={() => setIsSleepTimerOpen(true)}
        />
      </div>

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        sleepMinutes={sleepTimerMinutes}
        sleepEndTime={sleepTimerEndTime}
        onSetTimer={setSleepTimer}
      />
    </div>
  );
};

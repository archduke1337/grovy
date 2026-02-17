"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music, Volume2, VolumeX } from "lucide-react";
import { MusicPlayer } from "./MusicPlayer";
import { AmbientBackground } from "./AmbientBackground";

export const BottomPlayer = () => {
  const { currentSongIndex, songs, isPlaying, togglePlayPause, nextTrack, previousTrack, duration, currentTime, seek, volume, setVolume, colors } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  if (!songs || songs.length === 0) return null;

  const currentSong = songs[currentSongIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Mini Player Bar - Vision Pro Glass Capsule */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ willChange: "transform" }}
        className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-[700px] z-50"
      >
        <div 
          className="rounded-[3rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative backdrop-blur-3xl bg-black/60"
        >
          {/* Progress Bar Layer - Subtle Top Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 cursor-pointer group/progress z-20 hover:h-1 transition-all"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 if (rect.width > 0) {
                   seek((x / rect.width) * duration);
                 }
               }}>
            <motion.div 
              className="h-full relative rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ 
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="px-4 py-3 md:px-5 md:py-3 flex items-center justify-between gap-4 relative z-20">
            
            {/* Left: Song Info */}
            <div 
              className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden relative shadow-lg border border-white/10">
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover animate-[spin_8s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10">
                    <Music size={20} className="text-white" />
                  </div>
                )}
                {/* Overlay Icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <ChevronUp size={20} className="text-white" />
                </div>
              </div>
              
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="font-bold text-white truncate text-sm tracking-wide">
                  {currentSong?.title}
                </h4>
                <p className="text-xs text-white/50 truncate font-medium">
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            {/* Center: Controls - Floating Glass Keys */}
            <div className="flex items-center gap-4 md:gap-6 z-20">
              <button 
                onClick={(e) => { e.stopPropagation(); previousTrack(); }}
                className="p-2 text-white/50 hover:text-white transition-all hidden md:block hover:scale-110 active:scale-95"
              >
                <SkipBack size={24} fill="currentColor" strokeWidth={0} />
              </button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                className="p-3 rounded-full bg-white text-black shadow-lg flex items-center justify-center shrink-0 relative overflow-hidden group hover:brightness-110 transition-all"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </motion.button>

              <button 
                onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                className="p-2 text-white/50 hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <SkipForward size={24} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Player Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="fixed inset-0 z-[100] bg-bg/95 dark:bg-bg-dark/95 backdrop-blur-3xl flex flex-col items-center overflow-y-auto"
          >
            {/* Grab Handle */}
            <div className="sticky top-0 left-0 right-0 h-10 flex items-center justify-center cursor-pointer z-10" onClick={() => setIsExpanded(false)}>
               <div className="w-16 h-1.5 bg-gray-300/50 dark:bg-white/20 rounded-full mb-2" />
            </div>
            
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-8 right-8 p-3 rounded-full glass-effect dark:glass-effect-dark text-gray-500 hover:text-blue-600 transition-all z-20"
            >
              <ChevronUp size={24} className="rotate-180" />
            </button>

            {/* Embedded Full Player Component with padding for mobile */}
            <div className="w-full max-w-7xl px-4 py-8 md:py-16">
              <MusicPlayer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

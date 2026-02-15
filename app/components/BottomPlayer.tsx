"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music, Volume2, VolumeX } from "lucide-react";
import { MusicPlayer } from "./MusicPlayer";

export const BottomPlayer = () => {
  const { currentSongIndex, songs, isPlaying, togglePlayPause, nextTrack, previousTrack, duration, currentTime, seek, volume, setVolume, colors } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  if (!songs || songs.length === 0) return null;

  const currentSong = songs[currentSongIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Mini Player Bar */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-5xl z-40"
      >
        <div className="glass-effect dark:glass-effect-dark rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          {/* Progress Bar Layer */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-white/5 cursor-pointer group/progress"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 seek((x / rect.width) * duration);
               }}>
            <motion.div 
              className="h-full relative"
              style={{ width: `${progress}%`, background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
            >
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ borderColor: colors.primary }}
              />
            </motion.div>
          </div>

          <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4">
            
            {/* Left: Song Info */}
            <div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-200 dark:bg-gray-800 flex-shrink-0 overflow-hidden relative shadow-lg group-hover:scale-105 transition-transform">
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/10">
                    <Music size={24} style={{ color: colors.primary }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ChevronUp size={20} className="text-white" />
                </div>
              </div>
              
              <div className="flex flex-col min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm md:text-base tracking-tight leading-tight">
                  {currentSong?.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                  {currentSong?.artist || "Unknown artist"}
                </p>
              </div>
            </div>

            {/* Center: Controls */}
            <div className="flex items-center gap-2 md:gap-6">
              <button 
                onClick={(e) => { e.stopPropagation(); previousTrack(); }}
                className="p-2.5 text-gray-400 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all hidden md:block"
                style={{ color: undefined }} // Reset dynamic color? No, keep gray, hover logic is tricky with inline.
              >
                <SkipBack size={20} fill="currentColor" />
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                style={{ backgroundColor: colors.primary, boxShadow: `0 10px 20px -5px ${colors.primary}60` }}
                className="p-3.5 md:p-4 rounded-full text-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                className="p-2.5 text-gray-400 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>

            {/* Right: Actions / Volume */}
            <div className="hidden md:flex items-center gap-2 relative">
               <div 
                 className="flex items-center gap-2"
                 onMouseEnter={() => setShowVolume(true)}
                 onMouseLeave={() => setShowVolume(false)}
               >
                 <button className="p-2.5 text-gray-400 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all">
                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                 </button>
                 
                 <AnimatePresence>
                   {showVolume && (
                     <motion.div 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden"
                     >
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-24 accent-blue-600"
                        />
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
               
                <div className="relative group/hud">
                  <button 
                    className="p-2.5 text-gray-400 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all flex items-center justify-center"
                    aria-label="Keyboard Shortcuts"
                  >
                    <div className="px-1.5 py-0.5 border border-gray-400/50 rounded text-[9px] font-black uppercase tracking-tighter">Kbd</div>
                  </button>
                  <div className="absolute bottom-full right-0 mb-4 w-56 p-4 glass-effect dark:glass-effect-dark rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/hud:opacity-100 group-hover/hud:translate-y-0 transition-all z-50">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-white/5 pb-2">Quick Shortcuts</h5>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500">Search</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-gray-400">⌘ K</kbd>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500">Play/Pause</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-gray-400">Space</kbd>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500">Next Track</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-gray-400">→</kbd>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500">Volume</span>
                          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-gray-400">↑ ↓</kbd>
                       </div>
                    </div>
                  </div>
                </div>

               <button 
                 onClick={() => setIsExpanded(true)}
                 className="p-2.5 text-gray-400 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all"
               >
                 <ChevronUp size={20} />
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
            className="fixed inset-0 z-50 bg-bg/95 dark:bg-bg-dark/95 backdrop-blur-3xl flex flex-col items-center overflow-y-auto"
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

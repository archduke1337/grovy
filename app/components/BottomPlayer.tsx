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
      {/* Mini Player Bar */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ willChange: "transform" }}
        className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-[800px] z-50"
      >
        <div 
          className="rounded-[3rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 relative backdrop-blur-3xl"
          style={{ 
            background: `linear-gradient(90deg, rgba(20,20,20,0.95) 0%, rgba(30,30,30,0.95) 100%)`
          }}
        >
          {/* Animated Glow Stroke */}
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-[3rem] border border-white/20 pointer-events-none z-10"
            style={{ 
                boxShadow: `inset 0 0 20px ${colors.primary}20` 
            }}
          />

          <AmbientBackground className="absolute opacity-20 mix-blend-screen pointer-events-none" />
          
          {/* Progress Bar Layer - Top Border with Glow */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-white/5 cursor-pointer group/progress z-20 hover:h-1 transition-all"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 if (rect.width > 0) {
                   seek((x / rect.width) * duration);
                 }
               }}>
            <motion.div 
              className="h-full relative rounded-full"
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 0 10px ${colors.primary}`
              }}
            >
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-all scale-150"
              />
            </motion.div>
          </div>

          <div className="px-4 py-3 md:px-6 md:py-3.5 flex items-center justify-between gap-6 relative z-20">
            
            {/* Left: Song Info */}
            <div 
              className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden relative shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/5">
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover animate-[spin_10s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Music size={20} style={{ color: colors.primary }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <ChevronUp size={24} className="text-white" />
                </div>
              </div>
              
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="font-bold text-white truncate text-sm tracking-wide mb-1">
                  {currentSong?.title}
                </h4>
                <p className="text-xs text-gray-400 truncate font-medium group-hover:text-white transition-colors">
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            {/* Center: Controls */}
            <div className="flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-6 z-20">
              <button 
                onClick={(e) => { e.stopPropagation(); previousTrack(); }}
                className="p-2 text-gray-400 hover:text-white transition-all hidden md:block hover:scale-110 active:scale-95"
              >
                <SkipBack size={22} fill="currentColor" />
              </button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                className="p-3.5 rounded-full text-white shadow-xl flex items-center justify-center shrink-0 relative overflow-hidden group"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  boxShadow: `0 4px 15px ${colors.primary}40`
                }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors duration-300" />
                {isPlaying ? <Pause size={22} fill="currentColor" className="relative z-10" /> : <Play size={22} fill="currentColor" className="ml-1 relative z-10" />}
              </motion.button>

              <button 
                onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                className="p-2 text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <SkipForward size={22} fill="currentColor" />
              </button>
            </div>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center gap-5 relative">
               <div className="flex items-center gap-3 group/volume hover:bg-white/5 p-2 rounded-full transition-colors">
                 <button 
                   onClick={() => setVolume(volume === 0 ? 1 : 0)}
                   className="text-gray-400 group-hover/volume:text-white transition-colors"
                 >
                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                 </button>
                 <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group-hover/volume:h-1.5 transition-all">
                    <motion.div 
                      layout
                      className="h-full rounded-full"
                      style={{ 
                        width: `${volume * 100}%`,
                        backgroundColor: colors.primary
                      }}
                    />
                    <input 
                       type="range"
                       min="0"
                       max="1"
                       step="0.01"
                       value={volume}
                       onChange={(e) => setVolume(parseFloat(e.target.value))}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                 </div>
               </div>

               <button 
                 onClick={() => setIsExpanded(true)}
                 className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all hover:rotate-180 duration-500"
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

"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlayerControls } from "./PlayerControls";
import { Playlist } from "./Playlist";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Heart, ListPlus, LayoutList, ChevronDown } from "lucide-react";
import { LyricsView } from "./LyricsView";
import { RelatedTracks } from "./RelatedTracks";
import { ArtistInfo } from "./ArtistInfo";
import { AmbientBackground } from "./AmbientBackground";
import NextImage from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const MusicPlayer: React.FC = () => {
  const {
    songs,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    seek,
    toggleFavorite,
    isFavorite,
    colors,
    openPlaylistModal
  } = usePlayer();

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [showQueueOnMobile, setShowQueueOnMobile] = useState(false);

  const currentSong = songs[currentSongIndex];
  const favorite = currentSong ? isFavorite(currentSong.id) : false;

  return (
    <div className="fixed inset-0 w-full h-dvh flex flex-col items-center justify-center bg-black overflow-hidden touch-none">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-white/[0.04] blur-[80px] sm:blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
         <motion.div 
           animate={{ 
             background: `radial-gradient(circle at 50% 120%, ${colors.primary}15, transparent 70%)`,
           }}
           transition={{ duration: 2 }}
           className="absolute inset-0 opacity-50 mix-blend-screen"
         />
         <AmbientBackground className="absolute opacity-15 saturate-150 mix-blend-plus-lighter" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full max-w-[1400px] flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-10 z-10 p-3 pt-10 sm:p-6 sm:pt-10 lg:p-10 relative"
      >
        {/* Mobile-Only Header toggle */}
        <div className="lg:hidden absolute top-6 left-0 right-0 flex justify-between px-6 z-30">
           <button 
             onClick={() => setShowQueueOnMobile(false)} 
             className={`p-2 rounded-full transition-all ${!showQueueOnMobile ? "text-white bg-white/10" : "text-white/30"}`}
           >
              <Music size={20} />
           </button>
           <button 
             onClick={() => setShowQueueOnMobile(true)} 
             className={`p-2 rounded-full transition-all ${showQueueOnMobile ? "text-white bg-white/10" : "text-white/30"}`}
           >
              <LayoutList size={20} />
           </button>
        </div>

        {/* Center: Art & Controls (Hidden when Queue is shown on mobile) */}
        <AnimatePresence mode="wait">
          {!showQueueOnMobile || typeof window !== 'undefined' && window.innerWidth >= 1024 ? (
            <motion.div 
              key="player-main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full lg:w-1/2 flex flex-col items-center justify-center gap-2 sm:gap-3 lg:gap-5 flex-1 lg:h-full min-h-0 overflow-hidden"
            >
               {/* Album Art */}
               <div className="flex-1 flex items-center justify-center min-h-0 w-full max-h-[35vh] sm:max-h-[40vh] lg:max-h-[50vh]">
                 <motion.div
                  layoutId={`art-${currentSongIndex}`}
                  className="relative aspect-square h-full max-h-[200px] sm:max-h-[280px] md:max-h-[340px] lg:max-h-[420px] w-auto group z-20"
                 >
                    <motion.div 
                      animate={{ 
                        opacity: isPlaying ? 0.4 : 0.15,
                        scale: isPlaying ? 1.05 : 1,
                        background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})`
                      }}
                      transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
                      className="absolute inset-0 blur-[40px] sm:blur-[60px] rounded-full opacity-20" 
                    />
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="relative w-full h-full rounded-[1rem] sm:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border border-white/10 bg-[#1a1a1a]"
                    >
                       {currentSong?.cover ? (
                         <>
                           <NextImage
                             key={currentSong.cover}
                             src={getHDThumbnail(currentSong.cover) || ""}
                             alt={currentSong?.title}
                             width={420}
                             height={420}
                             className="w-full h-full object-cover"
                             priority
                           />
                           <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                         </>
                       ) : (
                         <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                           <Music className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 text-white/5" />
                         </div>
                       )}
                    </motion.div>
                 </motion.div>
               </div>

               {/* Song Info & Progress */}
               <div className="w-full max-w-md space-y-1.5 sm:space-y-2 lg:space-y-3 text-center shrink-0 px-3 sm:px-4">
                  <div className="space-y-0.5 overflow-hidden">
                     <motion.h2 
                        key={currentSong?.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate leading-tight"
                        title={currentSong?.title}
                      >
                        {currentSong?.title || "Choose a Vibe"}
                      </motion.h2>
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <span className="text-[13px] sm:text-sm md:text-base lg:text-lg font-medium text-white/50 truncate block max-w-full">
                          {currentSong?.artist || "Grovy Music"}
                        </span>
                      </motion.div>
                  </div>

                  {/* Progress Bar */}
                   <div className="space-y-1 sm:space-y-1.5 group/progress w-full">
                     <div className="relative h-1 sm:h-1.5 w-full bg-white/10 rounded-full cursor-pointer transition-all duration-300 hover:h-2 overflow-visible">
                       <div className="absolute -inset-2 bg-white/5 rounded-full opacity-0 group-hover/progress:opacity-100 blur-md transition-opacity" />
                       <motion.div 
                         className="absolute inset-y-0 left-0 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                         style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                       >
                         <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-100 transition-transform" />
                       </motion.div>
                       <input
                         type="range"
                         min="0"
                         max={duration || 0}
                         value={currentTime}
                         onChange={(e) => seek(parseFloat(e.target.value))}
                         className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                         style={{ touchAction: 'none' }}
                       />
                     </div>
                     <div className="flex justify-between text-[9px] sm:text-[10px] font-medium text-white/25 tracking-wider px-0.5">
                       <span>{formatTime(currentTime)}</span>
                       <span>{formatTime(duration)}</span>
                     </div>
                   </div>

                   <div className="flex justify-center pt-0.5 sm:pt-1">
                      <PlayerControls />
                   </div>

                   {/* Action buttons */}
                   <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6 pb-1">
                       <motion.button 
                         whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.12)" }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => currentSong && toggleFavorite(currentSong.id)} 
                         className={`p-2 sm:p-2.5 lg:p-3 rounded-full backdrop-blur-md border border-white/5 transition-all duration-300 ${
                           favorite 
                             ? "bg-red-500/20 text-red-500 border-red-500/30" 
                             : "bg-white/5 text-white/50 hover:text-white"
                         }`}
                       >
                         <Heart size={16} className="sm:w-[18px] sm:h-[18px]" fill={favorite ? "currentColor" : "none"} strokeWidth={2} />
                       </motion.button>
                       
                       <motion.button 
                         whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.12)" }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => setIsLyricsOpen(true)} 
                         className="p-2 sm:p-2.5 lg:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-white/50 hover:text-white transition-all"
                       >
                          <Music size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                       </motion.button>
                       
                       <div className="scale-100">
                         <ArtistInfo />
                       </div>
                       
                       <motion.button 
                         whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.12)" }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => currentSong && openPlaylistModal(currentSong)} 
                         className="p-2 sm:p-2.5 lg:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-white/50 hover:text-white transition-all"
                       >
                          <ListPlus size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                       </motion.button>
                   </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="player-queue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:hidden w-full flex-1 flex flex-col gap-4 overflow-hidden pt-12"
            >
               <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                     <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <LayoutList size={22} style={{ color: colors.primary }} />
                        Queue
                     </h3>
                     <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{songs.length} Tracks</span>
                  </div>
                  <Playlist />
                  <div className="pt-8 pb-10">
                    <RelatedTracks />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop View: Right Panel (Always visible on LG) */}
        <div 
          className="hidden lg:flex lg:w-1/2 h-full lg:max-h-[80vh] flex-col gap-3 rounded-[2rem] p-6 backdrop-blur-3xl transition-colors duration-1000 bg-white/[0.03] border border-white/[0.04] overflow-hidden w-full"
          style={{ boxShadow: `0 20px 60px -10px rgba(0,0,0,0.5)` }}
        >
           <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
                <span className="w-1.5 h-6 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: colors.primary, color: colors.primary }} />
                Up Next
              </h3>
              <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] lg:text-xs font-bold text-white/40">
                {songs.length} Tracks
              </div>
           </div>

           <div 
             className="flex-1 overflow-y-auto custom-scrollbar -mr-1 pr-1 touch-pan-y"
             onWheel={(e) => e.stopPropagation()} 
           >
              <Playlist />
           </div>

           <div className="pt-3 border-t border-white/5 shrink-0">
              <RelatedTracks />
           </div>
        </div>
      </motion.div>
      <LyricsView isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
    </div>
  );
};

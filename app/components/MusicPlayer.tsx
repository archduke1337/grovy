"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlayerControls } from "./PlayerControls";
import { Playlist } from "./Playlist";
import { motion } from "framer-motion";
import { Music, Heart, ListPlus } from "lucide-react";
import { LyricsView } from "./LyricsView";
import { RelatedTracks } from "./RelatedTracks";
import { ArtistInfo } from "./ArtistInfo";
import { AmbientBackground } from "./AmbientBackground";

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

  const currentSong = songs[currentSongIndex];
  const favorite = currentSong ? isFavorite(currentSong.id) : false;

  return (
    <div className="fixed inset-0 w-full h-full h-dvh flex flex-col items-center justify-center bg-black overflow-hidden touch-none">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-white/[0.04] blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
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
        className="w-full h-full max-w-[1400px] flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-12 z-10 p-4 sm:p-6 lg:p-10 relative"
      >
        {/* Center: Art & Controls */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center gap-3 sm:gap-4 lg:gap-6 h-full max-h-full py-2 sm:py-4 shrink-0 overflow-hidden">
           <div className="flex-1 flex items-center justify-center min-h-0 w-full max-h-[40vh] sm:max-h-[45vh] lg:max-h-[50vh]">
             <motion.div
              layoutId={`art-${currentSongIndex}`}
              className="relative aspect-square h-full max-h-[250px] sm:max-h-[320px] md:max-h-[380px] lg:max-h-[420px] w-auto group z-20"
             >
                <motion.div 
                  animate={{ 
                    opacity: isPlaying ? 0.4 : 0.15,
                    scale: isPlaying ? 1.05 : 1,
                    background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})`
                  }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
                  className="absolute inset-0 blur-[50px] sm:blur-[70px] rounded-full opacity-20" 
                />
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative w-full h-full rounded-[1.2rem] sm:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border border-white/10 bg-[#1a1a1a]"
                >
                   {currentSong?.cover ? (
                     <>
                       <motion.img
                         key={currentSong.cover}
                         src={currentSong.cover}
                         alt={currentSong?.title}
                         className="w-full h-full object-cover"
                         initial={{ scale: 1.1, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         transition={{ duration: 0.8 }}
                       />
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                     </>
                   ) : (
                     <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                       <Music className="w-16 h-16 sm:w-24 sm:h-24 text-white/5" />
                     </div>
                   )}
                </motion.div>
             </motion.div>
           </div>

           {/* Song Info & Progress */}
           <div className="w-full max-w-lg space-y-2 sm:space-y-3 text-center shrink-0 px-2 sm:px-4">
              <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                 <motion.h2 
                    key={currentSong?.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight truncate leading-tight p-1"
                    title={currentSong?.title}
                  >
                    {currentSong?.title || "Choose a Vibe"}
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="text-sm sm:text-base md:text-lg font-medium text-white/50 truncate block max-w-full">
                      {currentSong?.artist || "Grovy Music"}
                    </span>
                  </motion.div>
              </div>

              {/* Progress Bar */}
               <div className="space-y-1.5 sm:space-y-2 group/progress px-1 sm:px-2 w-full">
                 <div className="relative h-1 sm:h-1.5 w-full bg-white/10 rounded-full cursor-pointer transition-all duration-300 hover:h-2 overflow-visible">
                   <div className="absolute -inset-2 bg-white/5 rounded-full opacity-0 group-hover/progress:opacity-100 blur-md transition-opacity" />
                   <motion.div 
                     className="absolute inset-y-0 left-0 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                     style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                   >
                     <div className="absolute -right-1.5 sm:-right-2 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-100 transition-transform" />
                   </motion.div>
                   <input
                     type="range"
                     min="0"
                     max={duration || 0}
                     value={currentTime}
                     onChange={(e) => seek(parseFloat(e.target.value))}
                     className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                   />
                 </div>
                 <div className="flex justify-between text-[9px] sm:text-[10px] font-medium text-white/25 tracking-wider px-0.5 sm:px-1">
                   <span>{formatTime(currentTime)}</span>
                   <span>{formatTime(duration)}</span>
                 </div>
               </div>

               <div className="flex justify-center pt-1 sm:pt-2">
                  <PlayerControls />
               </div>

               {/* Action buttons */}
               <div className="flex items-center justify-center gap-4 sm:gap-6 pb-1 sm:pb-2">
                   <motion.button 
                     whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.12)" }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => currentSong && toggleFavorite(currentSong.id)} 
                     className={`p-2.5 sm:p-3 rounded-full backdrop-blur-md border border-white/5 transition-all duration-300 ${
                       favorite 
                         ? "bg-red-500/20 text-red-500 border-red-500/30" 
                         : "bg-white/5 text-white/50 hover:text-white"
                     }`}
                   >
                     <Heart size={18} fill={favorite ? "currentColor" : "none"} strokeWidth={2} />
                   </motion.button>
                   
                   <motion.button 
                     whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.12)" }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setIsLyricsOpen(true)} 
                     className="p-2.5 sm:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-white/50 hover:text-white transition-all"
                   >
                      <Music size={18} strokeWidth={2} />
                   </motion.button>
                   
                   <div className="scale-100">
                     <ArtistInfo />
                   </div>
                   
                   <motion.button 
                     whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.12)" }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => currentSong && openPlaylistModal(currentSong)} 
                     className="p-2.5 sm:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-white/50 hover:text-white transition-all"
                   >
                      <ListPlus size={18} strokeWidth={2} />
                   </motion.button>
               </div>
           </div>
        </div>

        {/* Right: Playlist & Discovery */}
        <div 
          className="lg:w-1/2 h-[300px] sm:h-[350px] lg:h-full lg:max-h-[80vh] flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 backdrop-blur-3xl transition-colors duration-1000 bg-white/[0.03] border border-white/[0.04] overflow-hidden"
          style={{ boxShadow: `0 20px 60px -10px rgba(0,0,0,0.5)` }}
        >
           <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/5 shrink-0">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2.5 sm:gap-3">
                <span className="w-1 sm:w-1.5 h-5 sm:h-6 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: colors.primary, color: colors.primary }} />
                Up Next
              </h3>
              <div className="px-2.5 sm:px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] sm:text-xs font-bold text-white/40">
                {songs.length} Tracks
              </div>
           </div>

           <div 
             className="flex-1 overflow-y-auto custom-scrollbar -mr-1 sm:-mr-2 pr-1 sm:pr-2 touch-pan-y"
             onWheel={(e) => e.stopPropagation()} 
           >
              <Playlist />
           </div>

           <div className="pt-3 sm:pt-4 border-t border-white/5 shrink-0">
              <RelatedTracks />
           </div>
        </div>
      </motion.div>
      <LyricsView isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
    </div>
  );
};

"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlayerControls } from "./PlayerControls";
import { Playlist } from "./Playlist";
import { motion } from "framer-motion";
import { Music, Heart, Sparkles, Share2, Zap, ListPlus } from "lucide-react";
import { LyricsView } from "./LyricsView";
import { RelatedTracks } from "./RelatedTracks";
import { ArtistInfo } from "./ArtistInfo";
import { AmbientBackground } from "./AmbientBackground";
import { useState } from "react";

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
    loadSongs,
    toggleFavorite,
    isFavorite,
    startRadio,
    colors,
    openPlaylistModal
  } = usePlayer();

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);



  const currentSong = songs[currentSongIndex];
  const favorite = currentSong ? isFavorite(currentSong.id) : false;

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden touch-none">
      
      {/* 1. Immersive Vision Pro Background - Synced to Music */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {/* Top Spotlight - Subtle White Haze for depth */}
         <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-white/[0.05] blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
         
         {/* Dynamic Ambient Glow - Synced with Music Colors */}
         <motion.div 
           animate={{ 
             background: `radial-gradient(circle at 50% 120%, ${colors.primary}20, transparent 70%)`,
           }}
           transition={{ duration: 2 }}
           className="absolute inset-0 opacity-40 mix-blend-screen"
         />
         
         {/* Animated Blobs for "Alive" feel */}
         <AmbientBackground className="absolute opacity-20 saturate-150 mix-blend-plus-lighter" />

         {/* Vignette */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ willChange: "transform, opacity" }}
        className="w-full h-full max-w-[1400px] flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 z-10 p-6 lg:p-12 relative"
      >
        {/* Center: Cinematic Art & Main Controls */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center gap-4 lg:gap-8 h-full max-h-full py-4 shrink-0 overflow-hidden">
           <div className="flex-1 flex items-center justify-center min-h-0 w-full max-h-[50vh]">
             <motion.div
              layoutId={`art-${currentSongIndex}`}
              className="relative aspect-square h-full max-h-[300px] md:max-h-[400px] lg:max-h-[450px] w-auto group perspective-[1000px] z-20"
             >
                {/* Dynamic Glow Layers */}
                <motion.div 
                  animate={{ 
                    opacity: isPlaying ? 0.5 : 0.2,
                    scale: isPlaying ? 1.05 : 1,
                    background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})`
                  }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
                  className="absolute inset-0 blur-[60px] md:blur-[80px] rounded-full opacity-20" 
                />
                
                {/* Main Artwork Container */}
                <motion.div 
                  whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative w-full h-full rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border border-white/10 bg-[#1a1a1a]"
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
                       {/* Glass Specular Reflection */}
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                     </>
                   ) : (
                     <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                       <Music className="w-24 h-24 text-white/5" />
                     </div>
                   )}
                </motion.div>
             </motion.div>
           </div>

           {/* Song Info & Progress - Compacted */}
           <div className="w-full max-w-lg space-y-3 text-center shrink-0 px-4">
              <div className="space-y-1 overflow-hidden">
                 <motion.h2 
                    key={currentSong?.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate leading-tight drop-shadow-xl p-1"
                    title={currentSong?.title}
                  >
                    {currentSong?.title || "Choose a Vibe"}
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span 
                      className="text-base md:text-lg font-medium text-white/60 tracking-wide truncate block max-w-full"
                    >
                      {currentSong?.artist || "Grovy Music"}
                    </span>
                  </motion.div>
              </div>

              {/* Progress Bar - Vision Pro Glass Style */}
               <div className="space-y-2 group/progress px-2 w-full">
                 <div className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer transition-all duration-300 hover:h-2 overflow-visible">
                   {/* Hover Glow Background */}
                   <div className="absolute -inset-2 bg-white/5 rounded-full opacity-0 group-hover/progress:opacity-100 blur-md transition-opacity" />
                   
                   <motion.div 
                     className="absolute inset-y-0 left-0 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                     style={{ 
                       width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                     }}
                   >
                     {/* Glowing Knob - Always visible now */}
                     <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-100 transition-transform" />
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
                 
                 <div className="flex justify-between text-[10px] font-medium text-white/30 tracking-wider px-1">
                   <span>{formatTime(currentTime)}</span>
                   <span>{formatTime(duration)}</span>
                 </div>
               </div>

               <div className="flex justify-center pt-2">
                  <PlayerControls />
               </div>

               {/* Bottom Actions - Glass Circles */}
               <div className="flex items-center justify-center gap-6 pb-2">
                   <motion.button 
                     whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => currentSong && toggleFavorite(currentSong.id)} 
                     className={`p-3 rounded-full backdrop-blur-md border border-white/5 transition-all duration-300 ${
                       favorite 
                         ? "bg-red-500/20 text-red-500 border-red-500/30" 
                         : "bg-white/5 text-white/60 hover:text-white"
                     }`}
                   >
                     <Heart size={20} fill={favorite ? "currentColor" : "none"} strokeWidth={2} />
                   </motion.button>
                   
                   <motion.button 
                     whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setIsLyricsOpen(true)} 
                     className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-white/60 hover:text-white transition-all"
                   >
                      <Music size={20} strokeWidth={2} />
                   </motion.button>
                   
                   <div className="scale-100">
                     <ArtistInfo />
                   </div>
                   
                   <motion.button 
                     whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => currentSong && openPlaylistModal(currentSong)} 
                     className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-white/60 hover:text-white transition-all"
                   >
                      <ListPlus size={20} strokeWidth={2} />
                   </motion.button>
               </div>
           </div>
        </div>

        {/* Right: Playlist & Discovery (Visible!) - Organic Glass Container - SCROLL FIX */}
        <div 
          className="lg:w-1/2 h-[400px] lg:h-full lg:max-h-[80vh] flex flex-col gap-4 rounded-[2.5rem] p-6 backdrop-blur-3xl transition-colors duration-1000 bg-white/[0.03] border border-white/[0.05] overflow-hidden"
          style={{ 
            boxShadow: `0 20px 60px -10px rgba(0,0,0,0.5)`
          }}
        >
           {/* Header */}
           <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full shadow-[0_0_10px_currentColor]" style={{ background: colors.primary, color: colors.primary }} />
                Up Next
              </h3>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-white/50">
                {songs.length} Tracks
              </div>
           </div>

           <div 
             className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 touch-pan-y"
             onWheel={(e) => e.stopPropagation()} 
           >
              <Playlist />
           </div>

           <div className="pt-4 border-t border-white/5 shrink-0">
              <RelatedTracks />
           </div>
        </div>
      </motion.div>
      <LyricsView isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlayerControls } from "./PlayerControls";
import { Playlist } from "./Playlist";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Heart, ListPlus, LayoutList, ChevronDown, Settings2, Plus } from "lucide-react";
import { LyricsView } from "./LyricsView";
import { RelatedTracks } from "./RelatedTracks";
import { ArtistInfo } from "./ArtistInfo";
import { AmbientBackground } from "./AmbientBackground";
import NextImage from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";
import { Equalizer } from "./Equalizer";
import { ShareButton } from "./ShareButton";
import { QueueHistory } from "./QueueHistory";

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
    openPlaylistModal,
    audioContext,
    sourceNode,
    eqFilters,
  } = usePlayer();

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [showQueueOnMobile, setShowQueueOnMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isEqOpen, setIsEqOpen] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const currentSong = songs[currentSongIndex];
  const favorite = currentSong ? isFavorite(currentSong.id) : false;

  return (
    <div className="fixed inset-0 w-full h-dvh flex flex-col items-center justify-center bg-black overflow-hidden touch-none">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <motion.div 
           animate={{ 
             background: `radial-gradient(circle at 50% 50%, ${colors.primary}30, #000 100%)`,
           }}
           transition={{ duration: 2 }}
           className="absolute inset-0 opacity-60 mix-blend-screen"
         />
         <AmbientBackground className="absolute opacity-20 saturate-150 mix-blend-plus-lighter" />
         <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 z-10 p-6 relative"
      >
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-6 left-0 right-0 flex justify-between px-8 z-30">
           <button onClick={() => setShowQueueOnMobile(false)} className={`p-2 transition-all ${!showQueueOnMobile ? "text-white" : "text-white/30"}`}>
              <Music size={22} />
           </button>
           <button onClick={() => setShowQueueOnMobile(true)} className={`p-2 transition-all ${showQueueOnMobile ? "text-white" : "text-white/30"}`}>
              <LayoutList size={22} />
           </button>
        </div>

        <AnimatePresence mode="wait">
          {!showQueueOnMobile || isDesktop ? (
            <motion.div 
              key="player-main"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full lg:w-1/2 flex flex-col items-center gap-8"
            >
               {/* Large Album Art */}
               <motion.div
                layoutId={`art-${currentSongIndex}`}
                className="relative aspect-square w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] group apple-shadow"
               >
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden border border-white/10"
                  >
                     {currentSong?.cover ? (
                        <NextImage
                          src={getHDThumbnail(currentSong.cover) || ""}
                          alt={currentSong?.title}
                          width={600}
                          height={600}
                          className="w-full h-full object-cover"
                          priority
                        />
                     ) : (
                       <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                         <Music size={64} className="text-white/10" />
                       </div>
                     )}
                  </motion.div>
               </motion.div>

               {/* Info & Controls */}
               <div className="w-full space-y-6">
                  <div className="text-center lg:text-left space-y-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight truncate">
                      {currentSong?.title || "Not Playing"}
                    </h2>
                    <p className="text-lg sm:text-xl text-white/50 font-medium truncate">
                      {currentSong?.artist || "Grovy"}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 group/progress">
                    <div className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer">
                      <div 
                        className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-1000 ease-linear"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => seek(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-white/30 tabular-nums">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex justify-center lg:justify-start">
                     <PlayerControls />
                  </div>

                  <div className="flex items-center justify-center lg:justify-start gap-6">
                      <button 
                        onClick={() => toggleFavorite(currentSong?.id || "")} 
                        className={`transition-all ${favorite ? "text-pink-500 scale-110" : "text-white/40 hover:text-white"}`}
                        title="Favorite"
                      >
                        <Heart size={22} fill={favorite ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => setIsLyricsOpen(true)} 
                        className="text-white/40 hover:text-white transition-all hover:scale-110"
                        title="Lyrics"
                      >
                        <Music size={22} />
                      </button>
                      <button 
                        onClick={() => currentSong && openPlaylistModal(currentSong)} 
                        className="text-white/40 hover:text-white transition-all hover:scale-110"
                        title="Add to Playlist"
                      >
                        <Plus size={22} />
                      </button>
                      <button 
                        onClick={() => setIsEqOpen(true)} 
                        className="text-white/40 hover:text-white transition-all hover:scale-110"
                        title="Equalizer"
                      >
                        <Settings2 size={22} />
                      </button>
                      {currentSong && <ShareButton song={currentSong} />}
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="player-queue"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:hidden w-full h-full pt-16"
            >
               <div className="h-full overflow-y-auto custom-scrollbar">
                  <Playlist />
                  <QueueHistory />
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel (Desktop) */}
        <div className="hidden lg:flex flex-col w-1/3 h-[70vh] apple-glass rounded-3xl p-8 border border-white/5">
           <h3 className="text-xl font-bold text-white mb-6">Up Next</h3>
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Playlist />
              <QueueHistory />
           </div>
        </div>
      </motion.div>
      <LyricsView isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
      <Equalizer
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        audioContext={audioContext}
        sourceNode={sourceNode}
        filters={eqFilters}
      />
    </div>
  );
};

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import { getLyrics } from "@/app/lib/api";
import { X, Music } from "lucide-react";

export const LyricsView: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { songs, currentSongIndex, currentTime, duration, colors, isCommandPaletteOpen, seek } = usePlayer();
  const [lyrics, setLyrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    if (!isOpen || !currentSong) return;

    const controller = new AbortController();

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        const data = await getLyrics(currentSong.title, currentSong.artist || "", controller.signal);
        if (!controller.signal.aborted) setLyrics(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error("Lyrics fetch failed", e);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchLyrics();

    return () => { controller.abort(); };
  }, [isOpen, currentSong?.title, currentSong?.artist]);

  // Separate effect for keyboard listener to ensure cleanup always runs
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCommandPaletteOpen) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCommandPaletteOpen, onClose]);

  const activeLineRef = useRef<HTMLDivElement>(null);

  // Sync lyrics with current time (memoized to avoid recomputing on every render)
  const activeIndex = React.useMemo(() => lyrics?.lyrics?.findIndex((line: any, i: number) => {
    const nextLine = lyrics.lyrics[i + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  }), [lyrics, currentTime]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lyrics-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-0"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 sm:top-8 sm:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-50 backdrop-blur-md"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-4xl h-full flex flex-col px-6 py-12 md:px-12 md:py-16">
            <header className="mb-6 sm:mb-12 text-center shrink-0 pt-8 sm:pt-0">
               <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 sm:mb-2 truncate max-w-full px-4">
                 {currentSong?.title}
               </h2>
               <p className="text-base sm:text-xl text-white/50 font-bold truncate max-w-full px-4">
                 {currentSong?.artist}
               </p>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-8 py-[40vh] sm:py-[45vh] text-center">
               {isLoading ? (
                 <div className="h-full flex flex-col items-center justify-center gap-4 text-white/40">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Music size={40} className="sm:w-[48px] sm:h-[48px]" />
                    </motion.div>
                    <p className="font-black uppercase tracking-widest text-[10px] sm:text-xs">Finding Lyrics</p>
                 </div>
               ) : lyrics?.lyrics ? (
                 lyrics.lyrics.map((line: any, i: number) => {
                    const isActive = activeIndex === i;
                    const isNearby = activeIndex !== -1 && Math.abs(activeIndex - i) <= 3;
                    const nextLine = lyrics.lyrics[i + 1];
                    // Karaoke progress: how far through the active line
                    const lineEndTime = nextLine ? nextLine.time : duration;
                    const lineProgress = isActive && lineEndTime > line.time
                      ? Math.min(100, Math.max(0, ((currentTime - line.time) / (lineEndTime - line.time)) * 100))
                      : isActive ? 100 : 0;
                    
                    return (
                      <motion.div
                        key={i}
                        ref={isActive ? activeLineRef : null}
                        onClick={() => line.time !== undefined && seek(line.time)}
                        initial={{ opacity: 0 }}
                        animate={{ 
                           opacity: isActive ? 1 : (isNearby ? 0.35 : 0.1),
                           scale: isActive ? 1.05 : 1,
                           filter: isActive ? "blur(0px)" : "blur(1px)"
                        }}
                        transition={{ duration: 0.5 }}
                        className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-relaxed transition-all px-2 cursor-pointer select-none"
                        style={isActive ? {
                          backgroundImage: `linear-gradient(90deg, #fff ${lineProgress}%, ${colors.primary} ${lineProgress}%)`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        } : { color: "#fff" }}
                      >
                        {line.text}
                      </motion.div>
                    );
                 })
               ) : (
                 <div className="h-full flex items-center justify-center text-white/20 font-black uppercase tracking-widest text-sm sm:text-lg lg:text-xl px-10">
                   Lyrics not available for this track.
                 </div>
               )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

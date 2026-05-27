"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import { getLyrics } from "@/app/lib/api";
import { X, Music } from "lucide-react";

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsData {
  lyrics: LyricLine[];
  [key: string]: unknown;
}
import NextImage from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export const LyricsView: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { songs, currentSongIndex, currentTime, duration, colors, isCommandPaletteOpen, seek } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSong = songs[currentSongIndex];
  const currentTitle = currentSong?.title ?? "";
  const currentArtist = currentSong?.artist ?? "";

  useEffect(() => {
    if (!isOpen || !currentTitle) return;

    const controller = new AbortController();

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        const data = await getLyrics(currentTitle, currentArtist, controller.signal);
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
  }, [isOpen, currentTitle, currentArtist]);

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
  const activeIndex = React.useMemo(() => lyrics?.lyrics?.findIndex((line: LyricLine, i: number) => {
    const nextLine = lyrics?.lyrics?.[i + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  }) ?? -1, [lyrics, currentTime]);

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
          role="dialog"
          aria-modal="true"
          aria-label="Lyrics"
          className="fixed inset-0 z-120 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-0"
          style={{ overscrollBehavior: "contain" }}
        >
          <button 
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 sm:top-8 sm:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-opacity transition-transform transition-colors duration-300 z-50 backdrop-blur-md"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-6xl h-full flex flex-col lg:flex-row px-6 py-12 md:px-12 md:py-16 gap-12">
            {/* Left side on desktop: Song info */}
            <header className="lg:w-1/3 flex flex-col justify-center text-center lg:text-left shrink-0 pt-8 lg:pt-0">
               <div className="mb-8 hidden lg:block">
                  {currentSong?.cover && (
                    <NextImage 
                      src={getHDThumbnail(currentSong.cover) || ""} 
                      alt={currentSong.title} 
                      width={300} 
                      height={300} 
                      className="rounded-2xl shadow-2xl border border-white/10"
                    />
                  )}
               </div>
               <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 sm:mb-2 truncate max-w-full lg:whitespace-normal">
                 {currentSong?.title}
               </h2>
               <p className="text-base sm:text-xl text-white/50 font-bold truncate max-w-full">
                 {currentSong?.artist}
               </p>
            </header>

            {/* Right side: Lyrics */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 sm:space-y-10 py-[40vh] text-center lg:text-left">
               {isLoading ? (
                 <div className="h-full flex flex-col items-center justify-center gap-4 text-white/40">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Music size={40} className="sm:w-12 sm:h-12" />
                    </motion.div>
                    <p className="font-black uppercase tracking-widest text-[10px] sm:text-xs">Finding Lyrics</p>
                 </div>
               ) : lyrics?.lyrics ? (
                 lyrics.lyrics.map((line: LyricLine, i: number) => {
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
                           opacity: isActive ? 1 : (isNearby ? 0.4 : 0.15),
                           scale: isActive ? 1 : 0.95,
                           filter: isActive ? "blur(0px)" : "blur(1px)"
                        }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight transition-opacity transition-transform transition-colors duration-300 px-2 cursor-pointer select-none"
                        style={isActive ? {
                          backgroundImage: `linear-gradient(90deg, #fff ${lineProgress}%, rgba(255,255,255,0.2) ${lineProgress}%)`,
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

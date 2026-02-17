
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import { X, Music } from "lucide-react";

export const LyricsView: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { songs, currentSongIndex, currentTime, colors, isCommandPaletteOpen } = usePlayer();
  const [lyrics, setLyrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    if (!isOpen || !currentSong) return;

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist || "")}`);
        const data = await res.json();
        setLyrics(data);
      } catch (e) {
        console.error("Lyrics fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCommandPaletteOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSong, onClose, isCommandPaletteOpen]);

  const activeLineRef = useRef<HTMLDivElement>(null);

  // Sync lyrics with current time if they are synced
  const activeIndex = lyrics?.lyrics?.findIndex((line: any, i: number) => {
    const nextLine = lyrics.lyrics[i + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6 md:p-12"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-4xl h-full flex flex-col">
            <div className="mb-12 text-center">
               <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">{currentSong?.title}</h2>
               <p className="text-xl text-white/60 font-bold">{currentSong?.artist}</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 py-40 text-center">
               {isLoading ? (
                 <div className="h-full flex flex-col items-center justify-center gap-4 text-white/40">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Music size={48} />
                    </motion.div>
                    <p className="font-black uppercase tracking-widest text-xs">Finding Lyrics...</p>
                 </div>
               ) : lyrics?.lyrics ? (
                 lyrics.lyrics.map((line: any, i: number) => (
                   <motion.div
                     key={i}
                     ref={activeIndex === i ? activeLineRef : null}
                     initial={{ opacity: 0.2 }}
                     animate={{ 
                        opacity: activeIndex === i ? 1 : (activeIndex !== -1 && Math.abs(activeIndex - i) <= 2 ? 0.3 : 0.1),
                        scale: activeIndex === i ? 1.1 : 1,
                        color: activeIndex === i ? colors.primary : "#fff",
                        filter: activeIndex === i ? "blur(0px)" : "blur(2px)"
                     }}
                     className="text-2xl md:text-5xl font-black tracking-tight leading-relaxed transition-all duration-700"
                   >
                     {line.text}
                   </motion.div>
                 ))
               ) : (
                 <div className="h-full flex items-center justify-center text-white/20 font-black uppercase tracking-widest text-xl">
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

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import { Info, X, Users, Tag } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";
import { getArtistInfo } from "@/app/lib/api";

export const ArtistInfo: React.FC = () => {
  const { songs, currentSongIndex, colors, isCommandPaletteOpen } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    if (!isOpen || !currentSong) return;

    const controller = new AbortController();

    const fetchInfo = async () => {
      setIsLoading(true);
      try {
        const data = await getArtistInfo(currentSong.artist || "", controller.signal);
        if (!controller.signal.aborted) setInfo(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error("Info fetch failed", e);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchInfo();

    return () => { controller.abort(); };
  }, [isOpen, currentSong]);

  // Separate effect for keyboard listener to ensure cleanup always runs
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCommandPaletteOpen) setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCommandPaletteOpen]);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        title="Artist Info"
        className="p-3 sm:p-4 lg:p-5 rounded-full shadow-lg transition-all text-gray-400 bg-white/5 dark:bg-white/5 hover:text-blue-500 hover:bg-blue-500/10"
      >
        <Info size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="artist-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-950 w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl border-0 sm:border border-white/5 flex flex-col sm:block"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all z-20"
              >
                <X size={22} />
              </button>

              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-10 h-10 border-4 border-gray-200 dark:border-white/10 border-t-blue-500 rounded-full"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Retrieving Biography</p>
                </div>
              ) : info?.artist ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar sm:overflow-visible pr-0 sm:pr-2 space-y-8 md:space-y-10 pt-10 sm:pt-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 text-center sm:text-left">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 border-2 border-white/10 sm:rotate-3 transition-transform hover:rotate-0 duration-500 bg-zinc-900">
                       <Image 
                         src={getHDThumbnail(currentSong?.cover) || ""} 
                         alt={info.artist.name} 
                         width={200}
                         height={200}
                         className="w-full h-full object-cover" 
                       />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                       <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9] text-white" 
                           style={{ 
                             textShadow: `0 0 30px ${colors.primary}40`
                           }}>
                         {info.artist.name}
                       </h2>
                       <div className="flex justify-center sm:justify-start gap-4">
                          {info.artist?.stats?.listeners && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                             <Users size={12} />
                             <span>{parseInt(info.artist.stats.listeners).toLocaleString()} Listeners</span>
                          </div>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                       <Info size={12} style={{ color: colors.primary }} />
                       Biography
                       <div className="flex-1 h-px bg-white/5" />
                     </h3>
                     {info.artist?.bio?.summary && (
                     <p 
                       className="text-base md:text-lg lg:text-xl leading-relaxed font-medium text-gray-300 max-h-[300px] overflow-y-auto custom-scrollbar pr-4 text-justify mix-blend-plus-lighter"
                     >
                       {info.artist.bio.summary.replace(/<[^>]*>/g, '')}
                     </p>
                     )}
                  </div>

                  {info.artist.tags?.tag && (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                       {info.artist.tags.tag.slice(0, 5).map((tag: any) => (
                         <span key={tag.name} 
                               className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-default">
                            <Tag size={10} />
                            {tag.name}
                         </span>
                       ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-gray-500 font-black uppercase tracking-widest text-xs">
                  Artist profile unavailable.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

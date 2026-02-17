
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import { Info, X, Users, Tag } from "lucide-react";

export const ArtistInfo: React.FC = () => {
  const { songs, currentSongIndex, colors, isCommandPaletteOpen } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    if (!isOpen || !currentSong) return;

    const fetchInfo = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/artist/info?artist=${encodeURIComponent(currentSong.artist || "")}`);
        const data = await res.json();
        setInfo(data);
      } catch (e) {
        console.error("Info fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCommandPaletteOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSong, isCommandPaletteOpen]);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        title="Artist Info"
        className="p-4 lg:p-5 rounded-full shadow-lg transition-all text-gray-400 bg-white/5 dark:bg-white/5 hover:text-blue-500 hover:bg-blue-500/10"
      >
        <Info size={20} className="lg:w-6 lg:h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="artist-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/5"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-12 h-12 border-4 border-gray-200 dark:border-white/10 border-t-blue-500 rounded-full"
                  />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">Retrieving Biography...</p>
                </div>
              ) : info?.artist ? (
                <div className="space-y-10">
                  <div className="flex items-end gap-8 relative z-10">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] overflow-hidden shadow-2xl flex-shrink-0 border-2 border-white/10 rotate-3 transition-transform hover:rotate-0 duration-500">
                       <img src={currentSong?.cover} alt={info.artist.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-3 leading-[0.9]" 
                           style={{ 
                             color: "white",
                             textShadow: `0 0 30px ${colors.primary}60`
                           }}>
                         {info.artist.name}
                       </h2>
                       <div className="flex gap-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                             <Users size={14} />
                             <span>{parseInt(info.artist.stats.listeners).toLocaleString()} Listeners</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                       <Info size={12} style={{ color: colors.primary }} />
                       Biography
                       <div className="flex-1 h-px bg-white/5" />
                     </h3>
                     <div 
                       className="text-lg md:text-xl leading-relaxed font-medium text-gray-300 max-h-[300px] overflow-y-auto custom-scrollbar pr-4 text-justify mix-blend-plus-lighter"
                       dangerouslySetInnerHTML={{ __html: info.artist.bio.summary }}
                     />
                  </div>

                  {info.artist.tags?.tag && (
                    <div className="flex flex-wrap gap-2 pt-2">
                       {info.artist.tags.tag.slice(0, 5).map((tag: any) => (
                         <span key={tag.name} 
                               className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-default">
                            <Tag size={10} />
                            {tag.name}
                         </span>
                       ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-500 font-black uppercase tracking-widest text-sm">
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

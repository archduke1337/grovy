"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import { X, Plus, Music, Check } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export const AddToPlaylistModal: React.FC = () => {
  const { 
    isPlaylistModalOpen, 
    closePlaylistModal, 
    playlists, 
    createPlaylist, 
    addToPlaylist, 
    playlistModalSong,
    colors 
  } = usePlayer();

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isPlaylistModalOpen || !playlistModalSong) return null;

  const handleCreate = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName);
    setNewPlaylistName("");
    setIsCreating(false);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addToPlaylist(playlistId, playlistModalSong);
    closePlaylistModal();
  };

  const primaryColorStyle = { '--color-primary': colors.primary } as React.CSSProperties;

  return (
    <AnimatePresence>
      {isPlaylistModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistModal}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="w-full h-full sm:h-auto sm:max-w-md bg-white dark:bg-zinc-950 sm:rounded-[2rem] overflow-hidden shadow-2xl relative z-10 border-0 sm:border border-gray-100 dark:border-white/10 flex flex-col sm:block"
          >
            <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add to Playlist</h2>
                <button 
                  onClick={closePlaylistModal}
                  className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors bg-gray-50 dark:bg-white/5"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-transparent dark:border-white/5">
                 <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 dark:bg-zinc-800 shrink-0 shadow-sm">
                    {playlistModalSong.cover ? (
                      <Image 
                        src={getHDThumbnail(playlistModalSong.cover) || ""} 
                        alt={playlistModalSong.title} 
                        width={60}
                        height={60}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-gray-400" /></div>
                    )}
                 </div>
                 <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">{playlistModalSong.title}</h3>
                    <p className="text-xs text-gray-500 font-medium truncate">{playlistModalSong.artist}</p>
                 </div>
              </div>

              <div className="space-y-3 pb-6 sm:pb-0">
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group"
                  style={primaryColorStyle}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="font-bold text-gray-600 dark:text-gray-300 group-hover:text-[var(--color-primary)]">New Playlist</span>
                </button>

                <AnimatePresence>
                  {isCreating && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Playlist Name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-[var(--color-primary)] outline-none transition-all font-medium text-sm"
                        style={primaryColorStyle}
                        autoFocus
                      />
                      <button
                        onClick={handleCreate}
                        disabled={!newPlaylistName.trim()}
                        className="px-6 rounded-xl text-white disabled:opacity-50 font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform"
                        style={{ 
                          backgroundColor: colors.primary 
                        }}
                      >
                        Create
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1 mt-4">
                  {playlists.map((playlist) => {
                    const alreadyIn = playlist.songs.some(s => s.id === playlistModalSong.id);
                    return (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        disabled={alreadyIn}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center shrink-0 shadow-sm border border-transparent dark:border-white/5">
                             {playlist.songs.length > 0 && playlist.songs[0].cover ? (
                               <Image 
                                 src={getHDThumbnail(playlist.songs[0].cover) || ""} 
                                 alt={playlist.name} 
                                 width={44}
                                 height={44}
                                 className="w-full h-full object-cover rounded-xl" 
                               />
                             ) : (
                               <Music size={18} className="text-gray-400" />
                             )}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">{playlist.name}</h4>
                            <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">{playlist.songs.length} tracks</p>
                          </div>
                        </div>
                        {alreadyIn && (
                          <div className="p-1 px-2 rounded-full bg-green-500/10 text-green-500 flex items-center gap-1">
                             <Check size={14} strokeWidth={3} />
                             <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Added</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

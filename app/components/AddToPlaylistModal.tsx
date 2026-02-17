"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/app/context/PlayerContext";
import { X, Plus, Music, Check } from "lucide-react";

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

  return (
    <AnimatePresence>
      {isPlaylistModalOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center px-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-gray-100 dark:border-white/10"
          >
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Add to Playlist</h2>
                <button 
                  onClick={closePlaylistModal}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                    {playlistModalSong.cover ? (
                      <img src={playlistModalSong.cover} alt={playlistModalSong.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-gray-400" /></div>
                    )}
                 </div>
                 <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{playlistModalSong.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{playlistModalSong.artist}</p>
                 </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group"
                  style={{ 
                    // @ts-ignore
                    '--color-primary': colors.primary 
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="font-bold text-gray-600 dark:text-gray-300 group-hover:text-[var(--color-primary)]">New Playlist</span>
                </button>

                {isCreating && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Playlist Name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-[var(--color-primary)] outline-none transition-all font-medium text-sm"
                      style={{ 
                        // @ts-ignore
                        '--color-primary': colors.primary 
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleCreate}
                      disabled={!newPlaylistName.trim()}
                      className="px-4 rounded-xl bg-[var(--color-primary)] text-white disabled:opacity-50 font-bold text-sm"
                      style={{ 
                        backgroundColor: colors.primary 
                      }}
                    >
                      Create
                    </button>
                  </motion.div>
                )}

                {playlists.map((playlist) => {
                  const alreadyIn = playlist.songs.some(s => s.id === playlistModalSong.id);
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      disabled={alreadyIn}
                      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shrink-0">
                           {playlist.songs.length > 0 && playlist.songs[0].cover ? (
                             <img src={playlist.songs[0].cover} alt={playlist.name} className="w-full h-full object-cover rounded-lg" />
                           ) : (
                             <Music size={16} className="text-gray-400" />
                           )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">{playlist.name}</h4>
                          <p className="text-xs text-gray-500 font-medium">{playlist.songs.length} songs</p>
                        </div>
                      </div>
                      {alreadyIn && <Check size={16} className="text-green-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Music, Plus, PlayCircle, Folder } from "lucide-react";

export default function PlaylistsPage() {
  const { playlists, colors, createPlaylist } = usePlayer();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist(newName);
    setNewName("");
    setIsCreating(false);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-32 pb-40 space-y-10">
      <header className="flex flex-col md:flex-row items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.3em]" style={{ color: colors.primary }}>
             <Folder size={14} />
             <span>Your Library</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
             Playlists<span style={{ color: colors.primary }}>.</span>
           </h1>
        </div>
      </header>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {/* Create New Card */}
        <motion.div
          onClick={() => setIsCreating(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsCreating(true);
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="aspect-square rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 flex flex-col items-center justify-center gap-4 group transition-all w-full h-full"
          style={{  
            // @ts-ignore
            '--color-primary': colors.primary 
          }}
        >
          {isCreating ? (
            <div className="w-full px-6 space-y-3" onClick={(e) => e.stopPropagation()}>
               <input
                 autoFocus
                 type="text"
                 placeholder="Name..."
                 value={newName}
                 onChange={(e) => setNewName(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setIsCreating(false);
                 }}
                 className="w-full text-center bg-transparent border-b border-gray-300 dark:border-white/20 focus:border-[var(--color-primary)] outline-none py-2 font-bold text-lg"
               />
               <div className="flex gap-2 justify-center">
                 <button onClick={handleCreate} className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">Create</button>
                 <button onClick={() => setIsCreating(false)} className="text-xs font-black uppercase tracking-wider text-gray-400">Cancel</button>
               </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-[var(--color-primary)] group-hover:text-white flex items-center justify-center transition-colors">
                <Plus size={32} />
              </div>
              <span className="font-bold text-gray-400 group-hover:text-[var(--color-primary)] transition-colors">Create Playlist</span>
            </>
          )}
        </motion.div>

        {/* Existing Playlists */}
        {playlists.map((playlist) => (
          <Link href={`/playlists/${playlist.id}`} key={playlist.id}>
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group aspect-square relative rounded-[2rem] overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800 w-full h-full"
            >
              {playlist.songs.length > 0 && playlist.songs[0].cover ? (
                <img src={playlist.songs[0].cover} alt={playlist.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <Music size={48} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                 <h3 className="text-xl font-bold text-white tracking-tight truncate">{playlist.name}</h3>
                 <p className="text-xs font-medium text-white/60 uppercase tracking-wider">{playlist.songs.length} Tracks</p>
                 
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={48} className="text-white fill-white/20 backdrop-blur-md rounded-full" />
                 </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

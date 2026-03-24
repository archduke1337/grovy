"use client";

import React, { useState, useRef } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Music, Plus, PlayCircle, Folder, Download, Upload, Trash2, X } from "lucide-react";
import Image from "next/image";

export default function PlaylistsPage() {
  const { playlists, colors, createPlaylist } = usePlayer();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist(newName);
    setNewName("");
    setIsCreating(false);
  };

  const handleExportAll = () => {
    const data = JSON.stringify({ version: 1, playlists, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grovy-playlists-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const imported = parsed.playlists || (Array.isArray(parsed) ? parsed : []);
        if (!Array.isArray(imported) || imported.length === 0) {
          alert("No playlists found in file.");
          return;
        }
        let count = 0;
        for (const pl of imported) {
          if (pl.name && Array.isArray(pl.songs)) {
            createPlaylist(pl.name, pl.songs);
            count++;
          }
        }
        if (count > 0) alert(`Imported ${count} playlist(s).`);
      } catch (err) {
        alert("Failed to parse playlist file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-40 space-y-12 sm:space-y-16"
    >
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-4 sm:pt-8">
        <div className="space-y-4">
           <div className="flex items-center gap-3 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] text-blue-500">
             <Folder size={16} />
             <span>Your Library</span>
           </div>
           <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-gray-900 dark:text-white tracking-[-0.04em] leading-none">
             Playlists<span className="text-blue-500/20">.</span>
           </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            disabled={playlists.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/40 font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all disabled:opacity-20 active:scale-95"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/40 font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all active:scale-95"
          >
            <Upload size={16} />
            <span>Import</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </header>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
        {/* Create New Card */}
        <motion.div
          onClick={() => !isCreating && setIsCreating(true)}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="aspect-square rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/[0.06] hover:border-blue-500/50 dark:hover:border-blue-500/30 flex flex-col items-center justify-center gap-4 group transition-all cursor-pointer relative overflow-hidden bg-gray-50 dark:bg-white/[0.01]"
        >
          {isCreating ? (
            <div className="w-full px-6 space-y-4 text-center z-10" onClick={(e) => e.stopPropagation()}>
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">New Playlist</p>
                 <input
                   autoFocus
                   type="text"
                   placeholder="My Mix..."
                   value={newName}
                   onChange={(e) => setNewName(e.target.value)}
                   onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") setIsCreating(false);
                   }}
                   className="w-full text-center bg-transparent border-none outline-none font-black text-xl sm:text-2xl text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/10"
                 />
               </div>
               <div className="flex gap-2 justify-center">
                 <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">Create</button>
                 <button onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/40 text-[11px] font-black uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Cancel</button>
               </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-blue-500 group-hover:shadow-2xl group-hover:shadow-blue-500/40">
                <Plus size={32} className="text-blue-500 group-hover:text-white transition-colors" />
              </div>
              <span className="font-black text-[13px] sm:text-[14px] text-gray-400 dark:text-white/20 uppercase tracking-widest">New Playlist</span>
            </>
          )}
        </motion.div>

        {/* Existing Playlists */}
        <AnimatePresence>
          {playlists.map((playlist) => (
            <Link href={`/playlists/${playlist.id}`} key={playlist.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, y: -8 }}
                whileTap={{ scale: 0.98 }}
                className="group aspect-square relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl bg-gray-100 dark:bg-white/[0.03]"
              >
                {playlist.songs.length > 0 && playlist.songs[0].cover ? (
                  <Image src={playlist.songs[0].cover} alt={playlist.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" sizes="(max-width: 640px) 50vw, 25vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/[0.02] dark:to-white/[0.05]">
                    <Music size={48} className="text-gray-300 dark:text-white/10" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
                   <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate leading-tight">{playlist.name}</h3>
                   <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">{playlist.songs.length} Tracks</p>
                   
                   <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                      <div className="w-14 h-14 rounded-full bg-white/95 dark:bg-white/10 backdrop-blur-2xl flex items-center justify-center shadow-2xl">
                        <PlayCircle size={32} className="text-black dark:text-white" />
                      </div>
                   </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Music, Plus, PlayCircle, Folder, Download, Upload } from "lucide-react";
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
        // Add imported playlists with new IDs to avoid collision
        let count = 0;
        for (const pl of imported) {
          if (pl.name && Array.isArray(pl.songs)) {
            createPlaylist(pl.name, pl.songs);
            count++;
          }
        }
        if (count > 0) {
          alert(`Imported ${count} playlist(s).`);
        }
      } catch (err) {
        alert("Failed to parse playlist file.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = "";
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 pb-32 sm:pb-40 space-y-8 sm:space-y-10">
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-3 sm:space-y-4">
           <div className="flex items-center gap-2 font-bold uppercase text-[10px] sm:text-[11px] tracking-[0.2em] text-gray-400 dark:text-white/20">
             <Folder size={14} />
             <span>Your Library</span>
           </div>
           <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-[-0.03em]">
             Playlists<span className="text-gray-200 dark:text-white/10">.</span>
           </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            disabled={playlists.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export all playlists"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
            title="Import playlists"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </header>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
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
          className="aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/[0.06] hover:border-gray-400 dark:hover:border-white/15 flex flex-col items-center justify-center gap-3 sm:gap-4 group transition-all w-full h-full cursor-pointer"
        >
          {isCreating ? (
            <div className="w-full px-4 sm:px-6 space-y-2 sm:space-y-3" onClick={(e) => e.stopPropagation()}>
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
                 className="w-full text-center bg-transparent border-b border-gray-300 dark:border-white/15 focus:border-gray-500 dark:focus:border-white/30 outline-none py-2 font-bold text-base sm:text-lg text-gray-900 dark:text-white"
               />
               <div className="flex gap-3 justify-center">
                 <button onClick={handleCreate} className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-500 hover:text-blue-600 transition-colors">Create</button>
                 <button onClick={() => setIsCreating(false)} className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-500 transition-colors">Cancel</button>
               </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-white/[0.04] group-hover:bg-gray-200 dark:group-hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                <Plus size={24} className="text-gray-400 dark:text-white/25 sm:w-7 sm:h-7" />
              </div>
              <span className="font-semibold text-[13px] sm:text-[14px] text-gray-400 dark:text-white/25 group-hover:text-gray-600 dark:group-hover:text-white/40 transition-colors">Create Playlist</span>
            </>
          )}
        </motion.div>

        {/* Existing Playlists */}
        {playlists.map((playlist) => (
          <Link href={`/playlists/${playlist.id}`} key={playlist.id}>
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800 w-full h-full"
            >
              {playlist.songs.length > 0 && playlist.songs[0].cover ? (
                <Image src={playlist.songs[0].cover} alt={playlist.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 50vw, 25vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <Music size={36} className="text-gray-300 dark:text-gray-600 sm:w-12 sm:h-12" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
                 <h3 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">{playlist.name}</h3>
                 <p className="text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider">{playlist.songs.length} Tracks</p>
                 
                 <div className="absolute top-3 sm:top-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={36} className="text-white fill-white/20 backdrop-blur-md rounded-full sm:w-12 sm:h-12" />
                 </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

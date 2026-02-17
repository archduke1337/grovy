"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Music, X, Home, Info, Play, Github, Loader2 } from "lucide-react";
import { usePlayer } from "@/app/context/PlayerContext";
import { useRouter } from "next/navigation";
import { Song } from "../types/song";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const { 
    songs: localSongs, 
    setCommandPaletteOpen, 
    isCommandPaletteOpen: isOpen, 
    setQueue, 
    loadSongs 
  } = usePlayer();
  const [query, setQuery] = useState("");
  const [apiResults, setApiResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    const results: CommandItem[] = [];
    
    // 1. Navigation Actions
    const navigation = [
      { id: "nav-home", title: "Go to Home", icon: <Home size={18} />, action: () => router.push("/") },
      { id: "nav-github", title: "View Source code", icon: <Github size={18} />, action: () => window.open("https://github.com/archduke1337/grovy", "_blank") },
      { id: "nav-about", title: "Open Source Credits", icon: <Info size={18} />, action: () => window.open("https://github.com/archduke1337/grovy/blob/main/README.md", "_blank") },
    ];

    navigation.forEach(item => {
      if (item.title.toLowerCase().includes(q)) results.push({ ...item, type: "Navigation" });
    });

    // 2. Global API Results
    apiResults.forEach((song) => {
      results.push({
        id: `api-song-${song.id}`,
        title: song.title,
        subtitle: song.artist,
        icon: <Play size={18} />,
        type: "Global Search",
        action: () => {
          setQueue([song, ...localSongs], 0);
          setCommandPaletteOpen(false);
        }
      });
    });

    // 3. Local Song Filter (if no API results or specific match)
    if (results.length < 5) {
      localSongs.forEach((song, idx) => {
        if (song.title.toLowerCase().includes(q) || song.artist?.toLowerCase().includes(q)) {
          if (!apiResults.find(as => as.id === song.id)) {
            results.push({
              id: `local-song-${song.id}`,
              title: song.title,
              subtitle: song.artist,
              icon: <Music size={18} />,
              type: "In Library",
              action: () => {
                setQueue(localSongs, idx);
                setCommandPaletteOpen(false);
              }
            });
          }
        }
      });
    }

    return results;
  }, [query, localSongs, apiResults, router, setCommandPaletteOpen, setQueue]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isOpen);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
      
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setCommandPaletteOpen, filteredItems, selectedIndex]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global API Search
  useEffect(() => {
    if (query.trim().length === 0) {
      setApiResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      const results = await loadSongs(query);
      setApiResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(handler);
  }, [query, loadSongs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl z-[101] px-4"
          >
            <div className="glass-effect dark:glass-effect-dark rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10">
              <div className="relative flex items-center p-6 border-b border-gray-100 dark:border-white/10">
                {isSearching ? (
                  <Loader2 className="text-blue-500 mr-4 animate-spin" size={22} />
                ) : (
                  <Search className="text-gray-400 mr-4" size={22} />
                )}
                <input
                  autoFocus
                  type="text"
                  placeholder="Search millions of tracks globally..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-xl text-gray-900 dark:text-white placeholder-gray-400"
                />
                <div className="flex items-center gap-2">
                   <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-[10px] font-bold text-gray-500 uppercase">Esc</kbd>
                   <button onClick={() => setCommandPaletteOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                     <X size={20} />
                   </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar pb-6">
                {filteredItems.length > 0 ? (
                  <div className="p-2">
                    {filteredItems.map((item, i) => (
                      <button
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(i)}
                        onClick={() => {
                          item.action();
                          setCommandPaletteOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${
                          selectedIndex === i ? "bg-gray-100 dark:bg-white/10" : ""
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-all">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
                          {item.subtitle && <div className="text-xs text-gray-400 font-medium">{item.subtitle}</div>}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 dark:text-gray-600">
                          {item.type}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-400">
                    {query ? "No results found." : "Start typing to search..."}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 ">
                       <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded text-[10px] text-gray-500">↑↓</kbd>
                       <span className="text-[10px] text-gray-400 uppercase font-bold">Navigate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded text-[10px] text-gray-500">Enter</kbd>
                       <span className="text-[10px] text-gray-400 uppercase font-bold">Select</span>
                    </div>
                 </div>
                 <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Grovy Command Center</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

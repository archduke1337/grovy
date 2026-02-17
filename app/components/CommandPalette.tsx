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
      { id: "nav-home", title: "Go to Home", icon: <Home size={18} />, action: () => { router.push("/"); setCommandPaletteOpen(false); } },
      { id: "nav-github", title: "View Source code", icon: <Github size={18} />, action: () => { window.open("https://github.com/archduke1337/grovy", "_blank"); setCommandPaletteOpen(false); } },
      { id: "nav-opensource", title: "Open Source Credits", icon: <Info size={18} />, action: () => { router.push("/opensource"); setCommandPaletteOpen(false); } },
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

    // 3. Local Song Filter
    if (results.length < 10) {
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

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, setCommandPaletteOpen, filteredItems, selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setApiResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await loadSongs(query);
        setApiResults(results || []);
      } catch (e) {
        setApiResults([]);
      } finally {
        setIsSearching(false);
      }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[150]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[10%] sm:top-[20%] -translate-x-1/2 w-full max-w-2xl z-[151] px-4"
          >
            <div className="glass-effect dark:glass-effect-dark rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 dark:border-white/10">
              <div className="relative flex items-center p-5 sm:p-6 border-b border-gray-100 dark:border-white/10">
                {isSearching ? (
                  <Loader2 className="text-blue-500 mr-4 animate-spin shrink-0" size={20} />
                ) : (
                  <Search className="text-gray-400 mr-4 shrink-0" size={20} />
                )}
                <input
                  autoFocus
                  type="text"
                  placeholder="Search groovymusic globally..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-lg sm:text-xl text-gray-900 dark:text-white placeholder-gray-400"
                />
                <button onClick={() => setCommandPaletteOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white sm:hidden">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[350px] sm:max-h-[450px] overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, i) => (
                    <button
                      key={item.id}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all text-left group ${
                        selectedIndex === i ? "bg-gray-100 dark:bg-white/10" : ""
                      }`}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                        selectedIndex === i 
                          ? "bg-blue-500 text-white shadow-lg" 
                          : "bg-gray-100 dark:bg-white/5 text-gray-400"
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate text-[13px] sm:text-sm ${selectedIndex === i ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/70'}`}>
                          {item.title}
                        </div>
                        {item.subtitle && <div className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{item.subtitle}</div>}
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400/50 hidden sm:block">
                        {item.type}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-20 text-center text-gray-400 space-y-2">
                    <Search size={32} className="mx-auto opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                      {query ? "No results found" : "Start typing to search..."}
                    </p>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex p-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <kbd className="px-1.5 py-0.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded flex items-center justify-center">↑↓</kbd>
                       <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <kbd className="px-1.5 py-0.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded flex items-center justify-center">Enter</kbd>
                       <span>Select</span>
                    </div>
                 </div>
                 <div className="opacity-40">Grovy v1.0</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Info, Mail, Music, Moon, Sun, Menu, X, Search, Github, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

import { usePlayer } from "@/app/context/PlayerContext";
import { AddToPlaylistModal } from "./AddToPlaylistModal";


const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Playlists", path: "/playlists", icon: Music },
  { name: "About", path: "https://archduke.is-a.dev/about", icon: Info },
  { name: "Contact", path: "https://archduke.is-a.dev/contact", icon: Mail },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { 
    setCommandPaletteOpen, 
    colors, 
    isPlaying, 
    songs, 
    currentSongIndex 
  } = usePlayer();
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Default to dark mode if no preference is saved, or conform to system if preferred
    const savedTheme = localStorage.getItem("theme");
    const dark = savedTheme ? savedTheme === "dark" : true; 
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const html = document.documentElement;
    if (next) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] px-4 py-2 md:py-4 pointer-events-none">
      <nav 
        style={{ 
          borderColor: scrolled ? `${colors.primary}40` : "transparent",
          boxShadow: scrolled ? `0 20px 40px -15px ${colors.primary}20` : "none"
        }}
        className={`
          mx-auto max-w-6xl pointer-events-auto transition-all duration-700 ease-out border
          ${scrolled 
            ? "rounded-full px-6 py-2.5 backdrop-blur-3xl bg-white/60 dark:bg-black/60 shadow-lg" 
            : "rounded-[2.5rem] px-8 py-5 bg-transparent"}
        `}
      >
        <div className="flex items-center justify-between">
          {/* Logo & Now Playing Chip */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="relative"
              >
                <Music 
                  size={24} 
                  className="md:w-8 md:h-8 text-black dark:text-white"
                  strokeWidth={2.5}
                />
              </motion.div>
              <span 
                className="text-xl md:text-2xl font-black tracking-tighter hidden md:block text-black dark:text-white"
              >
                Grovy
              </span>
            </Link>

            {isPlaying && currentSong && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
              >
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                      className="w-1 rounded-full bg-black dark:bg-white"
                    />
                  ))}
                </div>
                <span 
                  className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px] text-black dark:text-white"
                >
                  {currentSong.title}
                </span>
              </motion.div>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center p-1 bg-gray-100/50 dark:bg-white/5 rounded-full backdrop-blur-md">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`relative px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${
                      isActive
                        ? "text-black dark:text-white"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            <div className="flex items-center gap-1.5 px-2 border-l border-gray-200 dark:border-white/10 ml-2">

              <button
                onClick={toggleTheme}
                className="p-3 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all group text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                aria-label="Toggle theme"
              >
                {mounted && (isDark ? <Sun size={18} className="group-hover:rotate-45 transition-transform" /> : <Moon size={18} className="group-hover:-rotate-12 transition-transform" />)}
              </button>
              <Link
                href="https://github.com/archduke/grovy"
                target="_blank"
                className="p-3 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all flex items-center justify-center group text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              >
                <Github size={18} className="group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1 md:hidden">

            <button
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className={`p-2.5 rounded-full transition-all text-black dark:text-white ${!isMobileMenuOpen ? "hover:bg-gray-100 dark:hover:bg-white/10" : "bg-black/5 dark:bg-white/10"}`}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Fullscreen Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-3xl md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full px-8 py-20 gap-12">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Music 
                       size={32} 
                       strokeWidth={2.5}
                       style={{ color: colors.primary, filter: `drop-shadow(0 0 8px ${colors.primary}40)` }} 
                     />
                     <span className="text-2xl font-black dark:text-white">Grovy</span>
                   </div>
                   <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-gray-100 dark:bg-white/10 rounded-full dark:text-white">
                      <X size={24} />
                   </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Navigation</h3>
                  {navItems.map((item, i) => (
                    <motion.div
                       key={item.name}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        href={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{ 
                          backgroundColor: pathname === item.path ? colors.primary : undefined,
                          color: pathname === item.path ? "white" : undefined
                        }}
                        className={`flex items-center justify-between group p-6 rounded-[2rem] transition-all ${
                          pathname !== item.path 
                            ? "bg-gray-50 dark:bg-white/5 dark:text-white" 
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                           <item.icon size={22} />
                           <span className="text-xl font-black">{item.name}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center opacity-20">
                          <ChevronRight size={16} />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={toggleTheme}
                      className="p-6 rounded-[2rem] bg-gray-50 dark:bg-white/5 flex flex-col items-center gap-3 transition-all active:scale-95 text-gray-600 dark:text-white"
                    >
                       {isDark ? <Sun className="text-orange-400" /> : <Moon style={{ color: colors.primary }} />}
                       <span className="text-[10px] font-black uppercase tracking-widest">{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                    <button 
                      onClick={() => { setCommandPaletteOpen(true); setIsMobileMenuOpen(false); }}
                      className="p-6 rounded-[2rem] bg-gray-50 dark:bg-white/5 flex flex-col items-center gap-3 active:scale-95"
                    >
                       <Search className="text-gray-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">Search</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-8 py-8 border-t border-gray-100 dark:border-white/5">
                     <Link href="https://github.com/archduke/grovy" className="text-gray-400"><Github /></Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <AddToPlaylistModal />
    </div>
  );
};

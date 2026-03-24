"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Moon, Sun, Menu, X, Github, Code, Library } from "lucide-react";
import { useState, useEffect } from "react";

import { usePlayer } from "@/app/context/PlayerContext";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Library", path: "/playlists", icon: Library },
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
  const [isDark, setIsDark] = useState(true); // default dark, hydrate from localStorage in useEffect
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hydrate theme from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const prefersDark = saved ? saved === "dark" : true;
    setIsDark(prefersDark);
    if (prefersDark) {
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
    <div className="fixed top-0 left-0 right-0 z-[60] px-3 sm:px-4 py-2 md:py-3 pointer-events-none">
      <nav 
        className={`
          mx-auto max-w-5xl pointer-events-auto transition-all duration-500 ease-out
          ${scrolled 
            ? "rounded-2xl px-4 sm:px-5 py-2.5 backdrop-blur-2xl bg-white/70 dark:bg-white/[0.06] shadow-lg shadow-black/[0.04] dark:shadow-black/20 border border-black/[0.04] dark:border-white/[0.08]" 
            : "rounded-2xl px-4 sm:px-6 py-3 sm:py-4 bg-transparent"}
        `}
      >
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="relative w-8 h-8 sm:w-9 sm:h-9"
              >
                <Image 
                  src="/icons/logo.png" 
                  alt="Grovy" 
                  width={36} 
                  height={36} 
                  className="w-full h-full object-contain drop-shadow-sm"
                  priority
                />
              </motion.div>
              {/* Pixel font brand name */}
              <span 
                className="text-base sm:text-lg font-bold tracking-tight text-black dark:text-white"
                style={{ fontFamily: "'Silkscreen', cursive" }}
              >
                Grovy
              </span>
            </Link>

            {/* Now Playing Chip */}
            {isPlaying && currentSong && (
              <motion.div 
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]"
              >
                <div className="flex gap-0.5 items-end h-3">
                  {[...Array(3)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [3, 10, 3] }}
                      transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                      className="w-[3px] rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold truncate max-w-[120px] text-black/70 dark:text-white/60">
                  {currentSong.title}
                </span>
              </motion.div>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-0.5 p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`relative px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-300 ${
                      isActive
                        ? "text-black dark:text-white"
                        : "text-black/40 dark:text-white/35 hover:text-black/70 dark:hover:text-white/60"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white dark:bg-white/[0.08] shadow-sm rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all group text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
                aria-label="Toggle theme"
                suppressHydrationWarning
              >
                {isDark ? <Sun size={16} className="group-hover:rotate-45 transition-transform" /> : <Moon size={16} className="group-hover:-rotate-12 transition-transform" />}
              </button>
              <Link
                href="https://github.com/archduke1337/grovy"
                target="_blank"
                className="p-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all group text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
              >
                <Github size={16} className="group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all group text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
                aria-label="Toggle theme"
                suppressHydrationWarning
              >
                {isDark ? <Sun size={16} className="group-hover:rotate-45 transition-transform" /> : <Moon size={16} className="group-hover:-rotate-12 transition-transform" />}
              </button>
              <Link
                href="https://github.com/archduke1337/grovy"
                target="_blank"
                className="p-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all group text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
              >
                <Github size={16} className="group-hover:scale-110 transition-transform" />
              </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
              suppressHydrationWarning
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className={`p-2 rounded-xl transition-all text-black dark:text-white ${!isMobileMenuOpen ? "hover:bg-black/5 dark:hover:bg-white/5" : "bg-black/5 dark:bg-white/10"}`}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-4 pb-2 space-y-1 border-t border-black/5 dark:border-white/5 mt-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[14px] font-semibold ${
                      pathname === item.path 
                        ? "bg-black/5 dark:bg-white/[0.08] text-black dark:text-white" 
                        : "text-black/50 dark:text-white/40 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="https://github.com/archduke1337/grovy"
                  target="_blank"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-black/50 dark:text-white/40 text-[14px] font-semibold"
                >
                  <Github size={18} />
                  GitHub
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <AddToPlaylistModal />
    </div>
  );
};

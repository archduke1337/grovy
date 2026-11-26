"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Moon, Sun, Menu, X, Github, Library } from "lucide-react";
import { useState, useEffect } from "react";
import { Button, Tooltip } from "@heroui/react";

import { usePlayer } from "@/app/context/PlayerContext";
import { useTheme } from "@/app/hooks/useTheme";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Library", path: "/playlists", icon: Library },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { setCommandPaletteOpen, colors, isPlaying, songs, currentSongIndex } = usePlayer();
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] px-3 sm:px-4 py-2 md:py-3">
      <nav
        className={`mx-auto max-w-5xl transition-all duration-500 ease-out rounded-2xl border ${
          scrolled
            ? "px-4 sm:px-5 py-2.5 backdrop-blur-2xl bg-white/70 dark:bg-white/[0.06] shadow-lg shadow-black/[0.04] dark:shadow-black/20 border-black/[0.04] dark:border-white/[0.08]"
            : "px-4 sm:px-6 py-3 sm:py-4 bg-transparent border-transparent"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Brand + now playing */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className="relative w-8 h-8 sm:w-9 sm:h-9">
                <Image
                  src="/icons/logo.png"
                  alt="Grovy"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain drop-shadow-sm"
                  priority
                />
              </motion.div>
              <span
                className="text-base sm:text-lg font-bold tracking-tight text-black dark:text-white"
                style={{ fontFamily: "'Silkscreen', cursive" }}
              >
                Grovy
              </span>
            </Link>

            {isPlaying && currentSong && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]"
              >
                <div className="flex gap-0.5 items-end h-3" aria-hidden="true">
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
                <span className="text-[11px] font-semibold truncate max-w-[130px] text-black/70 dark:text-white/60">
                  {currentSong.title}
                </span>
              </motion.div>
            )}
          </div>

          {/* Tablet nav */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-0.5 p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`relative px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
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
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <GitHubButton />
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-1">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <GitHubButton />
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-black dark:text-white"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-[14px] font-semibold ${
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
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-black/50 dark:text-white/40 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-[14px] font-semibold"
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

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          onPress={onToggle}
          className="text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{isDark ? "Light theme" : "Dark theme"}</Tooltip.Content>
    </Tooltip>
  );
}

function GitHubButton() {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="View source on GitHub"
          onPress={() => window.open("https://github.com/archduke1337/grovy", "_blank", "noopener")}
          className="text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
        >
          <Github size={16} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Source code</Tooltip.Content>
    </Tooltip>
  );
}

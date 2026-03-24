"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Home, 
  Music2, 
  Search, 
  Library, 
  Clock, 
  Heart, 
  Plus, 
  Music
} from "lucide-react";
import { usePlayer } from "@/app/context/PlayerContext";
import Image from "next/image";

const mainNav = [
  { name: "Home", path: "/", icon: Home },
  { name: "Browse", path: "/browse", icon: Music2 },
  { name: "Radio", path: "/radio", icon: Search }, // Using Search as placeholder for Radio icon
];

const libraryNav = [
  { name: "Recently Played", path: "/history", icon: Clock },
  { name: "Favorite Songs", path: "/favorites", icon: Heart },
  { name: "Albums", path: "/albums", icon: Library },
  { name: "Artists", path: "/artists", icon: Music },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { playlists, createPlaylist } = usePlayer();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-black/[0.05] dark:border-white/[0.05] bg-gray-50/50 dark:bg-black/20 backdrop-blur-xl z-40 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <Image src="/icons/logo.png" alt="Grovy" width={28} height={28} className="w-7 h-7" />
          <span className="text-xl font-bold tracking-tight dark:text-white" style={{ fontFamily: "'Silkscreen', cursive" }}>
            Grovy
          </span>
        </Link>

        <div className="space-y-8">
          {/* Main Nav */}
          <div className="space-y-1">
            {mainNav.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-black/[0.05] dark:bg-white/[0.1] text-pink-500 dark:text-pink-400" 
                      : "text-gray-600 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon size={18} className={isActive ? "text-pink-500 dark:text-pink-400" : ""} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Library Nav */}
          <div className="space-y-4">
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/20">
              Your Library
            </h3>
            <div className="space-y-1">
              {libraryNav.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-black/[0.05] dark:bg-white/[0.1] text-pink-500 dark:text-pink-400" 
                        : "text-gray-600 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon size={18} className={isActive ? "text-pink-500 dark:text-pink-400" : ""} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Playlists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/20">
                Playlists
              </h3>
              <button 
                onClick={() => createPlaylist("New Playlist")}
                className="p-1 rounded-md hover:bg-black/[0.05] dark:hover:bg-white/10 text-gray-400 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              <Link
                href="/playlists"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/playlists" 
                    ? "bg-black/[0.05] dark:bg-white/[0.1] text-pink-500 dark:text-pink-400" 
                    : "text-gray-600 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                </div>
                All Playlists
              </Link>
              {playlists.map((pl) => (
                <Link
                  key={pl.id}
                  href={`/playlists/${pl.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all truncate ${
                    pathname === `/playlists/${pl.id}` 
                      ? "bg-black/[0.05] dark:bg-white/[0.1] text-pink-500 dark:text-pink-400" 
                      : "text-gray-600 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  <Music size={16} className="shrink-0" />
                  <span className="truncate">{pl.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

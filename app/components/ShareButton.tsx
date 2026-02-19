"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Link2, Check, X } from "lucide-react";
import { Song } from "@/app/types/song";

interface ShareButtonProps {
  song: Song | undefined;
  className?: string;
  size?: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ song, className = "", size = 16 }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!song) return null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?play=${encodeURIComponent(song.id)}&title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist || "")}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      try {
        input.select();
        document.execCommand("copy");
      } finally {
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} - ${song.artist}`,
          text: `Listen to "${song.title}" by ${song.artist} on Grovy`,
          url: shareUrl,
        });
      } catch {}
    } else {
      setShowPopup(true);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleNativeShare}
        className={`p-2 sm:p-2.5 lg:p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 text-white/50 hover:text-white transition-all ${className}`}
        title="Share"
      >
        <Share2 size={size} className="sm:w-[18px] sm:h-[18px]" />
      </motion.button>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Share Song</h3>
                <button onClick={() => setShowPopup(false)} className="p-2 rounded-full hover:bg-white/10 text-white/40">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-white truncate">{song.title}</p>
                <p className="text-xs text-white/40">{song.artist}</p>
              </div>

              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs text-white/60 outline-none truncate px-2"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    copied
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {copied ? <Check size={14} /> : <Link2 size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

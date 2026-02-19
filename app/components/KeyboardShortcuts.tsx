"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Space"], description: "Play / Pause" },
  { keys: ["←"], description: "Seek backward 5s" },
  { keys: ["→"], description: "Seek forward 5s" },
  { keys: ["Ctrl", "←"], description: "Previous track" },
  { keys: ["Ctrl", "→"], description: "Next track" },
  { keys: ["↑"], description: "Volume up" },
  { keys: ["↓"], description: "Volume down" },
  { keys: ["M"], description: "Mute / Unmute" },
  { keys: ["L"], description: "Toggle loop" },
  { keys: ["Ctrl", "K"], description: "Command palette" },
  { keys: ["?"], description: "Keyboard shortcuts" },
  { keys: ["Esc"], description: "Close modal / panel" },
];

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      if ((e.target as HTMLElement).isContentEditable) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard size={20} className="text-blue-400" />
                <h2 className="text-xl font-black text-white tracking-tight">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              {SHORTCUTS.map(({ keys, description }) => (
                <div
                  key={description}
                  className="flex items-center justify-between py-2.5 px-1 border-b border-white/[0.04] last:border-0"
                >
                  <span className="text-sm text-white/60 font-medium">{description}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((key, i) => (
                      <React.Fragment key={key}>
                        {i > 0 && <span className="text-white/20 text-xs mx-0.5">+</span>}
                        <kbd className="px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-bold text-white/70 font-mono min-w-[28px] text-center">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-white/20 text-center font-medium uppercase tracking-widest pt-2">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 font-mono">?</kbd> to toggle
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

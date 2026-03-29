"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, X } from "lucide-react";
import Link from "next/link";

interface SignInPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const SignInPrompt: React.FC<SignInPromptProps> = ({
  isOpen,
  onClose,
  message = "Sign in to save your favorites, create playlists, and sync across devices.",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-24 lg:bottom-28 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 p-5 flex items-start gap-4 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
              <LogIn size={20} className="text-sky-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-2.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                {message}
              </p>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform"
                onClick={onClose}
              >
                <LogIn size={14} />
                Sign In
              </Link>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

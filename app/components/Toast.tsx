"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toast: (message: string, options?: { type?: ToastType; duration?: number; action?: { label: string; onClick: () => void } }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-green-400" />,
  error: <XCircle size={16} className="text-red-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
  info: <Info size={16} className="text-blue-400" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, options?: { type?: ToastType; duration?: number; action?: { label: string; onClick: () => void } }) => {
      const id = crypto.randomUUID();
      const duration = options?.duration ?? 4000;
      const newToast: Toast = {
        id,
        message,
        type: options?.type ?? "info",
        duration,
        action: options?.action,
      };
      setToasts((prev) => [...prev.slice(-4), newToast]); // max 5 toasts
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              layout
              className="pointer-events-auto w-full"
            >
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900/95 dark:bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl text-white">
                {ICONS[t.type]}
                <span className="flex-1 text-sm font-medium truncate">{t.message}</span>
                {t.action && (
                  <button
                    onClick={() => { t.action!.onClick(); removeToast(t.id); }}
                    className="text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
                >
                  <X size={14} className="text-white/40" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};


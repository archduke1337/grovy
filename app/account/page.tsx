"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  ListMusic,
  Clock,
  Shield,
  ShieldCheck,
  Mail,
  LogOut,
  User,
  ChevronRight,
  Music,
} from "lucide-react";

import { useAuth } from "@/app/hooks/useAuth";
import { usePlayer } from "@/app/context/PlayerContext";

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, user, authenticated, refresh } = useAuth();
  const { favorites, playlists, recentlyPlayed } = usePlayer();
  const [statusMessage, setStatusMessage] = useState(
    searchParams.get("welcome") === "1"
      ? "Welcome aboard — your account is ready to sync."
      : ""
  );
  const [working, setWorking] = useState(false);

  const firstName = useMemo(() => {
    if (!user?.name) return "there";
    const [name] = user.name.trim().split(/\s+/);
    return name || "there";
  }, [user]);

  const initials = useMemo(() => {
    if (!user?.name) return "?";
    const parts = user.name.trim().split(/\s+/);
    return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
  }, [user]);

  async function sendVerificationEmail() {
    if (!user || user.emailVerification) return;
    setWorking(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/auth/verify-email/send", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not send verification email");
      }
      setStatusMessage("Verification email sent — check your inbox.");
      await refresh();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Could not send verification email"
      );
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    setWorking(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      await refresh();
      router.push("/");
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  const totalSongsInPlaylists = useMemo(() => playlists.reduce((sum, pl) => sum + pl.songs.length, 0), [playlists]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-40">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-white/7 rounded-xl" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-white/5 rounded-lg" />
          <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!authenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-40"
      >
        <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl p-8 sm:p-12 space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <User size={36} className="text-gray-300 dark:text-white/15" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Your library is waiting.
            </h1>
            <p className="text-base text-gray-600 dark:text-white/55 max-w-md mx-auto">
              Sign in to keep your playlists, favorites, queue, and settings in sync across devices.
            </p>
          </div>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-bold hover:scale-105 active:scale-95 transition-transform"
          >
            Sign In
            <ChevronRight size={16} />
          </Link>
        </div>
      </motion.div>
    );
  }

  const stats = [
    {
      icon: Heart,
      label: "Favorites",
      value: favorites.length,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      href: "/favorites",
    },
    {
      icon: ListMusic,
      label: "Playlists",
      value: playlists.length,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/playlists",
    },
    {
      icon: Clock,
      label: "Recently Played",
      value: recentlyPlayed.length,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/history",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-10 sm:pt-16 pb-40 space-y-8"
    >
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-black/5 dark:border-white/8 bg-gradient-to-br from-white/80 via-white/60 to-gray-50/80 dark:from-white/[0.06] dark:via-white/[0.03] dark:to-white/[0.01] backdrop-blur-xl p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {initials}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 dark:text-white/25">
                Grovy Account
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Hey, {firstName}!
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/40">
                <Mail size={14} />
                <span className="truncate max-w-[200px] sm:max-w-none">{user.email}</span>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  user.emailVerification
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                }`}
              >
                {user.emailVerification ? (
                  <ShieldCheck size={12} />
                ) : (
                  <Shield size={12} />
                )}
                {user.emailVerification ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Verification Banner */}
      {!user.emailVerification && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.06] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Verify your email
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400/70">
              Secure your account with recovery options and smoother sign-ins.
            </p>
          </div>
          <button
            onClick={() => void sendVerificationEmail()}
            disabled={working}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-60 shrink-0"
          >
            {working ? "Sending..." : "Send Verification Email"}
          </button>
        </motion.div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-gray-700 dark:text-white/70 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl px-4 py-3"
        >
          {statusMessage}
        </motion.p>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3 sm:gap-4"
      >
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-black/5 dark:border-white/8 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
              {stat.value}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-white/25 uppercase tracking-wider mt-0.5">
              {stat.label}
            </p>
          </Link>
        ))}
      </motion.div>

      {/* Library Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-black/5 dark:border-white/8 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Music size={18} className="text-sky-500" />
          Library Summary
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-white/40 text-xs font-semibold uppercase tracking-wider">Playlists</p>
            <p className="text-gray-900 dark:text-white font-bold">
              {playlists.length} playlist{playlists.length !== 1 ? "s" : ""} with {totalSongsInPlaylists} total track{totalSongsInPlaylists !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-white/40 text-xs font-semibold uppercase tracking-wider">Favorites</p>
            <p className="text-gray-900 dark:text-white font-bold">
              {favorites.length} song{favorites.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <button
          onClick={() => void signOut()}
          disabled={working}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-3.5 text-sm font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-white/25">
          Switching accounts? Sign out here, then log in with a different email.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}

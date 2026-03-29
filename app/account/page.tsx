"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/hooks/useAuth";

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, user, authenticated, refresh } = useAuth();
  const [statusMessage, setStatusMessage] = useState(
    searchParams.get("welcome") === "1"
      ? "Welcome to Grovy. Your account is ready."
      : ""
  );
  const [working, setWorking] = useState(false);

  async function sendVerificationEmail() {
    if (!user || user.emailVerification) {
      return;
    }

    setWorking(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/auth/verify-email/send", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not send verification email");
      }
      setStatusMessage("Verification email sent.");
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

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-gray-600 dark:text-white/50">Loading account...</p>
      </div>
    );
  }

  if (!authenticated || !user) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Account
        </h1>
        <p className="text-sm text-gray-600 dark:text-white/50">
          Sign in to access synced playlists, favorites, and preferences.
        </p>
        <Link
          href="/auth/sign-in"
          className="inline-flex rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 text-sm font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 dark:text-white/25">
            Grovy Account
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {user.name || "Grovy Listener"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/50">{user.email}</p>
        </div>

        {!user.emailVerification ? (
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-4 py-3">
            <p className="text-sm text-gray-700 dark:text-white/70">
              Email status: Not verified
            </p>
          </div>
        ) : null}

        {statusMessage ? (
          <p className="text-sm text-gray-700 dark:text-white/70">{statusMessage}</p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!user.emailVerification ? (
            <button
              onClick={() => {
                void sendVerificationEmail();
              }}
              disabled={working}
              className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
            >
              Send Verification Email
            </button>
          ) : null}

          <button
            onClick={() => {
              void signOut();
            }}
            disabled={working}
            className="rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

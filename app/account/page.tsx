"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { useAuth } from "@/app/hooks/useAuth";

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, user, authenticated, refresh } = useAuth();
  const [statusMessage, setStatusMessage] = useState(
    searchParams.get("welcome") === "1"
      ? "Welcome aboard. Your account is ready to sync."
      : ""
  );
  const [working, setWorking] = useState(false);
  const firstName = useMemo(() => {
    if (!user?.name) return "there";
    const [name] = user.name.trim().split(/\s+/);
    return name || "there";
  }, [user]);

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
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-gray-600 dark:text-white/50">Loading your account...</p>
      </div>
    );
  }

  if (!authenticated || !user) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400 dark:text-white/25">
            Account
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Your library is waiting.
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-white/55 max-w-xl">
            Sign in to keep your playlists, favorites, queue, and settings in sync across devices.
          </p>
          <Link
            href="/auth/sign-in"
            className="inline-flex rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 text-sm font-semibold"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 dark:text-white/25">
            Grovy Account
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Good to see you, {firstName}.
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-white/55">
            This is your sync hub for the music you save and the way you listen.
          </p>
        </header>

        <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 sm:p-5 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-white/35">
              Signed in as
            </p>
            <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white/90 break-all">
              {user.email || "No email attached"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                user.emailVerification
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}
            >
              {user.emailVerification ? "Email Verified" : "Email Verification Pending"}
            </span>
          </div>
        </section>

        {!user.emailVerification ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Quick heads-up: verify your email to secure recovery options and smoother sign-ins.
            </p>
          </div>
        ) : null}

        {statusMessage ? (
          <p className="text-sm text-gray-700 dark:text-white/75">{statusMessage}</p>
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
              Send Verification Link
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

        <p className="text-xs sm:text-sm text-gray-500 dark:text-white/40">
          Switching accounts? Sign out here, then log in with a different email.
        </p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}

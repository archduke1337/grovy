"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { AuthShell } from "@/app/components/AuthShell";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const next = searchParams.get("next") || "/account";
    return next.startsWith("/") ? next : "/account";
  }, [searchParams]);

  const oauthFailed = searchParams.get("oauth") === "failed";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not sign in");
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not sign in";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to sync playlists, favorites, and playback across devices."
      footer={
        <span>
          New here?{" "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create account
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500/60"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            minLength={8}
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500/60"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link
            href="/auth/forgot-password"
            className="text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white"
          >
            Forgot password?
          </Link>
        </div>

        {oauthFailed ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            OAuth sign-in failed. Please try again.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold py-3 disabled:opacity-60"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href={`/api/auth/oauth/start?provider=google&next=${encodeURIComponent(nextPath)}`}
          className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-3 text-sm font-semibold text-center text-gray-800 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5"
        >
          Continue With Google
        </a>
        <a
          href={`/api/auth/oauth/start?provider=github&next=${encodeURIComponent(nextPath)}`}
          className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-3 text-sm font-semibold text-center text-gray-800 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5"
        >
          Continue With GitHub
        </a>
      </div>
    </AuthShell>
  );
}

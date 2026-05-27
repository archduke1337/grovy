"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

import { AuthShell } from "@/app/components/AuthShell";
import { sanitizeNextPath } from "@/app/lib/auth/redirect";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    return sanitizeNextPath(searchParams.get("next"));
  }, [searchParams]);

  const postSignUpPath = useMemo(() => {
    return nextPath.includes("?")
      ? `${nextPath}&welcome=1`
      : `${nextPath}?welcome=1`;
  }, [nextPath]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not create account");
      }

      router.push(postSignUpPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create account";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Set up your Grovy account for synced playback and library data."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="sign-up-name" className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
            Name
          </label>
          <input
            id="sign-up-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/60"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="sign-up-email" className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
            Email
          </label>
          <input
            id="sign-up-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/60"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="sign-up-password" className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
            Password
          </label>
          <input
            id="sign-up-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/60"
          />
          <p className="text-xs text-gray-500 dark:text-white/40">
            Use at least 8 characters.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="sign-up-confirm-password" className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
            Confirm Password
          </label>
          <input
            id="sign-up-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/60"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold py-3 disabled:opacity-60"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { AuthShell } from "@/app/components/AuthShell";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const secret = searchParams.get("secret") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasToken = useMemo(() => Boolean(userId && secret), [userId, secret]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasToken) {
      setError("Invalid or expired recovery link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/password-recovery/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not reset password");
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Choose New Password"
      subtitle="Set a new password for your Grovy account."
      footer={
        <span>
          Remembered it?{" "}
          <Link
            href="/auth/sign-in"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to sign in
          </Link>
        </span>
      }
    >
      {!hasToken ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          The recovery link is invalid or missing required parameters.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500/60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500/60"
            />
          </div>

          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Password updated successfully.
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
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

"use client";

import { FormEvent, useState } from "react";

import { AuthShell } from "@/app/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/password-recovery/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not send reset email");
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send reset email";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="We will send you a secure password reset link."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="forgot-password-email" className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-white/45">
            Email
          </label>
          <input
            id="forgot-password-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/60"
          />
        </div>

        {success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Password reset email sent. Check your inbox.
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
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
      </form>
    </AuthShell>
  );
}

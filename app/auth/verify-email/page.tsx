"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AuthShell } from "@/app/components/AuthShell";
import { useAuth } from "@/app/hooks/useAuth";

type VerificationState = "idle" | "verifying" | "verified" | "failed";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const { authenticated, user } = useAuth();
  const userId = searchParams.get("userId") || "";
  const secret = searchParams.get("secret") || "";
  const [state, setState] = useState<VerificationState>("idle");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const alreadyVerified = Boolean(authenticated && user?.emailVerification);

  const confirmVerification = useCallback(async () => {
    if (!userId || !secret) {
      return;
    }

    setState("verifying");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Verification failed");
      }

      setState("verified");
      setMessage("Your email is now verified.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Verification failed";
      setState("failed");
      setMessage(errorMessage);
    }
  }, [userId, secret]);

  useEffect(() => {
    if (userId && secret) {
      void confirmVerification();
    }
  }, [userId, secret, confirmVerification]);

  async function sendVerificationEmail() {
    if (alreadyVerified) {
      setState("verified");
      setMessage("Your email is already verified.");
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not send verification email");
      }

      setMessage("Verification email sent. Check your inbox.");
      if (state === "idle") setState("idle");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not send verification email";
      setState("failed");
      setMessage(errorMessage);
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthShell
      title="Verify Email"
      subtitle="Confirm your email address to fully secure your account."
    >
      <div className="space-y-4">
        {state === "verifying" ? (
          <p className="text-sm text-gray-700 dark:text-white/70">
            Verifying your email...
          </p>
        ) : null}

        {message ? (
          <p
            className={`text-sm ${
              state === "verified"
                ? "text-emerald-600 dark:text-emerald-400"
                : state === "failed"
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-700 dark:text-white/70"
            }`}
          >
            {message}
          </p>
        ) : null}

        {alreadyVerified && !userId && !secret ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Your email is already verified.
          </p>
        ) : null}

        {(!userId || !secret) && !alreadyVerified ? (
          <p className="text-sm text-gray-600 dark:text-white/50">
            Open this page from the verification link in your email, or request a new verification message below.
          </p>
        ) : null}

        <div className="grid gap-3">
          {!alreadyVerified ? (
            <button
              onClick={() => {
                void sendVerificationEmail();
              }}
              disabled={sending}
              className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold py-3 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send Verification Email"}
            </button>
          ) : null}

          {userId && secret && !alreadyVerified ? (
            <button
              onClick={() => {
                void confirmVerification();
              }}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 font-semibold py-3 text-gray-800 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Retry Verification
            </button>
          ) : null}
        </div>
      </div>
    </AuthShell>
  );
}

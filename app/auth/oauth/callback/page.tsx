"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthShell } from "@/app/components/AuthShell";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const secret = searchParams.get("secret") || "";
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const next = searchParams.get("next") || "/account";
    return next.startsWith("/") ? next : "/account";
  }, [searchParams]);

  useEffect(() => {
    async function completeOAuth() {
      if (!userId || !secret) {
        setError("Missing OAuth callback credentials.");
        return;
      }

      try {
        const res = await fetch("/api/auth/oauth/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, secret }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "OAuth completion failed");
        }

        router.replace(nextPath);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "OAuth completion failed";
        setError(message);
      }
    }

    void completeOAuth();
  }, [router, userId, secret, nextPath]);

  return (
    <AuthShell
      title="Signing You In"
      subtitle="Completing your OAuth session..."
    >
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-sm text-gray-700 dark:text-white/70">
          One moment while we finalize your login.
        </p>
      )}
    </AuthShell>
  );
}

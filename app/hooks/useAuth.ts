"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AuthMeResponse, AuthUser } from "@/app/types/auth";

interface UseAuthResult {
  loading: boolean;
  user: AuthUser | null;
  authenticated: boolean;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = (await res.json()) as AuthMeResponse;
      setUser(data.authenticated ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      loading,
      user,
      authenticated: Boolean(user),
      refresh,
    }),
    [loading, user, refresh]
  );
}

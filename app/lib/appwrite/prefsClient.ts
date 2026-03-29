const memoryPrefs: Record<string, unknown> = {};

async function ensureAnonymousSession() {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/auth/anonymous", {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    // Ignore network errors and fall back to in-memory storage.
  }
}

export async function getGrovyPrefs(): Promise<Record<string, unknown>> {
  if (typeof window === "undefined") {
    return { ...memoryPrefs };
  }

  await ensureAnonymousSession();

  try {
    const res = await fetch("/api/user/preferences", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return { ...memoryPrefs };
    }

    const data = (await res.json()) as { prefs?: Record<string, unknown> };
    const prefs = data?.prefs && typeof data.prefs === "object" ? data.prefs : {};

    Object.assign(memoryPrefs, prefs);
    return { ...memoryPrefs };
  } catch {
    return { ...memoryPrefs };
  }
}

export async function patchGrovyPrefs(
  patch: Record<string, unknown>
): Promise<Record<string, unknown>> {
  Object.assign(memoryPrefs, patch);

  if (typeof window === "undefined") {
    return { ...memoryPrefs };
  }

  await ensureAnonymousSession();

  try {
    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch }),
    });

    if (!res.ok) {
      return { ...memoryPrefs };
    }

    const data = (await res.json()) as { prefs?: Record<string, unknown> };

    if (data?.prefs && typeof data.prefs === "object") {
      Object.keys(memoryPrefs).forEach((key) => {
        delete memoryPrefs[key];
      });
      Object.assign(memoryPrefs, data.prefs);
    }

    return { ...memoryPrefs };
  } catch {
    return { ...memoryPrefs };
  }
}

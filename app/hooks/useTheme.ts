"use client";

import { useCallback, useEffect, useState } from "react";

import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/preferences";

type Theme = "dark" | "light";

/**
 * Theme state shared by the navbar and the document root.
 *
 * The class is applied to `<html>` so Tailwind's `dark:` variant and HeroUI's
 * theme tokens stay in sync. The initial value is read synchronously from
 * local storage to avoid a flash of the wrong theme.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let active = true;

    void (async () => {
      const prefs = await getGrovyPrefs();
      if (!active) return;

      const resolved: Theme = prefs.theme === "light" ? "light" : "dark";
      setTheme(resolved);
      applyTheme(resolved);
    })();

    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      applyTheme(next);
      void patchGrovyPrefs({ theme: next });
      return next;
    });
  }, []);

  return { theme, isDark: theme === "dark", toggleTheme };
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#000000" : "#f5f5f7");
  }
}

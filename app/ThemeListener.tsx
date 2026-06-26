"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ThemeListener() {
  const searchParams = useSearchParams();
  const urlTheme = searchParams.get("theme") || searchParams.get("appearance");

  useEffect(() => {
    const applyTheme = (theme: string) => {
      if (theme === "dark" || theme === "light") {
        document.documentElement.setAttribute("data-theme", theme);
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    // 1. Re-apply on search param change (e.g. Next.js navigation)
    if (urlTheme) applyTheme(urlTheme);

    // 2. Listen to live postMessage events from Whop parent
    const handleMessage = (event: MessageEvent) => {
      try {
        let rawData = event.data;
        if (typeof rawData === 'string') {
          // Only try to parse if it looks like JSON
          if (rawData.startsWith('{') || rawData.startsWith('[')) {
            rawData = JSON.parse(rawData);
          }
        }

        const data = rawData;
        let nextTheme = null;

        // Check a wide variety of possible payload structures Whop might use
        if (typeof data === 'string' && (data === 'light' || data === 'dark')) {
          nextTheme = data;
        } else if (data?.type === "theme" && typeof data.theme === 'string') {
          nextTheme = data.theme;
        } else if (data?.appearance && typeof data.appearance === 'string') {
          nextTheme = data.appearance;
        } else if (data?.theme?.appearance && typeof data.theme.appearance === 'string') {
          nextTheme = data.theme.appearance;
        } else if (data?.theme && typeof data.theme === 'string') {
          nextTheme = data.theme;
        }

        if (nextTheme === 'dark' || nextTheme === 'light') {
          applyTheme(nextTheme);
        }
      } catch (e) {
        // ignore
      }
    };

    // 3. Listen to color-scheme media query changes.
    // Whop often changes the CSS color-scheme of the iframe element dynamically,
    // which triggers this media query inside the iframe without a page reload.
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? "dark" : "light");
    };

    window.addEventListener("message", handleMessage);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener("message", handleMessage);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [urlTheme]);

  return null;
}

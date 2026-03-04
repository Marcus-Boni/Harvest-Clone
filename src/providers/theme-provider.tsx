"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";

/**
 * Synchronizes the persisted Zustand theme state with the <html> class attribute.
 * Must be rendered inside the <body> to have access to the DOM.
 * The suppressHydrationWarning on <html> handles the mismatch between SSR "dark"
 * and the client-side value read from localStorage.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
}

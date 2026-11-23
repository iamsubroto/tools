"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Theme } from "@radix-ui/themes";

export type Appearance = "light" | "dark";

interface ThemeModeContextValue {
  appearance: Appearance;
  toggleAppearance: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  appearance: "light",
  toggleAppearance: () => {},
});

const STORAGE_KEY = "toolsbd_theme";
const THEME_EVENT = "toolsbd-theme-change";

function subscribeTheme(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getThemeSnapshot(): Appearance {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getServerThemeSnapshot(): Appearance {
  return "light";
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const appearance = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", appearance === "dark");
  }, [appearance]);

  const toggleAppearance = () => {
    const next: Appearance = appearance === "light" ? "dark" : "light";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(THEME_EVENT));
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <ThemeModeContext.Provider value={{ appearance, toggleAppearance }}>
      <Theme
        appearance={appearance}
        accentColor="jade"
        grayColor="slate"
        radius="medium"
        panelBackground="solid"
      >
        {children}
      </Theme>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}

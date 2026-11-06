// useTheme.js - System / light / dark theme with persistence
import { useEffect, useState } from "react";

const STORAGE_KEY = "verifinews-theme";
const MODES = ["system", "light", "dark"];

function readStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function useTheme() {
  const [themeMode, setThemeModeState] = useState(readStoredMode);
  const [effectiveTheme, setEffectiveTheme] = useState("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = themeMode === "system" ? (mediaQuery.matches ? "dark" : "light") : themeMode;
      setEffectiveTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    apply();
    if (themeMode !== "system") return undefined;
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, [themeMode]);

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // best-effort
    }
  };

  return { themeMode, effectiveTheme, setThemeMode };
}

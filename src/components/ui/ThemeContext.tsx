"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const THEME_COLORS = {
  cyan: { main: "#06B6D4", hover: "#0891B2", light: "#22D3EE", dark: "#0E7490" },
  purple: { main: "#8B5CF6", hover: "#7C3AED", light: "#A78BFA", dark: "#6D28D9" },
  green: { main: "#22C55E", hover: "#16A34A", light: "#4ADE80", dark: "#15803D" },
  orange: { main: "#F97316", hover: "#EA580C", light: "#FB923C", dark: "#C2410C" },
  pink: { main: "#EC4899", hover: "#DB2777", light: "#F472B6", dark: "#BE185D" },
  blue: { main: "#3B82F6", hover: "#2563EB", light: "#60A5FA", dark: "#1D4ED8" },
  red: { main: "#EF4444", hover: "#DC2626", light: "#F87171", dark: "#B91C1C" },
  yellow: { main: "#EAB308", hover: "#CA8A04", light: "#FACC15", dark: "#A16207" },
  teal: { main: "#14B8A6", hover: "#0D9488", light: "#2DD4BF", dark: "#0F766E" },
  indigo: { main: "#6366F1", hover: "#4F46E5", light: "#818CF8", dark: "#4338CA" },
} as const;

export type ThemeColorKey = keyof typeof THEME_COLORS;

type ThemeContextType = {
  accentColor: ThemeColorKey;
  setAccentColor: (color: ThemeColorKey) => void;
  colors: typeof THEME_COLORS;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<ThemeColorKey>("cyan");

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("theme-accent");
    if (saved && saved in THEME_COLORS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time hydration from localStorage on mount
      setAccentColorState(saved as ThemeColorKey);
    }
  }, []);

  // Update CSS variables and save to localStorage when color changes
  useEffect(() => {
    const colors = THEME_COLORS[accentColor];
    document.documentElement.style.setProperty("--color-accent", colors.main);
    document.documentElement.style.setProperty("--color-accent-hover", colors.hover);
    document.documentElement.style.setProperty("--color-accent-light", colors.light);
    document.documentElement.style.setProperty("--color-accent-dark", colors.dark);
    document.documentElement.style.setProperty("--color-accent-glow", hexToRgba(colors.main, 0.4));
    localStorage.setItem("theme-accent", accentColor);
  }, [accentColor]);

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        setAccentColor: setAccentColorState,
        colors: THEME_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

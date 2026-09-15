import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  setForcedTheme: (theme: Theme | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [preference, setPreference] = useState<Theme>(() => {
    if (switchable) {
      try {
        const stored = localStorage.getItem("theme");
        if (stored === "light" || stored === "dark") return stored;
      } catch { /* Armazenamento indisponível: manter preferência em memória. */ }
    }
    return defaultTheme;
  });
  const [forcedTheme, setForcedTheme] = useState<Theme | null>(null);
  const theme = forcedTheme ?? preference;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }

  }, [theme]);

  useEffect(() => {
    if (switchable) {
      try { localStorage.setItem("theme", preference); } catch { /* Sem persistência. */ }
    }
  }, [preference, switchable]);

  const toggleTheme = switchable
    ? () => {
        setPreference(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, setForcedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

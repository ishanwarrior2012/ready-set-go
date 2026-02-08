import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ColorTheme = "default" | "ocean" | "forest" | "sunset" | "midnight" | "rose";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  colorTheme: ColorTheme;
  setColorTheme: (ct: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const colorThemeVars: Record<ColorTheme, Record<string, string>> = {
  default: {
    "--primary": "199 89% 48%",
    "--accent": "199 89% 48%",
    "--ring": "199 89% 48%",
    "--sidebar-primary": "199 89% 48%",
    "--sidebar-ring": "199 89% 48%",
    "--nav-active": "199 89% 48%",
    "--info": "199 89% 48%",
  },
  ocean: {
    "--primary": "210 100% 45%",
    "--accent": "210 100% 45%",
    "--ring": "210 100% 45%",
    "--sidebar-primary": "210 100% 45%",
    "--sidebar-ring": "210 100% 45%",
    "--nav-active": "210 100% 45%",
    "--info": "210 100% 45%",
  },
  forest: {
    "--primary": "150 60% 40%",
    "--accent": "150 60% 40%",
    "--ring": "150 60% 40%",
    "--sidebar-primary": "150 60% 40%",
    "--sidebar-ring": "150 60% 40%",
    "--nav-active": "150 60% 40%",
    "--info": "150 60% 40%",
  },
  sunset: {
    "--primary": "25 95% 55%",
    "--accent": "25 95% 55%",
    "--ring": "25 95% 55%",
    "--sidebar-primary": "25 95% 55%",
    "--sidebar-ring": "25 95% 55%",
    "--nav-active": "25 95% 55%",
    "--info": "25 95% 55%",
  },
  midnight: {
    "--primary": "260 60% 50%",
    "--accent": "260 60% 50%",
    "--ring": "260 60% 50%",
    "--sidebar-primary": "260 60% 50%",
    "--sidebar-ring": "260 60% 50%",
    "--nav-active": "260 60% 50%",
    "--info": "260 60% 50%",
  },
  rose: {
    "--primary": "340 80% 55%",
    "--accent": "340 80% 55%",
    "--ring": "340 80% 55%",
    "--sidebar-primary": "340 80% 55%",
    "--sidebar-ring": "340 80% 55%",
    "--nav-active": "340 80% 55%",
    "--info": "340 80% 55%",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("colorTheme") as ColorTheme) || "default";
    }
    return "default";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Apply light/dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const resolved = theme === "system" ? systemTheme : theme;
    setResolvedTheme(resolved);
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const resolved = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(resolved);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(resolved);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Apply color theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const vars = colorThemeVars[colorTheme] || colorThemeVars.default;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    localStorage.setItem("colorTheme", colorTheme);
  }, [colorTheme]);

  const setColorTheme = (ct: ColorTheme) => {
    setColorThemeState(ct);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type AccentColor = "blue" | "purple" | "green" | "orange";
type FontSize = "small" | "medium" | "large";

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
  actualTheme: "light" | "dark"; // The actual resolved theme (system becomes light/dark)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("nomedia-theme");
    return (saved as Theme) || "system";
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem("nomedia-accent-color");
    return (saved as AccentColor) || "blue";
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem("nomedia-font-size");
    return (saved as FontSize) || "medium";
  });

  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // Handle system theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setActualTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    handleChange(); // Set initial value
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Update actual theme when theme changes
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setActualTheme(mediaQuery.matches ? "dark" : "light");
    } else {
      setActualTheme(theme);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add current theme class
    root.classList.add(actualTheme);

    // Apply accent color CSS variables
    const accentColors = {
      blue: {
        primary: "239 84% 67%",
        "primary-dark": "239 84% 57%",
      },
      purple: {
        primary: "260 83% 70%",
        "primary-dark": "260 83% 60%",
      },
      green: {
        primary: "142 76% 46%",
        "primary-dark": "142 76% 36%",
      },
      orange: {
        primary: "25 95% 63%",
        "primary-dark": "25 95% 53%",
      },
    };

    const colors = accentColors[accentColor];
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--accent", colors.primary);
    root.style.setProperty("--nomedia-blue", colors.primary);
    root.style.setProperty("--nomedia-blue-dark", colors["primary-dark"]);

    // Apply font size
    const fontSizes = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };

    root.style.setProperty("--base-font-size", fontSizes[fontSize]);
    root.style.fontSize = fontSizes[fontSize];
  }, [actualTheme, accentColor, fontSize]);

  // Persist theme settings
  useEffect(() => {
    localStorage.setItem("nomedia-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("nomedia-accent-color", accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem("nomedia-font-size", fontSize);
  }, [fontSize]);

  const value = {
    theme,
    accentColor,
    fontSize,
    setTheme,
    setAccentColor,
    setFontSize,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

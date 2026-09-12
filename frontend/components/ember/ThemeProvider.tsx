"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeContext = createContext({ light: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("webbuilder-theme") === "light";
      setLight(saved);
      document.documentElement.dataset.theme = saved ? "light" : "dark";
    } catch {
      /* The default theme also works without browser storage. */
    }
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    try {
      localStorage.setItem("webbuilder-theme", next ? "light" : "dark");
    } catch {}
  };
  return (
    <ThemeContext.Provider value={{ light, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { light, toggle } = useContext(ThemeContext);
  return (
    <button
      type="button"
      className="ember-icon"
      onClick={toggle}
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
    >
      {light ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

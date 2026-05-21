import { useEffect } from "react";
import { useUiStore, type Theme } from "@/stores/use-ui-store";
import { useBrandStore } from "@/stores/use-brand-store";

const ACCENT_STYLE_ID = "goclaw-accent-override";
const THEME_CLASSES = ["theme-lumos", "theme-obsidian"] as const;

function resolveIsDark(uiTheme: Theme, brandColorMode: string): boolean {
  const mode = brandColorMode !== "system" ? brandColorMode : uiTheme;
  if (mode === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return mode === "dark";
}

function applyAll(uiTheme: Theme, brandThemeId: string, brandColorMode: string, accentHue: number | null, appName: string) {
  const root = document.documentElement;

  // Remove theme classes
  root.classList.remove("light", "dark", ...THEME_CLASSES);

  // Add brand theme class
  if (brandThemeId === "lumos") {
    root.classList.add("theme-lumos");
    root.classList.add("light");
  } else if (brandThemeId === "obsidian") {
    root.classList.add("theme-obsidian", "dark");
  } else {
    // Default: follow uiTheme
    const dark = resolveIsDark(uiTheme, brandColorMode);
    root.classList.add(dark ? "dark" : "light");
  }

  // Accent hue injection
  let styleEl = document.getElementById(ACCENT_STYLE_ID);
  if (accentHue !== null) {
    const L = brandThemeId === "obsidian" ? "0.64" : "0.62";
    const css = `:root, .theme-lumos, .theme-obsidian {
  --primary: oklch(${L} 0.20 ${accentHue});
  --ring: oklch(${L} 0.20 ${accentHue});
  --sidebar-primary: oklch(${L} 0.20 ${accentHue});
  --sidebar-ring: oklch(${L} 0.20 ${accentHue});
  --chart-1: oklch(${L} 0.20 ${accentHue});
  --accent: oklch(0.95 0.012 ${accentHue});
  --accent-foreground: oklch(0.35 0.18 ${accentHue});
  --sidebar-accent: oklch(0.95 0.012 ${accentHue});
  --sidebar-accent-foreground: oklch(0.35 0.18 ${accentHue});
}
.dark, .theme-obsidian {
  --primary: oklch(${L} 0.20 ${accentHue});
  --chat-bubble-user: oklch(0.48 0.18 ${accentHue});
}`;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = ACCENT_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  } else {
    styleEl?.remove();
  }

  // App title
  document.title = appName;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const uiTheme = useUiStore((s) => s.theme);
  const { themeId, colorMode, accentHue, appName } = useBrandStore();

  useEffect(() => {
    applyAll(uiTheme, themeId, colorMode, accentHue, appName);
  }, [uiTheme, themeId, colorMode, accentHue, appName]);

  useEffect(() => {
    if (colorMode !== "system" && uiTheme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyAll(uiTheme, themeId, colorMode, accentHue, appName);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [uiTheme, themeId, colorMode, accentHue, appName]);

  return <>{children}</>;
}

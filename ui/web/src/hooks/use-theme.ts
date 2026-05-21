import { useEffect } from "react";
import { useBrandStore } from "@/stores/use-brand-store";
import type { ThemeId, ColorMode } from "@/stores/use-brand-store";

const THEME_CLASSES: ThemeId[] = ["lumos", "obsidian"];
const ACCENT_STYLE_ID = "goclaw-accent-override";

function resolveColorMode(mode: ColorMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme(themeId: ThemeId, colorMode: ColorMode, accentHue: number | null) {
  const html = document.documentElement;

  // Remove all theme classes
  for (const cls of THEME_CLASSES) {
    html.classList.remove(`theme-${cls}`);
  }
  // Apply new theme class
  if (themeId !== "default") {
    html.classList.add(`theme-${themeId}`);
  }

  // Obsidian is always dark; Lumos is always light; default follows colorMode
  let dark: boolean;
  if (themeId === "obsidian") {
    dark = true;
  } else if (themeId === "lumos") {
    dark = false;
  } else {
    dark = resolveColorMode(colorMode) === "dark";
  }
  html.classList.toggle("dark", dark);

  // Inject accent hue override
  let styleEl = document.getElementById(ACCENT_STYLE_ID);
  if (accentHue !== null) {
    const L = themeId === "obsidian" ? "0.64" : "0.62";
    const C = "0.20";
    const H = accentHue;
    const css = `:root, .theme-lumos, .theme-obsidian {
  --primary: oklch(${L} ${C} ${H});
  --ring: oklch(${L} ${C} ${H});
  --sidebar-primary: oklch(${L} ${C} ${H});
  --sidebar-ring: oklch(${L} ${C} ${H});
  --chart-1: oklch(${L} ${C} ${H});
  --accent: oklch(0.95 0.012 ${H});
  --accent-foreground: oklch(0.35 0.18 ${H});
  --sidebar-accent: oklch(0.95 0.012 ${H});
  --sidebar-accent-foreground: oklch(0.35 0.18 ${H});
}
.dark, .theme-obsidian {
  --primary: oklch(${L} ${C} ${H});
  --ring: oklch(${L} ${C} ${H});
  --sidebar-primary: oklch(${L} ${C} ${H});
  --chat-bubble-user: oklch(0.48 0.18 ${H});
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
}

/** Sync brand store → DOM theme on mount and whenever store changes */
export function useTheme() {
  const { themeId, colorMode, accentHue } = useBrandStore();

  useEffect(() => {
    applyTheme(themeId, colorMode, accentHue);
  }, [themeId, colorMode, accentHue]);

  // Also listen to system preference changes if mode === "system"
  useEffect(() => {
    if (colorMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(themeId, colorMode, accentHue);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeId, colorMode, accentHue]);
}

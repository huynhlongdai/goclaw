import { useBrandStore } from "@/stores/use-brand-store";
import type { ThemeId } from "@/stores/use-brand-store";
import { useUiStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/utils";
import { Check, Monitor, Sun, Moon } from "lucide-react";

interface ThemePreview {
  id: ThemeId;
  label: string;
  description: string;
  bg: string;
  card: string;
  accent: string;
  text: string;
  border: string;
}

const THEMES: ThemePreview[] = [
  {
    id: "default",
    label: "Default",
    description: "Warm amber tones, supports light & dark",
    bg: "bg-zinc-100 dark:bg-zinc-900",
    card: "bg-white dark:bg-zinc-800",
    accent: "bg-amber-600",
    text: "text-zinc-900 dark:text-zinc-100",
    border: "border-zinc-200 dark:border-zinc-700",
  },
  {
    id: "lumos",
    label: "Lumos",
    description: "Clean white + coral. Inspired by Noteflow.",
    bg: "bg-slate-100",
    card: "bg-white",
    accent: "bg-orange-600",
    text: "text-slate-900",
    border: "border-slate-200",
  },
  {
    id: "obsidian",
    label: "Obsidian",
    description: "Deep navy + vivid violet. Premium dark.",
    bg: "bg-[#0D0D14]",
    card: "bg-[#161620]",
    accent: "bg-violet-500",
    text: "text-slate-100",
    border: "border-[#222232]",
  },
];

export function ThemePicker() {
  const { themeId, setTheme, setColorMode } = useBrandStore();
  const { theme: uiTheme, setTheme: setUiTheme } = useUiStore();

  return (
    <div className="space-y-4">
      {/* Theme cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={cn(
              "relative rounded-xl border-2 p-3 text-left transition-all hover:shadow-md",
              themeId === t.id ? "border-primary shadow-sm" : "border-border hover:border-primary/40",
            )}
          >
            {/* Mini preview */}
            <div className={cn("mb-2.5 h-20 rounded-lg overflow-hidden border", t.border)}>
              <div className={cn("h-full p-2 flex flex-col gap-1.5", t.bg)}>
                {/* Fake top bar */}
                <div className={cn("flex items-center gap-1")}>
                  <div className={cn("h-1.5 w-1.5 rounded-full", t.accent)} />
                  <div className={cn("h-1.5 w-10 rounded-full opacity-30", t.card === "bg-white" ? "bg-slate-400" : "bg-slate-500")} />
                </div>
                {/* Fake cards */}
                <div className="flex gap-1.5 flex-1">
                  <div className={cn("flex-1 rounded-md border", t.card, t.border)} />
                  <div className={cn("flex-1 rounded-md border", t.card, t.border)} />
                  <div className={cn("flex-1 rounded-md border", t.card, t.border)} />
                </div>
                {/* Fake button */}
                <div className={cn("h-2 w-12 rounded-full", t.accent, "opacity-90")} />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.label}</span>
                {themeId === t.id && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">{t.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Color mode (only visible for Default theme) */}
      {themeId === "default" && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Chế độ màu</p>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setColorMode(m);
                  if (m !== "system") setUiTheme(m);
                  else setUiTheme("system");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  (uiTheme === m || (m === "system" && uiTheme === "system"))
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent",
                )}
              >
                {m === "light" && <Sun className="h-3.5 w-3.5" />}
                {m === "dark" && <Moon className="h-3.5 w-3.5" />}
                {m === "system" && <Monitor className="h-3.5 w-3.5" />}
                {m === "light" ? "Sáng" : m === "dark" ? "Tối" : "Theo hệ thống"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

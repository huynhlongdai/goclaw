import { useBrandStore } from "@/stores/use-brand-store";
import { cn } from "@/lib/utils";

const PRESET_HUES = [
  { label: "Coral", hue: 22 },
  { label: "Amber", hue: 38 },
  { label: "Green", hue: 145 },
  { label: "Teal", hue: 185 },
  { label: "Blue", hue: 220 },
  { label: "Indigo", hue: 260 },
  { label: "Violet", hue: 290 },
  { label: "Pink", hue: 330 },
];

export function AccentHueSlider() {
  const { accentHue, setAccentHue } = useBrandStore();
  const current = accentHue ?? 38;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Màu nhấn (Accent)</p>
        {accentHue !== null && (
          <button
            type="button"
            onClick={() => setAccentHue(null)}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Đặt lại mặc định
          </button>
        )}
      </div>

      {/* Hue wheel slider */}
      <div className="relative">
        <div
          className="h-3 w-full rounded-full"
          style={{
            background: "linear-gradient(to right, oklch(0.62 0.20 0), oklch(0.62 0.20 30), oklch(0.62 0.20 60), oklch(0.62 0.20 90), oklch(0.62 0.20 120), oklch(0.62 0.20 150), oklch(0.62 0.20 180), oklch(0.62 0.20 210), oklch(0.62 0.20 240), oklch(0.62 0.20 270), oklch(0.62 0.20 300), oklch(0.62 0.20 330), oklch(0.62 0.20 360))",
          }}
        />
        <input
          type="range"
          min={0}
          max={360}
          value={current}
          onChange={(e) => setAccentHue(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {/* Thumb indicator */}
        <div
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow-md"
          style={{
            left: `${(current / 360) * 100}%`,
            background: `oklch(0.62 0.20 ${current})`,
          }}
        />
      </div>

      {/* Preview swatch */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-lg border border-white/20 shadow-sm"
          style={{ background: `oklch(0.62 0.20 ${current})` }}
        />
        <span className="text-xs text-muted-foreground font-mono">hue: {current}°</span>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_HUES.map((p) => (
          <button
            key={p.hue}
            type="button"
            onClick={() => setAccentHue(p.hue)}
            title={p.label}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
              current === p.hue && accentHue !== null ? "border-foreground scale-110" : "border-transparent",
            )}
            style={{ background: `oklch(0.62 0.20 ${p.hue})` }}
          />
        ))}
      </div>
    </div>
  );
}

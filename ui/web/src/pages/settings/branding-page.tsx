import { useRef, useState } from "react";
import { useBrandStore } from "@/stores/use-brand-store";
import { ThemePicker } from "@/components/brand/theme-picker";
import { AccentHueSlider } from "@/components/brand/accent-hue-slider";
import { AppLogo } from "@/components/brand/app-logo";
import { toast } from "@/stores/use-toast-store";
import { Upload, RotateCcw, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground/80 mb-3">{children}</h3>
  );
}

function FormRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 shrink-0 sm:w-48">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function LogoUploader({ value, onChange, label }: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 300_000) {
      toast.error("File quá lớn", "Logo phải nhỏ hơn 300KB. Dùng SVG hoặc PNG nhỏ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted">
        {value ? (
          <img src={value} alt="Logo" className="h-9 w-9 object-contain" />
        ) : (
          <AppLogo size={28} />
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          {label}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            Xoá
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/svg+xml,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

function FeatureFlagToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )} />
      </button>
    </div>
  );
}

export function BrandingPage() {
  const brand = useBrandStore();
  const [previewLoginMessage, setPreviewLoginMessage] = useState(false);

  const handleReset = () => {
    brand.reset();
    toast.success("Đã đặt lại", "Cài đặt thương hiệu về mặc định.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Thương hiệu & Giao diện</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tuỳ chỉnh logo, tên, màu sắc và giao diện toàn bộ ứng dụng.</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Đặt lại
        </button>
      </div>

      {/* ── Section 1: Identity ── */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <SectionHeading>Nhận diện thương hiệu</SectionHeading>

        <FormRow label="Logo ứng dụng" description="PNG, SVG, WebP — tối đa 300KB">
          <LogoUploader value={brand.logoDataUrl} onChange={brand.setLogo} label="Tải logo lên" />
        </FormRow>

        <div className="border-t" />

        <FormRow label="Tên ứng dụng" description="Hiển thị trong tab trình duyệt và sidebar">
          <TextInput value={brand.appName} onChange={brand.setAppName} placeholder="GoClaw" maxLength={32} />
        </FormRow>

        <FormRow label="Tagline" description="Dòng mô tả ngắn bên dưới tên">
          <TextInput value={brand.appTagline} onChange={brand.setAppTagline} placeholder="AI Agent Platform" maxLength={64} />
        </FormRow>
      </section>

      {/* ── Section 2: Theme ── */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <SectionHeading>Giao diện & Màu sắc</SectionHeading>
        <ThemePicker />
        <div className="border-t pt-4">
          <AccentHueSlider />
        </div>
      </section>

      {/* ── Section 3: Login Page ── */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading>Trang đăng nhập</SectionHeading>
          <button
            type="button"
            onClick={() => setPreviewLoginMessage(!previewLoginMessage)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {previewLoginMessage ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {previewLoginMessage ? "Ẩn xem trước" : "Xem trước"}
          </button>
        </div>

        <FormRow label="Tiêu đề đăng nhập">
          <TextInput value={brand.loginTitle} onChange={brand.setLoginTitle} placeholder="Đăng nhập" maxLength={48} />
        </FormRow>

        <FormRow label="Thông báo chào" description="Hiện bên dưới form đăng nhập (tuỳ chọn)">
          <textarea
            value={brand.loginMessage}
            onChange={(e) => brand.setLoginMessage(e.target.value)}
            placeholder="Chào mừng bạn đến với hệ thống..."
            rows={2}
            maxLength={200}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormRow>

        <FormRow label="Nền trang đăng nhập">
          <div className="flex gap-2">
            {(["default", "gradient", "image"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => brand.setLoginBgStyle(s)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  brand.loginBgStyle === s ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                )}
              >
                {s === "default" ? "Mặc định" : s === "gradient" ? "Gradient" : "Tuỳ chỉnh"}
              </button>
            ))}
          </div>
        </FormRow>

        {previewLoginMessage && (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Xem trước trang đăng nhập:</p>
            <div className="rounded-lg bg-card border p-4 text-center space-y-1">
              <AppLogo size={32} className="mx-auto" />
              <p className="font-semibold text-sm">{brand.appName}</p>
              <p className="text-xl font-bold">{brand.loginTitle}</p>
              {brand.loginMessage && (
                <p className="text-xs text-muted-foreground">{brand.loginMessage}</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Section 4: Feature Flags ── */}
      <section className="rounded-xl border bg-card p-5">
        <SectionHeading>Tính năng hiển thị</SectionHeading>
        <div className="divide-y">
          <FeatureFlagToggle
            label="Module Công việc"
            description="Hiện mục Work/Tasks trong navigation"
            checked={brand.showWorkModule}
            onChange={(v) => brand.setFeatureFlag("showWorkModule", v)}
          />
          <FeatureFlagToggle
            label="Traces & Monitoring"
            description="Hiện mục Traces trong navigation"
            checked={brand.showTracesSection}
            onChange={(v) => brand.setFeatureFlag("showTracesSection", v)}
          />
          <FeatureFlagToggle
            label="Vault & Knowledge"
            description="Hiện Vault, Memory, Knowledge Graph"
            checked={brand.showVaultSection}
            onChange={(v) => brand.setFeatureFlag("showVaultSection", v)}
          />
        </div>
      </section>
    </div>
  );
}

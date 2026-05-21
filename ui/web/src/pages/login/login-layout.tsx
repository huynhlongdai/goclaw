import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "@/stores/use-ui-store";
import { useBrandStore } from "@/stores/use-brand-store";
import { AppLogo } from "@/components/brand/app-logo";
import { cn } from "@/lib/utils";

interface LoginLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

export function LoginLayout({ children, subtitle }: LoginLayoutProps) {
  const { t } = useTranslation("topbar");
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const { appName, loginTitle, loginMessage, loginBgStyle, themeId } = useBrandStore();
  const isDark =
    themeId === "obsidian" ||
    (themeId === "default" && (
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ));

  const bgClass = loginBgStyle === "gradient"
    ? "bg-gradient-to-br from-primary/20 via-background to-accent/20"
    : "bg-background";

  return (
    <div className={cn("relative flex min-h-dvh items-center justify-center px-4", bgClass)}>
      {/* Theme toggle — only for default theme */}
      {themeId === "default" && (
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="absolute top-4 right-4 cursor-pointer rounded-md border bg-card p-2 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          title={t("toggleTheme")}
          aria-label={t("toggleTheme")}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      )}
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <AppLogo size={80} className="mx-auto mb-3" />
          <h1 className="text-3xl font-bold tracking-tight">{appName}</h1>
          {loginTitle && loginTitle !== "Đăng nhập" && (
            <p className="mt-1 text-base font-medium text-primary">{loginTitle}</p>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {loginMessage && (
            <p className="mt-2 text-xs text-muted-foreground/80 italic">{loginMessage}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

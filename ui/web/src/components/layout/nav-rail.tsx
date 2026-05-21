import { useState } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Palette,
  Users,
  Zap,
  Database,
  Radio,
  Activity,
  Settings,
  Sun,
  Moon,
  Check,
  Building2,
  KeyRound,
  Info,
  LogOut,
  Globe,
  Search,
  KanbanSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover } from "radix-ui";
import { ROUTES, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, LOCAL_STORAGE_KEYS } from "@/lib/constants";
import type { Language } from "@/lib/constants";
import { useUiStore } from "@/stores/use-ui-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTenants } from "@/hooks/use-tenants";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AppLogo } from "@/components/brand/app-logo";
import { AboutDialog } from "./about-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type NavSectionId =
  | "overview"
  | "chat"
  | "agents"
  | "teams"
  | "work"
  | "capabilities"
  | "data"
  | "channels"
  | "monitoring"
  | "admin";

export const GROUPED_SECTIONS: NavSectionId[] = [
  "capabilities",
  "data",
  "channels",
  "monitoring",
  "admin",
];

export function getActiveSectionId(pathname: string): NavSectionId {
  if (pathname === "/" || pathname.startsWith("/overview")) return "overview";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/agents")) return "agents";
  if (pathname.startsWith("/teams")) return "teams";
  if (pathname.startsWith("/work")) return "work";
  if (
    pathname.startsWith("/skills") ||
    pathname.startsWith("/builtin-tools") ||
    pathname.startsWith("/mcp") ||
    pathname.startsWith("/tts") ||
    pathname.startsWith("/cron") ||
    pathname.startsWith("/hooks") ||
    pathname.startsWith("/sessions") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/pending-messages")
  )
    return "capabilities";
  if (
    pathname.startsWith("/memory") ||
    pathname.startsWith("/vault") ||
    pathname.startsWith("/knowledge-graph") ||
    pathname.startsWith("/storage")
  )
    return "data";
  if (pathname.startsWith("/channels") || pathname.startsWith("/nodes"))
    return "channels";
  if (
    pathname.startsWith("/traces") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/logs")
  )
    return "monitoring";
  if (
    pathname.startsWith("/providers") ||
    pathname.startsWith("/config") ||
    pathname.startsWith("/cli-credentials") ||
    pathname.startsWith("/api-keys") ||
    pathname.startsWith("/packages") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/approvals") ||
    pathname.startsWith("/import-export") ||
    pathname.startsWith("/backup-restore")
  )
    return "admin";
  return "overview";
}

export const FIRST_ROUTE_FOR_SECTION: Partial<Record<NavSectionId, string>> = {
  work: ROUTES.WORK_TASKS,
  capabilities: ROUTES.SESSIONS,
  data: ROUTES.MEMORY,
  channels: ROUTES.CHANNELS,
  monitoring: ROUTES.TRACES,
  admin: ROUTES.PROVIDERS,
};

interface RailItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function RailItem({ icon: Icon, label, active, onClick, badge }: RailItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            active
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/50",
          )}
        >
          <Icon className="h-5 w-5" />
          {badge != null && badge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface NavRailProps {
  activeSectionId: NavSectionId;
  onSectionClick: (id: NavSectionId) => void;
  pendingPairingsCount?: number;
  onSearchOpen?: () => void;
}

export function NavRail({
  activeSectionId,
  onSectionClick,
  pendingPairingsCount = 0,
  onSearchOpen,
}: NavRailProps) {
  const { t } = useTranslation("sidebar");
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin" || role === "owner";

  const handleDirect = (id: NavSectionId, route: string) => {
    onSectionClick(id);
    navigate(route);
  };

  return (
    <TooltipProvider delayDuration={500}>
      <aside className="flex w-12 shrink-0 flex-col items-center border-r bg-sidebar py-3 gap-0.5">
        {/* Logo */}
        <div className="mb-1 flex h-9 w-9 items-center justify-center">
          <AppLogo size={28} />
        </div>

        {/* Search / Command Palette trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSearchOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/40 transition-all duration-150 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="text-xs">
            Search
            <kbd className="ml-1.5 rounded border border-border bg-muted px-1 py-0.5 text-[9px]">⌘K</kbd>
          </TooltipContent>
        </Tooltip>

        <div className="my-1.5 w-6 border-t border-sidebar-border/60" />

        {/* Primary nav */}
        <RailItem
          icon={LayoutDashboard}
          label={t("nav.overview")}
          active={activeSectionId === "overview"}
          onClick={() => handleDirect("overview", ROUTES.OVERVIEW)}
        />
        <RailItem
          icon={MessageSquare}
          label={t("nav.chat")}
          active={activeSectionId === "chat"}
          onClick={() => handleDirect("chat", ROUTES.CHAT)}
        />
        <RailItem
          icon={Bot}
          label={t("nav.agents")}
          active={activeSectionId === "agents"}
          onClick={() => handleDirect("agents", ROUTES.AGENTS)}
        />
        <RailItem
          icon={Users}
          label={t("nav.agentTeams")}
          active={activeSectionId === "teams"}
          onClick={() => handleDirect("teams", ROUTES.TEAMS)}
        />
        <RailItem
          icon={KanbanSquare}
          label="Work"
          active={activeSectionId === "work"}
          onClick={() => handleDirect("work", ROUTES.WORK_TASKS)}
        />

        <div className="my-1.5 w-6 border-t border-sidebar-border/60" />

        {/* Grouped sections */}
        <RailItem
          icon={Zap}
          label={t("groups.capabilities")}
          active={activeSectionId === "capabilities"}
          onClick={() => onSectionClick("capabilities")}
        />
        <RailItem
          icon={Database}
          label={t("groups.data")}
          active={activeSectionId === "data"}
          onClick={() => onSectionClick("data")}
        />
        <RailItem
          icon={Radio}
          label={t("groups.connectivity")}
          active={activeSectionId === "channels"}
          onClick={() => onSectionClick("channels")}
          badge={pendingPairingsCount}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom pinned */}
        <RailItem
          icon={Activity}
          label={t("groups.monitoring")}
          active={activeSectionId === "monitoring"}
          onClick={() => onSectionClick("monitoring")}
        />
        {isAdmin && (
          <RailItem
            icon={Settings}
            label={t("groups.system")}
            active={activeSectionId === "admin"}
            onClick={() => onSectionClick("admin")}
          />
        )}

        <div className="my-1.5 w-6 border-t border-sidebar-border/60" />

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/50 transition-all duration-150 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="text-xs">
            {isDark ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>

        {/* User menu */}
        <UserButton />
      </aside>
    </TooltipProvider>
  );
}

function UserButton() {
  const { t } = useTranslation("topbar");
  const { t: tt } = useTranslation("tenants");
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const userId = useAuthStore((s) => s.userId);
  const connected = useAuthStore((s) => s.connected);
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin" || role === "owner";
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const { currentTenant, currentTenantName, tenants, isOwner, isMultiTenant, currentTenantId } =
    useTenants();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const tenantLabel = currentTenant?.name || currentTenantName || "";

  const handleSwitchTenant = (_tenantId: string, slug: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TENANT_ID, slug);
    if (!isOwner) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TENANT_HINT, slug);
    }
    window.location.reload();
  };

  const initial = (userId ?? "U").charAt(0).toUpperCase();

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover.Trigger asChild>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/50 transition-all duration-150 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                {/* Connection dot */}
                <span
                  className={cn(
                    "absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-1 ring-sidebar",
                    connected ? "bg-green-500" : "bg-red-500",
                  )}
                />
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
                  {initial}
                </div>
              </button>
            </Popover.Trigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="text-xs">
            {userId ?? "User"}
          </TooltipContent>
        </Tooltip>

        <Popover.Portal>
          <Popover.Content
            align="end"
            side="right"
            sideOffset={8}
            className="z-50 w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 pointer-events-auto"
          >
            {/* User info */}
            <div className="px-2 py-1.5 border-b mb-1">
              <p className="text-sm font-medium truncate">{userId}</p>
              {tenantLabel && (
                <p className="text-xs text-muted-foreground truncate">{tenantLabel}</p>
              )}
            </div>

            {/* Tenant switcher */}
            {isMultiTenant && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {tt("currentTenant")}
                </div>
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => {
                      if (tenant.id !== currentTenantId)
                        handleSwitchTenant(tenant.id, tenant.slug);
                      setOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-left">{tenant.name}</span>
                    {tenant.id === currentTenantId && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
                <div className="my-1 border-t" />
              </>
            )}

            {isMultiTenant && (
              <button
                onClick={() => { setOpen(false); navigate(ROUTES.TENANTS); }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{tt("title")}</span>
              </button>
            )}

            <button
              onClick={() => { setOpen(false); navigate(ROUTES.API_KEYS); }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              <span>{t("apiKeys")}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => { setOpen(false); navigate(ROUTES.BRANDING); }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Palette className="h-3.5 w-3.5 shrink-0" />
                <span>Thương hiệu & Giao diện</span>
              </button>
            )}

            <button
              onClick={() => { setOpen(false); setShowAbout(true); }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>{t("about.menuItem")}</span>
            </button>

            <div className="my-1 border-t" />

            <button
              onClick={() => { setOpen(false); setShowLogoutConfirm(true); }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>{t("logout")}</span>
            </button>

            {/* Language */}
            <div className="mt-1 border-t pt-1.5 px-2">
              <div className="flex items-center gap-2 py-1">
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                  <SelectTrigger className="h-7 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang} className="text-xs">{LANGUAGE_LABELS[lang]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Connection status */}
            <div className="border-t pt-1.5 px-2 pb-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", connected ? "bg-green-500" : "bg-red-500")} />
                {connected ? "Connected" : "Disconnected"}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title={t("logout")}
        description={t("logoutConfirm")}
        confirmLabel={t("logout")}
        variant="destructive"
        onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
      />

      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
    </>
  );
}

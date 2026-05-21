import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, LayoutDashboard, MessageSquare, Bot, MoreHorizontal, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavRail, getActiveSectionId, GROUPED_SECTIONS, FIRST_ROUTE_FOR_SECTION } from "./nav-rail";
import type { NavSectionId } from "./nav-rail";
import { SidePanel } from "./side-panel";
import { NavPanelContent } from "./nav-panel-content";
import { BackgroundErrorBanner } from "./background-error-banner";
import { SystemSettingsModal } from "./system-settings-modal";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useUiStore } from "@/stores/use-ui-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useIsMobile } from "@/hooks/use-media-query";
import { usePendingPairingsCount } from "@/hooks/use-pending-pairings-count";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PANEL_SECTION_LABELS: Partial<Record<NavSectionId, string>> = {
  capabilities: "Capabilities",
  data: "Data",
  channels: "Channels",
  monitoring: "Monitoring",
  admin: "System",
};

function stableErrorBoundaryKey(pathname: string): string {
  return pathname.replace(/^(\/[^/]+)\/.*$/, "$1");
}

export function AppShell() {
  const { t } = useTranslation("common");
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const connected = useAuthStore((s) => s.connected);
  const sidePanelCollapsed = useUiStore((s) => s.sidePanelCollapsed);
  const setSidePanelCollapsed = useUiStore((s) => s.setSidePanelCollapsed);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const { pendingCount } = usePendingPairingsCount({ showToast: true });

  const activeSectionId = getActiveSectionId(location.pathname);
  const isGroupedSection = GROUPED_SECTIONS.includes(activeSectionId);
  const showPanel = !isMobile && isGroupedSection && !sidePanelCollapsed;

  // Auto-open panel when navigating into a grouped section
  useEffect(() => {
    if (isGroupedSection) {
      setSidePanelCollapsed(false);
    }
  }, [activeSectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSectionClick = (id: NavSectionId) => {
    if (GROUPED_SECTIONS.includes(id)) {
      if (activeSectionId === id) {
        // Toggle panel
        setSidePanelCollapsed(!sidePanelCollapsed);
      } else {
        // Navigate to first route in that section and open panel
        setSidePanelCollapsed(false);
        const firstRoute = FIRST_ROUTE_FOR_SECTION[id];
        if (firstRoute) navigate(firstRoute);
      }
    }
  };

  const panelTitle = PANEL_SECTION_LABELS[activeSectionId] ?? "";

  return (
    <div className="flex h-dvh overflow-hidden safe-top">
      {/* Nav Rail — desktop only */}
      {!isMobile && (
        <NavRail
          activeSectionId={activeSectionId}
          onSectionClick={handleSectionClick}
          pendingPairingsCount={pendingCount}
          onSearchOpen={() => setCmdPaletteOpen(true)}
        />
      )}

      {/* Animated Side Panel */}
      <AnimatePresence initial={false}>
        {showPanel && (
          <SidePanel
            title={panelTitle}
            onCollapse={() => setSidePanelCollapsed(true)}
          >
            <NavPanelContent sectionId={activeSectionId} />
          </SidePanel>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <BackgroundErrorBanner
          settingsOpen={settingsOpen}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        {!connected && (
          <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{t("disconnectedGateway")}</span>
          </div>
        )}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.main
            key={location.pathname.split("/")[1] ?? "root"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.0, 0.0, 0.2, 1.0] }}
            className={cn("min-w-0 flex-1 overflow-y-auto", isMobile && "pb-14")}
          >
            <ErrorBoundary key={stableErrorBoundaryKey(location.pathname)}>
              <Outlet />
            </ErrorBoundary>
          </motion.main>
        </AnimatePresence>

        {/* Mobile bottom nav */}
        {isMobile && <MobileBottomNav activeSectionId={activeSectionId} />}
      </div>

      <SystemSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
    </div>
  );
}

interface MobileBottomNavProps {
  activeSectionId: NavSectionId;
}

function MobileBottomNav({ activeSectionId }: MobileBottomNavProps) {
  const { t } = useTranslation("sidebar");
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = [
    { id: "chat" as NavSectionId, icon: MessageSquare, label: t("nav.chat"), to: ROUTES.CHAT },
    { id: "agents" as NavSectionId, icon: Bot, label: t("nav.agents"), to: ROUTES.AGENTS },
    { id: "teams" as NavSectionId, icon: Users, label: t("nav.agentTeams"), to: ROUTES.TEAMS },
    { id: "overview" as NavSectionId, icon: LayoutDashboard, label: t("nav.overview"), to: ROUTES.OVERVIEW },
  ];

  const moreGroups = [
    {
      label: t("groups.conversations"),
      items: [
        { label: t("nav.sessions"), to: ROUTES.SESSIONS },
        { label: t("nav.contacts"), to: ROUTES.CONTACTS },
      ],
    },
    {
      label: t("groups.capabilities"),
      items: [
        { label: t("nav.skills"), to: ROUTES.SKILLS },
        { label: t("nav.cron"), to: ROUTES.CRON },
        { label: t("nav.hooks"), to: ROUTES.HOOKS },
        { label: t("nav.mcpServers"), to: ROUTES.MCP },
      ],
    },
    {
      label: t("groups.data"),
      items: [
        { label: t("nav.memory"), to: ROUTES.MEMORY },
        { label: t("nav.vault"), to: ROUTES.VAULT },
        { label: t("nav.knowledgeGraph"), to: ROUTES.KNOWLEDGE_GRAPH },
      ],
    },
    {
      label: t("groups.monitoring"),
      items: [
        { label: t("nav.traces"), to: ROUTES.TRACES },
        { label: t("nav.logs"), to: ROUTES.LOGS },
        { label: t("nav.activity"), to: ROUTES.ACTIVITY },
      ],
    },
  ];

  const handleMoreNav = (to: string) => {
    setMoreOpen(false);
    navigate(to);
  };

  return (
    <>
      <nav className="flex shrink-0 items-center border-t bg-sidebar safe-bottom">
        {primaryItems.map(({ id, icon: Icon, label, to }) => {
          const isActive = activeSectionId === id;
          return (
            <Link
              key={id}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50",
              )}
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <span className="absolute inset-0 -m-1.5 rounded-xl bg-sidebar-primary/10" />
                )}
                <Icon className={cn("relative h-5 w-5 transition-transform", isActive && "scale-110")} />
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors cursor-pointer",
            moreOpen ? "text-sidebar-primary" : "text-sidebar-foreground/50",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* "More" bottom sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t bg-sidebar shadow-xl safe-bottom"
            >
              {/* Drag handle */}
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/30" />

              <div className="max-h-[70vh] overflow-y-auto p-4 pb-8">
                {moreGroups.map((group) => (
                  <div key={group.label} className="mb-4">
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {group.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map((item) => (
                        <button
                          key={item.to}
                          onClick={() => handleMoreNav(item.to)}
                          className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors active:bg-accent cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

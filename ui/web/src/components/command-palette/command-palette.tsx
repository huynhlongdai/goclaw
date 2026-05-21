import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search, LayoutDashboard, MessageSquare, Bot, Users,
  Zap, Radio, Activity,
  History, Brain, FileArchive, Network, HardDrive,
  Clock, Webhook, Package, Plug, Volume2,
  Radar, ClipboardList, Terminal, Cpu, KeyRound,
  Blocks, ShieldCheck, ArrowLeftRight, DatabaseBackup,
  Sun, Moon, LogOut, X, CornerDownLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/lib/constants";
import { useUiStore } from "@/stores/use-ui-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHttp } from "@/hooks/use-ws";
import { cn } from "@/lib/utils";
import type { AgentData } from "@/types/agent";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  group: string;
  keywords?: string[];
  action: () => void;
};

/** Dynamic agent search — returns agents matching query as CommandItems */
function useAgentSearch(query: string): CommandItem[] {
  const navigate = useNavigate();
  const http = useHttp();
  const connected = useAuthStore((s) => s.connected);
  const [results, setResults] = useState<AgentData[]>([]);

  useEffect(() => {
    if (!connected || query.length < 2) { setResults([]); return; }
    let cancelled = false;
    http.get<{ agents: AgentData[] }>("/v1/agents")
      .then((res) => {
        if (cancelled) return;
        const q = query.toLowerCase();
        const matches = (res.agents ?? []).filter((a) =>
          a.status === "active" &&
          (a.agent_key.includes(q) || (a.display_name ?? "").toLowerCase().includes(q))
        ).slice(0, 5);
        setResults(matches);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [http, connected, query]);

  return useMemo(() => results.map((a): CommandItem => ({
    id: `agent:${a.agent_key}`,
    label: a.display_name || a.agent_key,
    description: `${a.provider} / ${a.model}`,
    icon: Bot,
    group: "Agents",
    keywords: [a.agent_key],
    action: () => navigate(`/agents/${a.id}`),
  })), [results, navigate]);
}

function useCommandItems(): CommandItem[] {
  const navigate = useNavigate();
  const { t } = useTranslation("sidebar");
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const logout = useAuthStore((s) => s.logout);
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin" || role === "owner";

  return useMemo(() => {
    const nav = (label: string, icon: React.ElementType, route: string, keywords?: string[]): CommandItem => ({
      id: route,
      label,
      icon,
      group: "Navigate",
      keywords,
      action: () => navigate(route),
    });

    const items: CommandItem[] = [
      nav(t("nav.overview"),        LayoutDashboard, ROUTES.OVERVIEW,       ["dashboard", "home", "stats"]),
      nav(t("nav.chat"),             MessageSquare,   ROUTES.CHAT,           ["message", "conversation"]),
      nav(t("nav.agents"),           Bot,             ROUTES.AGENTS,         ["bots", "ai"]),
      nav(t("nav.agentTeams"),       Users,           ROUTES.TEAMS,          ["team", "group"]),
      nav(t("nav.sessions"),         History,         ROUTES.SESSIONS,       ["history", "thread"]),
      nav(t("nav.channels"),         Radio,           ROUTES.CHANNELS,       ["telegram", "discord", "slack"]),
      nav(t("nav.nodes"),            Radio,           ROUTES.NODES,          ["devices", "pairing"]),
      nav(t("nav.skills"),           Zap,             ROUTES.SKILLS,         ["functions", "tools"]),
      nav(t("nav.builtinTools"),     Package,         ROUTES.BUILTIN_TOOLS,  ["tools", "functions"]),
      nav(t("nav.mcpServers"),       Plug,            ROUTES.MCP,            ["mcp", "server"]),
      nav(t("nav.cron"),             Clock,           ROUTES.CRON,           ["schedule", "jobs"]),
      nav(t("nav.hooks"),            Webhook,         ROUTES.HOOKS,          ["webhook", "triggers"]),
      nav(t("nav.memory"),           Brain,           ROUTES.MEMORY,         ["knowledge", "memory"]),
      nav(t("nav.vault"),            FileArchive,     ROUTES.VAULT,          ["documents", "files", "rag"]),
      nav(t("nav.knowledgeGraph"),   Network,         ROUTES.KNOWLEDGE_GRAPH,["graph", "entities"]),
      nav(t("nav.storage"),          HardDrive,       ROUTES.STORAGE,        ["files", "uploads"]),
      nav(t("nav.traces"),           Activity,        ROUTES.TRACES,         ["logs", "requests", "telemetry"]),
      nav(t("nav.realtimeEvents"),   Radar,           ROUTES.EVENTS,         ["events", "live"]),
      nav(t("nav.activity"),         ClipboardList,   ROUTES.ACTIVITY,       ["audit", "history"]),
      nav(t("nav.logs"),             Terminal,        ROUTES.LOGS,           ["system", "debug"]),
    ];

    if (isAdmin) {
      items.push(
        nav(t("nav.providers"),      Cpu,             ROUTES.PROVIDERS,      ["llm", "models", "openai"]),
        nav(t("nav.apiKeys"),        KeyRound,        ROUTES.API_KEYS,       ["credentials", "token"]),
        nav(t("nav.packages"),       Blocks,          ROUTES.PACKAGES,       ["extensions"]),
        nav(t("nav.approvals"),      ShieldCheck,     ROUTES.APPROVALS,      ["review", "pending"]),
        nav(t("nav.importExport"),   ArrowLeftRight,  ROUTES.IMPORT_EXPORT,  ["backup", "migrate"]),
        nav(t("nav.backupRestore"),  DatabaseBackup,  ROUTES.BACKUP_RESTORE, ["backup"]),
        nav(t("nav.tts"),            Volume2,         ROUTES.TTS,            ["voice", "speech"]),
      );
    }

    // Actions
    items.push({
      id: "toggle-theme",
      label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: isDark ? Sun : Moon,
      group: "Actions",
      keywords: ["theme", "dark", "light"],
      action: () => setTheme(isDark ? "light" : "dark"),
    });

    items.push({
      id: "logout",
      label: "Sign Out",
      icon: LogOut,
      group: "Actions",
      keywords: ["logout", "signout"],
      action: logout,
    });

    return items;
  }, [navigate, t, isDark, setTheme, logout, isAdmin]);
}

function scoreItem(item: CommandItem, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (item.keywords?.some((k) => k.includes(q))) return 40;
  if (item.description?.toLowerCase().includes(q)) return 20;
  return 0;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const staticItems = useCommandItems();
  const dynamicAgents = useAgentSearch(query);

  const allItems = useMemo(() => [...staticItems, ...dynamicAgents], [staticItems, dynamicAgents]);

  const filtered = useMemo(() => {
    const scored = allItems
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map(({ item }) => item);
  }, [allItems, query]);

  // Group items
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return map;
  }, [filtered]);

  const flatItems = filtered;

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const execute = useCallback(
    (item: CommandItem) => {
      item.action();
      onClose();
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selectedIdx];
        if (item) execute(item);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatItems, selectedIdx, execute, onClose],
  );

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  let flatIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }}
            className="fixed left-1/2 top-[15vh] z-50 w-full max-w-[560px] -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-2xl border bg-popover shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b px-4 py-3.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, actions…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                  esc
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none"
              >
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([group, items]) => (
                    <div key={group} className="mb-1">
                      <div className="mb-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        {group}
                      </div>
                      {items.map((item) => {
                        const idx = flatIdx++;
                        const isSelected = idx === selectedIdx;
                        return (
                          <button
                            key={item.id}
                            data-idx={idx}
                            onClick={() => execute(item)}
                            onMouseEnter={() => setSelectedIdx(idx)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                              isSelected
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/80 hover:bg-accent/50",
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate font-medium">{item.label}</span>
                            {item.description && (
                              <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 border-t px-4 py-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5">esc</kbd>
                  close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

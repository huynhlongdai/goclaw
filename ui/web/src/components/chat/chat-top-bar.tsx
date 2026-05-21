import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Bot, Users, PanelRightOpen, PanelRightClose, Settings2 } from "lucide-react";
import { AgentQuickConfigDrawer } from "./agent-quick-config-drawer";
import { useHttp } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import type { RunActivity, ActiveTeamTask } from "@/types/chat";
import type { AgentData } from "@/types/agent";
import type { SessionInfo } from "@/types/session";

interface ChatTopBarProps {
  agentId: string;
  isRunning: boolean;
  isBusy: boolean;
  activity: RunActivity | null;
  teamTasks: ActiveTeamTask[];
  onToggleTaskPanel?: () => void;
  taskPanelOpen?: boolean;
  /** Current session — when provided, the bar renders a context-usage badge. */
  session?: SessionInfo | null;
}

const phaseLabels: Record<RunActivity["phase"], string> = {
  thinking: "Thinking…",
  tool_exec: "Running tool…",
  streaming: "Responding…",
  compacting: "Compacting…",
  retrying: "Retrying…",
  leader_processing: "Processing team results…",
};

export function ChatTopBar({ agentId, isRunning, isBusy, activity, teamTasks, onToggleTaskPanel, taskPanelOpen, session }: ChatTopBarProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const http = useHttp();
  const { t } = useTranslation("chat");
  const connected = useAuthStore((s) => s.connected);
  const [agent, setAgent] = useState<{ name: string; emoji?: string } | null>(null);

  // Fetch agent display info (lightweight, cached per agentId)
  useEffect(() => {
    if (!connected || !agentId) return;
    setAgent(null);
    http
      .get<{ agents: AgentData[] }>("/v1/agents")
      .then((res) => {
        const found = (res.agents ?? []).find((a) => a.agent_key === agentId);
        if (found) {
          const emoji = found.emoji || undefined;
          setAgent({ name: found.display_name || found.agent_key, emoji });
        } else {
          setAgent({ name: agentId });
        }
      })
      .catch(() => setAgent({ name: agentId }));
  }, [http, connected, agentId]);

  const displayName = agent?.name ?? agentId;
  const emoji = agent?.emoji;
  const PanelIcon = taskPanelOpen ? PanelRightClose : PanelRightOpen;

  // Context-usage badge: only renders when the caller passes a session with
  // both estimatedTokens (Phase 4 ContextStage output) and contextWindow.
  // `percent` drives the color ramp so operators spot near-limit sessions.
  const usage = (() => {
    if (!session || !session.contextWindow || session.contextWindow <= 0) {
      return null;
    }
    const used = session.estimatedTokens ?? 0;
    const max = session.contextWindow;
    const percent = Math.min(100, Math.round((used / max) * 100));
    const color =
      percent >= 90 ? "text-destructive" : percent >= 75 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
    return { used, max, percent, color };
  })();

  // Last compaction timestamp ships in sessions.metadata JSONB (Phase 5 follow-up,
  // keyed "last_compaction_at"). Parsed lazily so bad data doesn't crash the bar.
  const lastCompaction = (() => {
    const raw = session?.metadata?.last_compaction_at;
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d;
  })();

  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Agent info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-muted text-base">
            {emoji ?? <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <span className="truncate text-sm font-semibold">{displayName}</span>
          {/* Status pill */}
          {isRunning ? (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              {activity ? phaseLabels[activity.phase] : "Running"}
            </span>
          ) : isBusy ? (
            <button
              type="button"
              onClick={onToggleTaskPanel}
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Users className="h-2.5 w-2.5" />
              Team · {teamTasks.length}
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Ready
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {usage && (
            <div
              className={`hidden md:flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono ${usage.color}`}
              title={t("contextUsage.tooltip", {
                used: usage.used.toLocaleString(),
                max: usage.max.toLocaleString(),
                percent: usage.percent,
                compactions: session?.compactionCount ?? 0,
                lastCompact: lastCompaction ? lastCompaction.toLocaleString() : t("contextUsage.never"),
              })}
            >
              {usage.percent}%
            </div>
          )}
          <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Cài đặt nhanh agent"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          {teamTasks.length > 0 && (
            <button
              type="button"
              onClick={onToggleTaskPanel}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title={taskPanelOpen ? "Đóng task panel" : "Mở task panel"}
            >
              <PanelIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AgentQuickConfigDrawer agentId={agentId} open={configOpen} onClose={() => setConfigOpen(false)} />

      {/* Context usage progress bar */}
      {usage && (
        <div
          className="h-0.5 bg-muted"
          title={`${usage.used.toLocaleString()} / ${usage.max.toLocaleString()} tokens`}
        >
          <div
            className={`h-full transition-all duration-500 ${
              usage.percent >= 90 ? "bg-destructive" : usage.percent >= 75 ? "bg-amber-500" : "bg-primary/40"
            }`}
            style={{ width: `${usage.percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

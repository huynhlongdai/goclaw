import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Bot, ExternalLink, Cpu, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHttp } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import type { AgentData } from "@/types/agent";

interface AgentQuickConfigDrawerProps {
  agentId: string;
  open: boolean;
  onClose: () => void;
}

export function AgentQuickConfigDrawer({ agentId, open, onClose }: AgentQuickConfigDrawerProps) {
  const navigate = useNavigate();
  const http = useHttp();
  const connected = useAuthStore((s) => s.connected);
  const [agent, setAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    if (!open || !connected || !agentId) return;
    http
      .get<{ agents: AgentData[] }>("/v1/agents")
      .then((res) => {
        const found = (res.agents ?? []).find((a) => a.agent_key === agentId);
        setAgent(found ?? null);
      })
      .catch(() => setAgent(null));
  }, [open, http, connected, agentId]);

  const config = agent?.other_config as Record<string, unknown> | undefined;
  const promptMode = (config?.prompt_mode as string) ?? "full";

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-40 w-72 border-l bg-background shadow-xl transition-transform duration-200 ease-in-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted text-base">
              {agent?.emoji ?? <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            <span className="text-sm font-semibold">
              {agent?.display_name ?? agentId}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {agent ? (
            <>
              {/* Model */}
              <ConfigRow
                icon={<Cpu className="h-3.5 w-3.5" />}
                label="Model"
                value={agent.model || "—"}
              />
              {/* Provider */}
              <ConfigRow
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Provider"
                value={agent.provider || "—"}
              />
              {/* Prompt mode */}
              <ConfigRow
                icon={<FileText className="h-3.5 w-3.5" />}
                label="Prompt mode"
                value={<PromptModeBadge mode={promptMode} />}
              />

              {/* Description */}
              {agent.agent_description && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Mô tả</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{agent.agent_description}</p>
                </div>
              )}

              {/* Context window */}
              {agent.context_window > 0 && (
                <ConfigRow
                  icon={<span className="text-[10px] font-mono">ctx</span>}
                  label="Context window"
                  value={`${(agent.context_window / 1000).toFixed(0)}k tokens`}
                />
              )}
            </>
          ) : (
            <div className="flex h-20 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            type="button"
            onClick={() => { navigate(`/agents/${agent?.id ?? agentId}`); onClose(); }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Cài đặt đầy đủ
          </button>
        </div>
      </div>
    </>
  );
}

function ConfigRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xs font-medium text-right max-w-[55%] truncate">
        {typeof value === "string" ? <span className="font-mono">{value}</span> : value}
      </div>
    </div>
  );
}

function PromptModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    full: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    task: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    minimal: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    none: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", colors[mode] ?? colors.none)}>
      {mode}
    </span>
  );
}

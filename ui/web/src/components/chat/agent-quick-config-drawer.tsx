import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Bot, ExternalLink, Cpu, FileText, Zap, Sparkles, Hash, Pencil, KanbanSquare, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHttp } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/stores/use-toast-store";
import { useTasksStore } from "@/stores/use-tasks-store";
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
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const { tasks } = useTasksStore();
  const agentTasks = tasks.filter((t) => t.assignee_id && t.status !== "done" && t.status !== "cancelled" && agent?.id && t.assignee_id === agent.id);

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

  const saveDesc = async () => {
    if (!agent) return;
    try {
      await http.put(`/v1/agents/${agent.id}`, { agent_description: descDraft.trim() || null });
      setAgent((prev) => prev ? { ...prev, agent_description: descDraft.trim() || null } : prev);
      toast.success("Đã cập nhật mô tả");
    } catch { toast.error("Lỗi cập nhật"); }
    setEditingDesc(false);
  };

  const toggleSelfEvolve = async () => {
    if (!agent || agent.agent_type !== "predefined") return;
    const next = !agent.self_evolve;
    try {
      await http.put(`/v1/agents/${agent.id}`, { self_evolve: next });
      setAgent((prev) => prev ? { ...prev, self_evolve: next } : prev);
      toast.success(next ? "Bật Self Evolve" : "Tắt Self Evolve");
    } catch { toast.error("Lỗi cập nhật"); }
  };

  const config = agent?.other_config as Record<string, unknown> | undefined;
  const promptMode = (config?.prompt_mode as string) ?? "full";
  const isCommand = agent?.agent_type === "command";

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
              {agent?.emoji
                ? agent.emoji
                : isCommand
                ? <Terminal className="h-3.5 w-3.5 text-violet-500" />
                : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            <span className="text-sm font-semibold">
              {agent?.display_name ?? agentId}
            </span>
            {isCommand && <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600 dark:text-violet-400">CAO</span>}
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
              {/* Description — editable */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Mô tả</p>
                  {!editingDesc && (
                    <button type="button" onClick={() => { setDescDraft(agent.agent_description ?? ""); setEditingDesc(true); }}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="space-y-2">
                    <textarea autoFocus value={descDraft} onChange={(e) => setDescDraft(e.target.value)} rows={3}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                    <div className="flex gap-1.5">
                      <button type="button" onClick={saveDesc} className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">Lưu</button>
                      <button type="button" onClick={() => setEditingDesc(false)} className="rounded-md border px-2.5 py-1 text-xs hover:bg-accent">Huỷ</button>
                    </div>
                  </div>
                ) : (
                  <p className={cn("text-xs leading-relaxed", agent.agent_description ? "text-foreground/80" : "italic text-muted-foreground/50")}>
                    {agent.agent_description || "Chưa có mô tả. Click ✏ để thêm."}
                  </p>
                )}
              </div>

              {/* Model + Provider */}
              <div className="space-y-1">
                <ConfigRow icon={<Cpu className="h-3.5 w-3.5" />} label="Model"
                  value={<span className="font-mono text-xs">{agent.model?.split("/").pop() ?? "—"}</span>} />
                <ConfigRow icon={<Zap className="h-3.5 w-3.5" />} label="Provider" value={agent.provider || "—"} />
                <ConfigRow icon={<FileText className="h-3.5 w-3.5" />} label="Prompt mode" value={<PromptModeBadge mode={promptMode} />} />
                {agent.context_window > 0 && (
                  <ConfigRow icon={<Hash className="h-3.5 w-3.5" />} label="Context"
                    value={`${(agent.context_window / 1000).toFixed(0)}k`} />
                )}
              </div>

              {/* Self-evolve toggle (predefined agents only) */}
              {agent.agent_type === "predefined" && (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Self Evolve
                  </div>
                  <button type="button" onClick={toggleSelfEvolve}
                    className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none",
                      agent.self_evolve ? "bg-primary" : "bg-muted-foreground/30"
                    )}>
                    <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                      agent.self_evolve ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
              )}

              {/* CAO indicator */}
              {isCommand && (
                <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
                  <Terminal className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Command Agent Orchestrator</span>
                </div>
              )}

              {/* Tasks assigned */}
              {agentTasks.length > 0 && (
                <button type="button"
                  onClick={() => { navigate("/work/tasks"); onClose(); }}
                  className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 hover:bg-accent transition-colors">
                  <KanbanSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs flex-1 text-left">Tasks đang giao</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{agentTasks.length}</span>
                </button>
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

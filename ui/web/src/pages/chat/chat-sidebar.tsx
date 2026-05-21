import { memo, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, MessageSquare, Trash2 } from "lucide-react";
import { AgentSelector } from "@/components/chat/agent-selector";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SessionInfo } from "@/types/session";

interface ChatSidebarProps {
  agentId: string;
  onAgentChange: (agentId: string) => void;
  sessions: SessionInfo[];
  sessionsLoading: boolean;
  activeSessionKey: string;
  onSessionSelect: (key: string) => void;
  onDeleteSession?: (key: string) => void;
  onNewChat: () => void;
}

function sessionLabel(session: SessionInfo): string {
  if (session.metadata?.chat_title) return session.metadata.chat_title;
  if (session.metadata?.display_name) return session.metadata.display_name;
  if (session.label) return session.label;
  const parts = session.key.split(":");
  const scope = parts.length >= 3 ? parts.slice(2).join(":") : session.key;
  if (scope.startsWith("ws:direct:")) return `Chat ${scope.replace("ws:direct:", "").slice(0, 8)}`;
  if (scope.startsWith("ws-")) return `Chat ${scope.split("-").pop() ?? scope}`;
  return scope.length > 24 ? scope.slice(0, 21) + "…" : scope;
}

function groupByDate(sessions: SessionInfo[]): { label: string; items: SessionInfo[] }[] {
  const now = Date.now();
  const DAY = 86_400_000;
  const groups: Record<string, SessionInfo[]> = { today: [], yesterday: [], week: [], older: [] };
  for (const s of sessions) {
    const age = now - new Date(s.updated).getTime();
    if (age < DAY) groups.today!.push(s);
    else if (age < DAY * 2) groups.yesterday!.push(s);
    else if (age < DAY * 7) groups.week!.push(s);
    else groups.older!.push(s);
  }
  return [
    { label: "Hôm nay", items: groups.today! },
    { label: "Hôm qua", items: groups.yesterday! },
    { label: "7 ngày qua", items: groups.week! },
    { label: "Cũ hơn", items: groups.older! },
  ].filter((g) => g.items.length > 0);
}

export const ChatSidebar = memo(function ChatSidebar({
  agentId,
  onAgentChange,
  sessions,
  sessionsLoading,
  activeSessionKey,
  onSessionSelect,
  onDeleteSession,
  onNewChat,
}: ChatSidebarProps) {
  const { t: tc } = useTranslation("common");
  const { t } = useTranslation("chat");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SessionInfo | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => sessionLabel(s).toLowerCase().includes(q));
  }, [sessions, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="flex h-full w-64 max-w-[85vw] flex-col border-r bg-sidebar/80">
      {/* Agent selector */}
      <div className="border-b px-3 py-2.5">
        <AgentSelector value={agentId} onChange={onAgentChange} />
      </div>

      {/* New chat + Search */}
      <div className="flex flex-col gap-2 px-3 py-2.5 border-b">
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-solid transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("newChat")}
        </button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full rounded-md bg-muted/50 pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Session list grouped by date */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {sessionsLoading && sessions.length === 0 ? (
          <div className="space-y-1 px-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            {search ? "Không tìm thấy cuộc trò chuyện" : tc("noSessions")}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </div>
              {group.items.map((session) => {
                const isActive = session.key === activeSessionKey;
                const label = sessionLabel(session);
                return (
                  <button
                    key={session.key}
                    type="button"
                    onClick={() => onSessionSelect(session.key)}
                    className={cn(
                      "group relative mx-2 flex w-[calc(100%-16px)] items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 text-foreground/80 hover:text-foreground",
                    )}
                  >
                    <MessageSquare className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium leading-tight">{label}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span>{session.messageCount} tin nhắn</span>
                        <span>·</span>
                        <span>{formatRelativeTime(session.updated)}</span>
                      </div>
                    </div>
                    {onDeleteSession && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(session); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setDeleteTarget(session); } }}
                        className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 max-sm:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteChat")}</DialogTitle>
            <DialogDescription>{t("deleteChatConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{tc("cancel")}</Button>
            <Button variant="destructive" onClick={() => { if (deleteTarget) { onDeleteSession?.(deleteTarget.key); setDeleteTarget(null); } }}>
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

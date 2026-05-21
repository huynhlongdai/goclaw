import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2, XCircle, Clock, MessageSquare, UserPlus, UserMinus,
  ArrowRight, Zap, AlertCircle, Loader2, RefreshCw, Eye, Trash2, Paperclip,
} from "lucide-react";
import { useWs } from "@/hooks/use-ws";
import { Methods, Events, TEAM_RELATED_EVENTS } from "@/api/protocol";
import { useAuthStore } from "@/stores/use-auth-store";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TeamMemberData } from "@/types/team";

interface FeedItem {
  id: string;
  event_type: string;
  actor_type: "agent" | "human" | "system";
  actor_id?: string;
  task_id?: string;
  task_subject?: string;
  progress_percent?: number;
  progress_step?: string;
  created_at: string;
  isLive?: boolean;
}

interface TeamActivityFeedProps {
  teamId: string;
  members: TeamMemberData[];
}

/* ── Event type metadata ────────────────────────────────────────── */

type EventMeta = {
  label: string;
  icon: React.ElementType;
  color: string;
};

const EVENT_META: Record<string, EventMeta> = {
  [Events.TEAM_TASK_CREATED]:   { label: "tạo task mới",      icon: Zap,          color: "text-blue-500" },
  [Events.TEAM_TASK_CLAIMED]:   { label: "nhận task",         icon: ArrowRight,   color: "text-indigo-500" },
  [Events.TEAM_TASK_DISPATCHED]:{ label: "điều phối task",    icon: ArrowRight,   color: "text-violet-500" },
  [Events.TEAM_TASK_ASSIGNED]:  { label: "giao task",         icon: ArrowRight,   color: "text-violet-500" },
  [Events.TEAM_TASK_PROGRESS]:  { label: "cập nhật tiến độ",  icon: Loader2,      color: "text-amber-500" },
  [Events.TEAM_TASK_COMPLETED]: { label: "hoàn thành task",   icon: CheckCircle2, color: "text-green-500" },
  [Events.TEAM_TASK_REVIEWED]:  { label: "xem xét task",      icon: Eye,          color: "text-sky-500" },
  [Events.TEAM_TASK_APPROVED]:  { label: "duyệt task",        icon: CheckCircle2, color: "text-emerald-500" },
  [Events.TEAM_TASK_REJECTED]:  { label: "từ chối task",      icon: XCircle,      color: "text-red-500" },
  [Events.TEAM_TASK_FAILED]:    { label: "task thất bại",     icon: AlertCircle,  color: "text-destructive" },
  [Events.TEAM_TASK_CANCELLED]: { label: "huỷ task",          icon: XCircle,      color: "text-muted-foreground" },
  [Events.TEAM_TASK_COMMENTED]: { label: "bình luận",         icon: MessageSquare,color: "text-cyan-500" },
  [Events.TEAM_TASK_ATTACHMENT_ADDED]: { label: "đính kèm file", icon: Paperclip, color: "text-teal-500" },
  [Events.TEAM_TASK_DELETED]:   { label: "xoá task",          icon: Trash2,       color: "text-destructive" },
  [Events.TEAM_MEMBER_ADDED]:   { label: "thêm thành viên",   icon: UserPlus,     color: "text-green-500" },
  [Events.TEAM_MEMBER_REMOVED]: { label: "xoá thành viên",    icon: UserMinus,    color: "text-red-500" },
  [Events.TEAM_CREATED]:        { label: "tạo team",          icon: Zap,          color: "text-primary" },
  [Events.TEAM_UPDATED]:        { label: "cập nhật team",     icon: Clock,        color: "text-muted-foreground" },
};

function getEventMeta(eventType: string): EventMeta {
  return EVENT_META[eventType] ?? { label: eventType, icon: Clock, color: "text-muted-foreground" };
}

/* ── Payload helpers ────────────────────────────────────────────── */

function extractFromPayload(payload: unknown): Partial<FeedItem> {
  if (!payload || typeof payload !== "object") return {};
  const p = payload as Record<string, unknown>;
  return {
    task_id:          (p.taskId ?? p.task_id) as string | undefined,
    task_subject:     (p.subject ?? p.taskSubject ?? p.task_subject) as string | undefined,
    actor_id:         (p.agentId ?? p.agent_id ?? p.userId ?? p.user_id) as string | undefined,
    actor_type:       (p.agentId || p.agent_id) ? "agent" : "human",
    progress_percent: p.progressPercent as number | undefined,
    progress_step:    p.progressStep as string | undefined,
  };
}

/* ── Main component ─────────────────────────────────────────────── */

export function TeamActivityFeed({ teamId, members }: TeamActivityFeedProps) {
  const ws = useWs();
  const connected = useAuthStore((s) => s.connected);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const teamIdRef = useRef(teamId);
  teamIdRef.current = teamId;

  /* ── Member name resolver ── */
  const resolveName = useCallback((id?: string): string => {
    if (!id) return "—";
    const m = members.find((m) => m.agent_id === id || m.agent_key === id);
    return m?.display_name ?? m?.agent_key ?? id.slice(0, 8);
  }, [members]);

  /* ── Initial load ── */
  const load = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const res = await ws.call<{ events: FeedItem[]; count: number }>(
        Methods.TEAMS_EVENTS_LIST,
        { team_id: teamId, limit: 60, offset: 0 },
      );
      setItems(res.events ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [ws, connected, teamId]);

  useEffect(() => { void load(); }, [load]);

  /* ── Realtime subscription ── */
  const handleLiveEvent = useCallback((eventType: string) => (payload: unknown) => {
    const p = payload as Record<string, unknown> | null;
    const payloadTeamId = p?.teamId ?? p?.team_id;
    if (payloadTeamId && payloadTeamId !== teamIdRef.current) return;

    const extracted = extractFromPayload(payload);
    const newItem: FeedItem = {
      id: `live-${Date.now()}-${Math.random()}`,
      event_type: eventType,
      actor_type: extracted.actor_type ?? "system",
      actor_id: extracted.actor_id,
      task_id: extracted.task_id,
      task_subject: extracted.task_subject,
      progress_percent: extracted.progress_percent,
      progress_step: extracted.progress_step,
      created_at: new Date().toISOString(),
      isLive: true,
    };
    setItems((prev) => [newItem, ...prev.slice(0, 99)]);
  }, []);

  /* Subscribe to all team-related events with a single effect */
  useEffect(() => {
    const allTeamEvents = [...TEAM_RELATED_EVENTS] as string[];
    const unsubs = allTeamEvents.map((eventType) =>
      ws.on(eventType, (payload: unknown) => handleLiveEvent(eventType)(payload)),
    );
    return () => unsubs.forEach((fn) => fn());
  }, [ws, handleLiveEvent]);

  /* ── Render ─────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải hoạt động…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Hoạt động nhóm
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chưa có hoạt động nào
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item, idx) => {
              const meta = getEventMeta(item.event_type);
              const Icon = meta.icon;
              const actorName = resolveName(item.actor_id);
              const isFirst = idx === 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 text-sm transition-colors",
                    item.isLive && isFirst && "bg-primary/5",
                    "hover:bg-muted/40",
                  )}
                >
                  {/* Icon */}
                  <div className={cn("mt-0.5 shrink-0", meta.color)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-medium text-foreground">{actorName}</span>
                      <span className="text-muted-foreground">{meta.label}</span>
                      {item.task_subject && (
                        <span className="truncate font-medium text-foreground/80">
                          "{item.task_subject}"
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    {item.progress_percent !== undefined && (
                      <div className="mt-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, item.progress_percent)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.progress_percent}%</span>
                        </div>
                        {item.progress_step && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.progress_step}</p>
                        )}
                      </div>
                    )}

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>

                  {/* Live badge */}
                  {item.isLive && isFirst && (
                    <span className="mt-0.5 shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                      mới
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

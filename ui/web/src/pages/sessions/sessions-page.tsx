import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { History, RefreshCw, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useDeferredLoading } from "@/hooks/use-deferred-loading";
import { useUiStore } from "@/stores/use-ui-store";
import { useSessions } from "./hooks/use-sessions";
import { SessionDetailPage } from "./session-detail-page";
import { parseSessionKey } from "@/lib/session-key";
import { formatRelativeTime, formatTokens } from "@/lib/format";
import type { SessionInfo } from "@/types/session";

export function SessionsPage() {
  const { t } = useTranslation("sessions");
  const { key: detailKey } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const globalPageSize = useUiStore((s) => s.pageSize);
  const setGlobalPageSize = useUiStore((s) => s.setPageSize);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(globalPageSize);
  const setPageSize = (size: number) => { setPageSizeRaw(size); setPage(1); setGlobalPageSize(size); };

  const { sessions, total, loading, preview, deleteSession, resetSession, patchSession } = useSessions({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const showSkeleton = useDeferredLoading(loading && sessions.length === 0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const detailSession = detailKey
    ? sessions.find((s) => s.key === decodeURIComponent(detailKey))
    : null;

  if (detailSession && isMobile) {
    return (
      <SessionDetailPage
        session={detailSession}
        onBack={() => navigate("/sessions")}
        onPreview={preview}
        onDelete={async (key) => { await deleteSession(key); navigate("/sessions"); }}
        onReset={resetSession}
        onPatch={patchSession}
      />
    );
  }

  const splitMode = !!detailSession;

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    const meta = s.metadata;
    return (
      s.key.toLowerCase().includes(q) ||
      (s.label ?? "").toLowerCase().includes(q) ||
      (meta?.display_name ?? "").toLowerCase().includes(q) ||
      (meta?.username ?? "").toLowerCase().includes(q) ||
      (meta?.chat_title ?? "").toLowerCase().includes(q)
    );
  });

  const sessionList = (
    <div className={cn(
      "flex flex-col overflow-hidden",
      splitMode ? "h-full" : "",
    )}>
      {/* Search */}
      <div className={cn("shrink-0", splitMode ? "px-3 py-2 border-b" : "mt-4")}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className="w-full"
        />
      </div>

      <div className={cn(splitMode ? "flex-1 overflow-y-auto" : "mt-6")}>
        {showSkeleton ? (
          splitMode ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : <TableSkeleton rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title={search ? t("noMatchTitle") : t("emptyTitle")}
            description={search ? t("noMatchDescription") : t("emptyDescription")}
            size={splitMode ? "sm" : "md"}
          />
        ) : splitMode ? (
          // Compact list for split panel
          <div className="space-y-0.5 p-2">
            {filtered.map((session) => {
              const parsed = parseSessionKey(session.key);
              const title = session.metadata?.chat_title || session.metadata?.display_name || session.label || parsed.scope;
              const isActive = session.key === detailSession?.key;
              return (
                <button
                  key={session.key}
                  type="button"
                  onClick={() => navigate(`/sessions/${encodeURIComponent(session.key)}`)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent",
                    isActive && "bg-accent border border-border/50",
                  )}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{title}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {session.agentName || parsed.agentId} · {formatRelativeTime(session.updated)}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{session.messageCount}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("columns.session")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("columns.agent")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t("columns.context")}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t("columns.messages")}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t("columns.updated")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((session) => (
                  <SessionRow
                    key={session.key}
                    session={session}
                    onClick={() => navigate(`/sessions/${encodeURIComponent(session.key)}`)}
                  />
                ))}
              </tbody>
            </table>
            <Pagination
              page={page} pageSize={pageSize}
              total={total} totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (splitMode) {
    return (
      <div className="flex h-full overflow-hidden">
        {/* Left: session list */}
        <div className="w-72 shrink-0 border-r flex flex-col overflow-hidden bg-sidebar">
          <div className="flex shrink-0 items-center border-b px-3 py-2.5">
            <span className="text-sm font-semibold">{t("title")}</span>
          </div>
          {sessionList}
        </div>
        {/* Right: detail */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <SessionDetailPage
            session={detailSession!}
            onBack={() => navigate("/sessions")}
            onPreview={preview}
            onDelete={async (key) => { await deleteSession(key); navigate("/sessions"); }}
            onReset={resetSession}
            onPatch={patchSession}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-10">
      <PageHeader title={t("title")} description={t("description")} />
      {sessionList}
    </div>
  );
}

function SessionRow({
  session,
  onClick,
}: {
  session: SessionInfo;
  onClick: () => void;
}) {
  const { t } = useTranslation("sessions");
  const parsed = parseSessionKey(session.key);

  return (
    <tr
      className="cursor-pointer border-b transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="text-sm font-medium">
          {session.metadata?.chat_title || session.metadata?.display_name || session.label || parsed.scope}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {session.metadata?.username ? `@${session.metadata.username}` : session.key}
          {session.channel && session.channel !== "ws" && (
            <Badge variant="secondary" className="text-2xs px-1 py-0">{session.channel}</Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline">{session.agentName || parsed.agentId}</Badge>
      </td>
      <td className="px-4 py-3">
        <ContextUsageBar
          estimatedTokens={session.estimatedTokens ?? 0}
          contextWindow={session.contextWindow ?? 0}
          compactionCount={session.compactionCount ?? 0}
          t={t}
        />
      </td>
      <td className="px-4 py-3 text-right text-sm">{session.messageCount}</td>
      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
        {formatRelativeTime(session.updated)}
      </td>
    </tr>
  );
}

/** Inline context usage progress bar with compaction count. */
function ContextUsageBar({
  estimatedTokens,
  contextWindow,
  compactionCount,
  t,
}: {
  estimatedTokens: number;
  contextWindow: number;
  compactionCount: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (contextWindow <= 0) return <span className="text-xs text-muted-foreground">—</span>;

  const threshold = contextWindow * 0.75;
  const pct = Math.min(Math.round((estimatedTokens / threshold) * 100), 100);

  let barColor = "bg-emerald-500";
  if (pct >= 85) barColor = "bg-red-500";
  else if (pct >= 60) barColor = "bg-amber-500";

  const tooltip = `~${formatTokens(estimatedTokens)} / ${formatTokens(contextWindow)} tokens (${pct}%)`;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1">
        <div
          className="h-2 w-full rounded-full bg-muted overflow-hidden"
          title={tooltip}
        >
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-2xs text-muted-foreground">
          <span>{formatTokens(estimatedTokens)} / {formatTokens(contextWindow)}</span>
          {compactionCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5"
              title={t("contextBar.compacted", { count: compactionCount })}
            >
              · <RefreshCw className="h-2.5 w-2.5" />{compactionCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

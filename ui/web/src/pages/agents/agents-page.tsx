import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Plus, Bot, LayoutGrid, List, ArrowLeftRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-media-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { useDeferredLoading } from "@/hooks/use-deferred-loading";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContactResolver } from "@/hooks/use-contact-resolver";
import { useAgents } from "./hooks/use-agents";
import { AgentCard } from "./agent-card";
import { AgentListRow } from "./agent-list-row";
import { AgentCreateDialog } from "./agent-create-dialog";
import { AgentDetailPage } from "./agent-detail/agent-detail-page";
import { SummoningModal } from "./summoning-modal";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";

export function AgentsPage() {
  const { t } = useTranslation("agents");
  const { id: detailId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { agents, loading, createAgent, deleteAgent, refresh, resummonAgent, cancelSummonAgent } = useAgents();
  const showSkeleton = useDeferredLoading(loading && agents.length === 0);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [summoningAgent, setSummoningAgent] = useState<{ id: string; name: string } | null>(null);

  const ownerIDs = useMemo(() => [...new Set(agents.map((a) => a.owner_id).filter(Boolean))], [agents]);
  const { resolve } = useContactResolver(ownerIDs);

  const filtered = useMemo(() => agents.filter((a) => {
    if (ownerFilter && a.owner_id !== ownerFilter) return false;
    if (typeFilter && a.agent_type !== typeFilter) return false;
    const q = search.toLowerCase();
    return a.agent_key.toLowerCase().includes(q) || (a.display_name ?? "").toLowerCase().includes(q);
  }), [agents, ownerFilter, typeFilter, search]);

  const { pageItems, pagination, setPage, setPageSize, resetPage } = usePagination(filtered);
  useEffect(() => { resetPage(); }, [search, ownerFilter, typeFilter, resetPage]);

  const resolveOwnerName = (id: string) => {
    const c = resolve(id);
    return c?.display_name || c?.username || id;
  };

  const handleResummon = async (agent: { id: string; display_name?: string; agent_key: string }) => {
    try {
      await resummonAgent(agent.id);
      setSummoningAgent({ id: agent.id, name: agent.display_name || agent.agent_key });
    } catch { /* handled by hook */ }
  };

  const handleClick = (agent: { id: string; display_name?: string; agent_key: string; status: string }) => {
    if (agent.status === "summoning") {
      setSummoningAgent({ id: agent.id, name: agent.display_name || agent.agent_key });
    } else {
      navigate(`/agents/${agent.id}`);
    }
  };

  // Mobile: full-page detail
  if (detailId && isMobile) {
    return <AgentDetailPage agentId={detailId} onBack={() => navigate("/agents")} />;
  }

  const splitMode = !!detailId; // desktop split-panel when detail is open

  const agentListContent = (
    <>
      {/* Toolbar */}
      <div className={cn("flex flex-wrap items-center gap-2", splitMode ? "px-3 py-2 border-b" : "mt-4")}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
          className={splitMode ? "flex-1 min-w-0" : "max-w-sm"}
        />
        {!splitMode && (
          <>
            <Select value={typeFilter ?? "__all__"} onValueChange={(v) => setTypeFilter(v === "__all__" ? undefined : v)}>
              <SelectTrigger className="h-9 w-36 text-xs"><SelectValue placeholder={t("allTypes", "All Types")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("allTypes", "All Types")}</SelectItem>
                <SelectItem value="open">{t("typeOpen", "Open")}</SelectItem>
                <SelectItem value="predefined">{t("typePredefined", "Predefined")}</SelectItem>
                <SelectItem value="command">Command (CAO)</SelectItem>
              </SelectContent>
            </Select>
            {ownerIDs.length > 0 && (
              <Select value={ownerFilter ?? "__all__"} onValueChange={(v) => setOwnerFilter(v === "__all__" ? undefined : v)}>
                <SelectTrigger className="h-9 w-44 text-xs"><SelectValue placeholder={t("allCreators")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t("allCreators")}</SelectItem>
                  {ownerIDs.map((id) => <SelectItem key={id} value={id}>{resolveOwnerName(id)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <TooltipProvider>
              <div className="ml-auto flex items-center gap-0.5 rounded-md border p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={viewMode === "card" ? "default" : "ghost"} size="xs" className="h-7 w-7 p-0" onClick={() => setViewMode("card")}>
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("viewCard")}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={viewMode === "list" ? "default" : "ghost"} size="xs" className="h-7 w-7 p-0" onClick={() => setViewMode("list")}>
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("viewList")}</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </>
        )}
      </div>

      {/* Agent grid/list */}
      <div className={cn(splitMode ? "flex-1 overflow-y-auto p-2 space-y-1" : "mt-6")}>
        {showSkeleton ? (
          <div className={splitMode ? "space-y-1" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
            {Array.from({ length: splitMode ? 4 : 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bot}
            title={search || ownerFilter || typeFilter ? t("noMatchTitle") : t("emptyTitle")}
            description={search || ownerFilter || typeFilter ? t("noMatchDescription") : t("emptyDescription")}
          />
        ) : splitMode ? (
          // Compact list for split panel
          <div className="space-y-0.5">
            {filtered.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => handleClick(agent)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
                  agent.id === detailId && "bg-accent border border-border/50",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
                  agent.status === "active" ? "bg-primary/10" : "bg-muted",
                )}>
                  {agent.emoji
                    ? <span className="leading-none">{agent.emoji}</span>
                    : <Bot className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 truncate">
                    <span className="truncate text-xs font-medium">{agent.display_name || agent.agent_key}</span>
                    {agent.agent_type === "command" && (
                      <span className="shrink-0 rounded-full bg-violet-500/10 px-1 py-0.5 text-[9px] font-semibold text-violet-600 dark:text-violet-400">CAO</span>
                    )}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground font-mono">{agent.agent_key}</div>
                </div>
                <span className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  agent.status === "active" ? "bg-green-500" : "bg-muted-foreground/30",
                )} />
              </button>
            ))}
          </div>
        ) : (
          <>
            <TooltipProvider>
              {viewMode === "card" ? (
                <motion.div
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  initial="hidden" animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.045 } } }}
                >
                  {pageItems.map((agent) => (
                    <motion.div key={agent.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } } }}>
                      <AgentCard
                        agent={agent}
                        onClick={() => handleClick(agent)}
                        onResummon={() => handleResummon(agent)}
                        onDelete={() => setDeleteTarget({ id: agent.id, name: agent.display_name || agent.agent_key })}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pageItems.map((agent) => (
                    <AgentListRow
                      key={agent.id}
                      agent={agent}
                      ownerName={resolveOwnerName(agent.owner_id)}
                      onClick={() => handleClick(agent)}
                      onResummon={() => handleResummon(agent)}
                      onDelete={() => setDeleteTarget({ id: agent.id, name: agent.display_name || agent.agent_key })}
                    />
                  ))}
                </div>
              )}
            </TooltipProvider>
            <div className="mt-4">
              <Pagination
                page={pagination.page} pageSize={pagination.pageSize}
                total={pagination.total} totalPages={pagination.totalPages}
                onPageChange={setPage} onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </div>
    </>
  );

  const dialogs = (
    <>
      <AgentCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (data) => {
          const created = await createAgent(data);
          refresh();
          if (created && typeof created === "object" && "status" in created && created.status === "summoning") {
            const ag = created as { id: string; display_name?: string; agent_key: string; other_config?: Record<string, unknown> };
            const pm = ag.other_config?.prompt_mode;
            if (pm !== "none" && pm !== "minimal") {
              setSummoningAgent({ id: ag.id, name: ag.display_name || ag.agent_key });
            }
          }
        }}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("delete.title")}
        description={t("delete.deleteWarning")}
        confirmValue={deleteTarget?.name ?? ""}
        onConfirm={async () => {
          if (deleteTarget) { await deleteAgent(deleteTarget.id); setDeleteTarget(null); }
        }}
      />
      {summoningAgent && (
        <SummoningModal
          open={!!summoningAgent}
          onOpenChange={(open) => { if (!open) setSummoningAgent(null); }}
          agentId={summoningAgent.id}
          agentName={summoningAgent.name}
          onCompleted={refresh}
          onResummon={resummonAgent}
          onCancel={cancelSummonAgent}
        />
      )}
    </>
  );

  if (splitMode) {
    return (
      <div className="flex h-full overflow-hidden">
        {/* Left list panel */}
        <div className="w-64 shrink-0 border-r flex flex-col overflow-hidden bg-sidebar">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5">
            <span className="text-sm font-semibold">{t("title")}</span>
            <Button size="xs" onClick={() => setCreateOpen(true)} className="gap-1 h-7">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {agentListContent}
        </div>
        {/* Right detail panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <AgentDetailPage agentId={detailId!} onBack={() => navigate("/agents")} />
        </div>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-10">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/import-export?tab=agents")} className="gap-1">
              <ArrowLeftRight className="h-4 w-4" /> {t("transfer.title")}
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> {t("createAgent")}
            </Button>
          </div>
        }
      />
      {agentListContent}
      {dialogs}
    </div>
  );
}

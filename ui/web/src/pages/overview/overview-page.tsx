import { useEffect, useCallback, lazy, Suspense } from "react";
import { Activity, Bot, DollarSign, Hash, Radio, AlertTriangle, KanbanSquare, Terminal, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/use-auth-store";
import { useWsCall } from "@/hooks/use-ws-call";
import { useWsEvent } from "@/hooks/use-ws-event";
import { useProviders } from "@/pages/providers/hooks/use-providers";
import { useTraces } from "@/pages/traces/hooks/use-traces";
import { Methods, Events } from "@/api/protocol";
import { ROUTES } from "@/lib/constants";
import { formatTokens, formatCost } from "@/lib/format";

import type {
  HealthPayload,
  StatusPayload,
  QuotaUsageResult,
  CronListPayload,
  ChannelStatusPayload,
} from "./types";
import { useLiveUptime } from "./hooks/use-live-uptime";
import { StatCard } from "./stat-card";
import { useOverviewSparklines } from "./hooks/use-overview-sparklines";
import { SystemHealthCard } from "./system-health-card";
import { ConnectedClientsCard } from "./connected-clients-card";
import { CronJobsCard } from "./cron-jobs-card";
import { RecentRequestsCard } from "./recent-requests-card";
import { QuotaUsageCard } from "./quota-usage-card";
import { useRuntimes } from "@/pages/skills/hooks/use-runtimes";
import { useTasksStore } from "@/stores/use-tasks-store";
import {
  getChannelAttentionPriority,
  getChannelStatusFallback,
} from "@/pages/channels/channels-status-view";
import { useChannelInstances } from "@/pages/channels/hooks/use-channel-instances";

const UsagePage = lazy(() =>
  import("@/pages/usage/usage-page").then((m) => ({ default: m.UsagePage })),
);

const REFRESH_INTERVAL = 30_000;
const MAX_OVERVIEW_CHANNEL_INSTANCES = 200;

export function OverviewPage() {
  const { t } = useTranslation("overview");
  const connected = useAuthStore((s) => s.connected);
  const { call: fetchHealth, data: health } =
    useWsCall<HealthPayload>(Methods.HEALTH);
  const { call: fetchStatus, data: status } =
    useWsCall<StatusPayload>(Methods.STATUS);
  const { call: fetchQuota, data: quota } =
    useWsCall<QuotaUsageResult>(Methods.QUOTA_USAGE);
  const sparklines = useOverviewSparklines();
  const { call: fetchCron, data: cronData } =
    useWsCall<CronListPayload>(Methods.CRON_LIST);
  const { call: fetchChannels, data: channelStatusData } =
    useWsCall<ChannelStatusPayload>(Methods.CHANNELS_STATUS);
  const { providers, loading: providersLoading } = useProviders();
  const { runtimes } = useRuntimes();
  const { traces } = useTraces({ limit: 8 });
  const { instances: channelInstances, total: channelInstanceTotal } = useChannelInstances({
    limit: MAX_OVERVIEW_CHANNEL_INSTANCES,
    offset: 0,
  });

  const hasNoProviders = !providersLoading && providers.length === 0;
  const hasNoEnabledProviders =
    !providersLoading &&
    providers.length > 0 &&
    !providers.some((p) => p.enabled);

  const fetchAll = useCallback(() => {
    fetchHealth();
    fetchStatus();
    fetchQuota();
    fetchCron({ includeDisabled: true });
    fetchChannels();
  }, [fetchHealth, fetchStatus, fetchQuota, fetchCron, fetchChannels]);

  useEffect(() => {
    if (!connected) return;
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [connected, fetchAll]);

  const handleHealthEvent = useCallback(() => {
    fetchHealth();
    fetchStatus();
  }, [fetchHealth, fetchStatus]);
  useWsEvent(Events.HEALTH, handleHealthEvent);

  const liveUptime = useLiveUptime(health?.uptime);

  // Computed
  const agents = status?.agents ?? [];
  const runningAgents = agents.filter((a) => a.isRunning).length;
  const agentTotal = status?.agentTotal ?? agents.length;
  const channelStatusMap = channelStatusData?.channels ?? {};
  const canSynthesizeOverviewFallbacks =
    channelInstanceTotal > 0 &&
    channelInstanceTotal <= MAX_OVERVIEW_CHANNEL_INSTANCES &&
    channelInstances.length >= channelInstanceTotal;
  const channelEntries = (() => {
    const combined = new Map(Object.entries(channelStatusMap));
    if (canSynthesizeOverviewFallbacks) {
      for (const instance of channelInstances) {
        if (combined.has(instance.name)) continue;
        const fallback = getChannelStatusFallback(instance);
        if (fallback) {
          combined.set(instance.name, fallback);
        }
      }
    }
    return [...combined.entries()];
  })();
  const totalChannelCount = Math.max(channelEntries.length, channelInstanceTotal);
  const channelsOnline = channelEntries.filter(([, c]) => c.running).length;
  const channelsNeedingAttention = channelEntries.filter(
    ([, c]) => getChannelAttentionPriority(c, c.enabled) > 0,
  ).length;
  const overviewAttentionCount = canSynthesizeOverviewFallbacks
    ? channelsNeedingAttention
    : null;
  const enabledProviders = providers.filter((p) => p.enabled);
  const clientList = health?.clients ?? [];
  const { tasks } = useTasksStore();
  const tasksDone = tasks.filter((t) => t.status === "done").length;
  const tasksOpen = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-2">
            {health?.version && (
              <span className="text-xs text-muted-foreground">
                {health.version}
              </span>
            )}
            {health?.updateAvailable && health.latestVersion && (
              <a
                href={health.updateUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                {health.latestVersion} available
              </a>
            )}
            <StatusBadge
              status={connected ? "success" : "error"}
              label={connected ? t("common:connected", "Connected") : t("common:disconnected", "Disconnected")}
            />
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="usage">{t("tabs.usage")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Provider warning */}
          {(hasNoProviders || hasNoEnabledProviders) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {hasNoProviders
                  ? t("providers.noProvidersTitle")
                  : t("providers.noEnabledTitle")}
              </AlertTitle>
              <AlertDescription>
                {hasNoProviders
                  ? t("providers.noProvidersDesc")
                  : t("providers.noEnabledDesc")}
                <Link
                  to={ROUTES.PROVIDERS}
                  className="font-medium underline underline-offset-4 hover:text-foreground"
                >
                  {t("providers.goToSettings")}
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={Activity}
              label={t("statCards.requestsToday")}
              value={quota?.requestsToday ?? 0}
              sub={
                quota?.uniqueUsersToday
                  ? t("statCards.users", { count: quota.uniqueUsersToday })
                  : undefined
              }
              sparkline={sparklines?.requestSparkline}
              trend={sparklines?.trends.requests}
            />
            <StatCard
              icon={Hash}
              label={t("statCards.tokensToday")}
              value={formatTokens(
                (quota?.inputTokensToday ?? 0) + (quota?.outputTokensToday ?? 0),
              )}
              sub={
                quota
                  ? t("statCards.inOut", { input: formatTokens(quota.inputTokensToday), output: formatTokens(quota.outputTokensToday) })
                  : undefined
              }
              sparkline={sparklines?.tokenSparkline}
              trend={sparklines?.trends.tokens}
            />
            <StatCard
              icon={DollarSign}
              label={t("statCards.costToday", "Cost Today")}
              value={formatCost(quota?.costToday)}
              sparkline={sparklines?.costSparkline}
              trend={sparklines?.trends.cost}
            />
            <StatCard
              icon={Bot}
              label={t("statCards.agents")}
              value={
                agentTotal > 0
                  ? `${runningAgents} / ${agentTotal}`
                  : "0"
              }
              sub={agentTotal > 0 ? t("statCards.running") : undefined}
            />
            <StatCard
              icon={KanbanSquare}
              label="Work Tasks"
              value={tasks.length > 0 ? `${tasksOpen}` : "0"}
              sub={tasks.length > 0 ? `${tasksDone} hoàn thành` : "Chưa có task"}
              href={ROUTES.WORK_TASKS}
            />
            <StatCard
              icon={Radio}
              label={t("statCards.channels")}
              value={
                totalChannelCount > 0
                  ? `${channelsOnline} / ${totalChannelCount}`
                  : "0"
              }
              sub={
                totalChannelCount > 0
                  ? overviewAttentionCount && overviewAttentionCount > 0
                    ? t("statCards.channelsAttention", {
                        defaultValue: "{{count}} need attention",
                        count: overviewAttentionCount,
                      })
                    : t("statCards.online")
                  : undefined
              }
            />
          </div>

          {/* System Health */}
          <SystemHealthCard
            health={health}
            liveUptime={liveUptime}
            enabledProviderCount={enabledProviders.length}
            sessions={status?.sessions ?? 0}
            clientCount={clientList.length}
            channelEntries={channelEntries}
            runtimeEntries={runtimes?.runtimes}
          />

          {/* Connected Clients + Cron Jobs */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ConnectedClientsCard
              clients={clientList}
              currentId={health?.currentId}
            />
            <CronJobsCard jobs={cronData?.jobs ?? []} />
          </div>

          {/* Active Agents mini-grid */}
          {agents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground/80">Agents</h3>
                <Link to={ROUTES.AGENTS} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Xem tất cả →
                </Link>
              </div>
              <AgentsMiniGrid agents={agents} />
            </div>
          )}

          {/* Recent Requests */}
          <RecentRequestsCard traces={traces} />

          {/* Quota Usage */}
          {quota?.enabled && quota.entries.length > 0 && (
            <QuotaUsageCard quota={quota} />
          )}
        </TabsContent>

        <TabsContent value="usage">
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div>}>
            <UsagePage />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AgentStatusItem {
  id: string;
  model?: string;
  emoji?: string;
  display_name?: string;
  isRunning?: boolean;
}

function AgentsMiniGrid({ agents }: { agents: AgentStatusItem[] }) {
  const navigate = useNavigate();
  const shown = agents.slice(0, 12);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shown.map((a) => {
        const isCommand = (a as unknown as { agent_type?: string }).agent_type === "command";
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate(`${ROUTES.AGENTS}/${a.id}`)}
            className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-left hover:border-primary/30 hover:bg-accent transition-all group"
          >
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-base">
                {a.emoji
                  ? <span className="leading-none">{a.emoji}</span>
                  : isCommand
                  ? <Terminal className="h-4 w-4 text-violet-500" />
                  : <Bot className="h-4 w-4 text-muted-foreground" />}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
                a.isRunning ? "bg-blue-500 animate-pulse" : "bg-green-500"
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-medium">{a.display_name || a.id}</span>
                {isCommand && <span className="shrink-0 rounded-full bg-violet-500/10 px-1 text-[9px] font-semibold text-violet-600 dark:text-violet-400">CAO</span>}
              </div>
              {a.isRunning && (
                <div className="flex items-center gap-1 text-[10px] text-blue-500">
                  <Zap className="h-2.5 w-2.5" />
                  Running
                </div>
              )}
              {!a.isRunning && a.model && (
                <div className="truncate text-[10px] text-muted-foreground font-mono">{a.model.split("/").pop()}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

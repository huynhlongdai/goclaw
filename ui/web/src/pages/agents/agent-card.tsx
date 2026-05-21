import { Bot, Star, RotateCcw, Trash2, Sparkles, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AgentData } from "@/types/agent";
import { cn } from "@/lib/utils";
import { UUID_RE, agentDisplayName, hasActiveChatGPTOAuthRouting, readPromptMode } from "./agent-detail/agent-display-utils";
import { promptModeBadgeClass } from "./agent-detail/prompt-mode-badge-utils";

interface AgentCardProps {
  agent: AgentData;
  onClick: () => void;
  onResummon?: () => void;
  onDelete?: () => void;
}

export function AgentCard({ agent, onClick, onResummon, onDelete }: AgentCardProps) {
  const { t } = useTranslation("agents");
  const displayName = agentDisplayName(agent, t("card.unnamedAgent"));
  const selfEvolve = agent.agent_type === "predefined" && Boolean(agent.self_evolve);
  const isCommand = agent.agent_type === "command";
  const emoji = agent.emoji ?? "";
  const hasOAuthRouting = hasActiveChatGPTOAuthRouting(agent.chatgpt_oauth_routing);
  const promptMode = readPromptMode(agent);

  // Show agent_key as subtitle only if there's a display_name and agent_key is meaningful
  const showSubtitle = agent.display_name && !UUID_RE.test(agent.agent_key);

  const isActive = agent.status === "active";
  const isSummoning = agent.status === "summoning";
  const isFailed = agent.status === "summon_failed";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left",
        "transition-all duration-150 hover:shadow-md",
        isActive
          ? "border-primary/20 hover:border-primary/40 hover:shadow-primary/5"
          : "hover:border-border/80",
      )}
    >
      {/* Top row: icon + name + status dot */}
      <div className="flex items-start gap-3">
        {/* Avatar with status dot */}
        <div className="relative shrink-0">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors",
            isActive ? "bg-primary/15" : "bg-muted",
          )}>
            {emoji ? <span className="text-xl leading-none">{emoji}</span> : isCommand ? <Terminal className="h-5 w-5 text-violet-500" /> : <Bot className="h-5 w-5" />}
          </div>
          {/* Status dot */}
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card",
            isActive && "bg-green-500",
            isSummoning && "bg-amber-400 animate-pulse",
            isFailed && "bg-red-500",
            !isActive && !isSummoning && !isFailed && "bg-muted-foreground/30",
          )} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold leading-tight">{displayName}</span>
            {agent.is_default && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
            )}
            {isCommand && (
              <span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">CAO</span>
            )}
          </div>
          {showSubtitle && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{agent.agent_key}</div>
          )}
          {/* Model info inline */}
          {(agent.provider || agent.model) && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground/70">
              {[agent.provider, agent.model].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>

        {/* Status badge — compact */}
        {isSummoning ? (
          <Badge variant="outline" className="shrink-0 animate-pulse border-amber-400/50 text-amber-600 dark:text-amber-400 text-[10px] px-1.5">
            {t("card.summoning")}
          </Badge>
        ) : isFailed ? (
          <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5">
            {t("card.summonFailed")}
          </Badge>
        ) : null}
      </div>

      {/* Expertise summary */}
      {agent.frontmatter && (
        <div className="line-clamp-3 text-xs text-muted-foreground/70">
          {agent.frontmatter}
        </div>
      )}

      {/* Bottom badges */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn("text-xs-plus", promptModeBadgeClass(promptMode))}
            >
              {t(`detail.prompt.mode.${promptMode}`)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-xs">
            {t(`detail.prompt.mode.${promptMode}Desc`)}
          </TooltipContent>
        </Tooltip>
        {agent.agent_type === "predefined" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={selfEvolve ? "default" : "outline"}
                className={`text-xs-plus ${selfEvolve ? "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300" : "text-muted-foreground"}`}
              >
                <Sparkles className="mr-0.5 h-3 w-3" />
                {selfEvolve ? t("card.evolving") : t("card.static")}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-xs">
              {selfEvolve
                ? t("card.evolvingTooltip")
                : t("card.staticTooltip")}
            </TooltipContent>
          </Tooltip>
        )}
        {hasOAuthRouting && (
          <Badge variant="outline" className="text-xs-plus">
            {t("chatgptOAuthRouting.badge")}
          </Badge>
        )}
        {agent.context_window > 0 && (
          <span className="text-xs-plus text-muted-foreground">
            {(agent.context_window / 1000).toFixed(0)}K ctx
          </span>
        )}
        {agent.status === "summon_failed" && onResummon && (
          <Button
            variant="outline"
            size="xs"
            className="ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              onResummon();
            }}
          >
            <RotateCcw className="h-3 w-3" />
            {t("card.resummon")}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="xs"
            className={`text-muted-foreground hover:text-destructive ${agent.status === "summon_failed" && onResummon ? "" : "ml-auto"}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("card.delete")}
          </Button>
        )}
      </div>
    </button>
  );
}

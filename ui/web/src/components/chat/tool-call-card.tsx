import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Wrench, AlertTriangle, ChevronRight, Zap, Bot, ExternalLink } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ToolStreamEntry } from "@/types/chat";

const isSkillTool = (name: string) => name === "use_skill";
const isAgentManageTool = (name: string) => name === "agent_manage";

/** Build a short summary string from tool arguments for inline display. */
function buildToolSummary(entry: ToolStreamEntry): string | null {
  if (!entry.arguments) return null;
  const args = entry.arguments;
  if (isAgentManageTool(entry.name)) {
    const action = args.action as string;
    const key = (args.agent_key ?? args.display_name) as string | undefined;
    return key ? `${action}: ${key}` : action;
  }
  const key = args.path ?? args.command ?? args.query ?? args.url ?? args.name;
  if (typeof key === "string") return key.length > 80 ? key.slice(0, 77) + "..." : key;
  return null;
}

interface ToolCallCardProps {
  entry: ToolStreamEntry;
  /** Compact mode — less padding, used inside merged groups */
  compact?: boolean;
}

export function ToolCallCard({ entry, compact }: ToolCallCardProps) {
  const { t } = useTranslation("common");
  const hasDetails = entry.arguments || entry.result;
  const hasError = entry.phase === "error" && !!entry.errorContent;
  const canExpand = hasDetails || hasError;
  const [expanded, setExpanded] = useState(false);
  const summary = buildToolSummary(entry);
  const skill = isSkillTool(entry.name);
  const displayName = skill ? `skill: ${(entry.arguments?.name as string) || "unknown"}` : entry.name;

  return (
    <div className={compact ? "" : "rounded-md border bg-muted"}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs"
        onClick={() => canExpand && setExpanded((v) => !v)}
        disabled={!canExpand}
      >
        <ToolIcon phase={entry.phase} isSkill={skill} />
        <span className="font-medium shrink-0">{displayName}</span>
        {summary && <span className="truncate text-muted-foreground ml-1">{summary}</span>}
        <span className="ml-auto flex items-center gap-1 shrink-0">
          <PhaseLabel phase={entry.phase} isSkill={skill} />
          {canExpand && (
            <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          )}
        </span>
      </button>
      {expanded && canExpand && (
        <div className="border-t border-muted px-2 py-1.5 space-y-1.5">
          {hasError && (
            <pre className="text-red-500 whitespace-pre-wrap text-xs">{entry.errorContent}</pre>
          )}
          {entry.arguments && Object.keys(entry.arguments).length > 0 && (
            <div>
              <div className="text-2xs font-semibold uppercase text-muted-foreground mb-0.5">{t("toolArguments")}</div>
              <pre className="whitespace-pre-wrap text-xs-plus font-mono bg-background rounded p-1.5 max-h-40 overflow-y-auto">
                {JSON.stringify(entry.arguments, null, 2)}
              </pre>
            </div>
          )}
          {entry.result && (
            <div>
              <div className="text-2xs font-semibold uppercase text-muted-foreground mb-0.5">{t("toolResult")}</div>
              {isAgentManageTool(entry.name)
                ? <AgentManageResult result={entry.result} />
                : (
                  <pre className="whitespace-pre-wrap text-xs-plus font-mono bg-background rounded p-1.5 max-h-40 overflow-y-auto">
                    {entry.result}
                  </pre>
                )
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolIcon({ phase, isSkill }: { phase: ToolStreamEntry["phase"]; isSkill?: boolean }) {
  const cls = "h-3.5 w-3.5";
  if (isSkill) {
    switch (phase) {
      case "calling": return <Zap className={`${cls} animate-pulse text-amber-500`} />;
      case "completed": return <Zap className={`${cls} text-amber-500`} />;
      case "error": return <AlertTriangle className={`${cls} text-red-500`} />;
      default: return <Zap className={`${cls} text-muted-foreground`} />;
    }
  }
  switch (phase) {
    case "calling": return <Wrench className={`${cls} animate-wobble text-blue-500`} />;
    case "completed": return <Wrench className={`${cls} text-blue-500`} />;
    case "error": return <AlertTriangle className={`${cls} text-red-500`} />;
    default: return <Wrench className={`${cls} text-muted-foreground`} />;
  }
}

function PhaseLabel({ phase, isSkill }: { phase: ToolStreamEntry["phase"]; isSkill?: boolean }) {
  const { t } = useTranslation("common");
  const labels: Record<string, string> = isSkill
    ? { calling: t("skillActivating"), completed: t("skillActivated"), error: t("toolFailed") }
    : { calling: t("toolRunning"), completed: t("toolDone"), error: t("toolFailed") };
  const colors: Record<string, string> = {
    calling: "text-blue-500",
    completed: "text-blue-500",
    error: "text-red-500",
  };
  return <span className={`text-xs-plus ${colors[phase] ?? "text-muted-foreground"}`}>{labels[phase] ?? phase}</span>;
}

interface AgentRow {
  agent_key: string;
  display_name?: string;
  emoji?: string;
  model?: string;
  provider?: string;
  status?: string;
  is_default?: boolean;
}

/** Rich result renderer for the agent_manage tool — shows agent cards or operation summary. */
function AgentManageResult({ result }: { result: string }) {
  const navigate = useNavigate();
  let parsed: unknown;
  try { parsed = JSON.parse(result); } catch { /* non-JSON, fall through */ }

  // List of agents
  if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0] as AgentRow).agent_key) {
    const rows = parsed as AgentRow[];
    return (
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {rows.map((a) => (
          <button
            key={a.agent_key}
            type="button"
            onClick={() => navigate(`${ROUTES.AGENTS}`)}
            className="flex w-full items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-left hover:border-primary/30 hover:bg-accent transition-colors"
          >
            <span className="text-base">{a.emoji ?? "🤖"}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{a.display_name ?? a.agent_key}</div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">{a.agent_key} · {a.model?.split("/").pop()}</div>
            </div>
            <span className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              a.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
            )}>
              {a.status ?? "active"}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Single agent result (describe / create / update)
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (obj.message) {
      return (
        <div className="rounded-lg border bg-card px-3 py-2 text-xs">
          {!!obj.agent_key && (
            <div className="flex items-center gap-2 mb-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono font-medium text-primary">{String(obj.agent_key)}</span>
              <button
                type="button"
                onClick={() => navigate(ROUTES.AGENTS)}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
          <p className="text-muted-foreground">{String(obj.message)}</p>
        </div>
      );
    }
    // Describe output
    if (obj.agent_key && obj.model) {
      return (
        <div className="rounded-lg border bg-card px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{(obj.emoji as string) ?? "🤖"}</span>
            <div>
              <div className="text-xs font-semibold">{(obj.display_name as string) ?? (obj.agent_key as string)}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{obj.agent_key as string}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.AGENTS)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
          {!!obj.agent_description && <p className="text-[11px] text-muted-foreground">{String(obj.agent_description)}</p>}
          <div className="text-[10px] text-muted-foreground font-mono">{String(obj.provider)} / {String(obj.model).split("/").pop()}</div>
        </div>
      );
    }
  }

  // Fallback: raw JSON
  return (
    <pre className="whitespace-pre-wrap text-xs-plus font-mono bg-background rounded p-1.5 max-h-40 overflow-y-auto">
      {result}
    </pre>
  );
}

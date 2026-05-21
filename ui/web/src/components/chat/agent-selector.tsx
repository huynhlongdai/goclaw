import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Bot, ChevronDown, Plus, Terminal } from "lucide-react";
import { useHttp } from "@/hooks/use-ws";
import { usePortalDropdownClose } from "@/hooks/use-portal-dropdown-close";
import { useAuthStore } from "@/stores/use-auth-store";
import { ROUTES } from "@/lib/constants";
import type { AgentData } from "@/types/agent";

interface AgentSelectorProps {
  value: string;
  onChange: (agentId: string) => void;
}

/** Extract emoji from agent top-level field */
function agentEmoji(agent: AgentData): string | undefined {
  return agent.emoji || undefined;
}

export function AgentSelector({ value, onChange }: AgentSelectorProps) {
  const { t } = useTranslation("common");
  const http = useHttp();
  const connected = useAuthStore((s) => s.connected);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!connected) return;
    http
      .get<{ agents: AgentData[] }>("/v1/agents")
      .then((res) => {
        const active = (res.agents ?? []).filter((a) => a.status === "active");
        setAgents(active);
      })
      .catch((err) => console.error("[AgentSelector] fetch agents failed:", err));
  }, [http, connected]);

  const navigate = useNavigate();

  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      if (a.agent_type === "command" && b.agent_type !== "command") return -1;
      if (a.agent_type !== "command" && b.agent_type === "command") return 1;
      return (a.display_name || a.agent_key).localeCompare(b.display_name || b.agent_key);
    });
  }, [agents]);

  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [open]);

  usePortalDropdownClose({
    open,
    onClose: () => setOpen(false),
    ignore: [containerRef, dropdownRef],
  });

  const selected = agents.find((a) => a.agent_key === value);
  const selectedEmoji = selected ? agentEmoji(selected) : undefined;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-accent"
      >
        {selectedEmoji ? (
          <span className="text-base shrink-0">{selectedEmoji}</span>
        ) : (
          <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-left font-medium">
          {selected?.display_name ?? selected?.agent_key ?? (value || t("selectAgent"))}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="pointer-events-auto max-h-60 sm:max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {sortedAgents.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t("noAgentsAvailable")}
            </div>
          )}
          {sortedAgents.map((agent) => {
            const emoji = agentEmoji(agent);
            const isCommand = agent.agent_type === "command";
            return (
              <button
                key={agent.agent_key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(agent.agent_key); setOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent ${
                  agent.agent_key === value ? "bg-accent" : ""
                }`}
              >
                {emoji ? (
                  <span className="text-base shrink-0">{emoji}</span>
                ) : isCommand ? (
                  <Terminal className="h-4 w-4 shrink-0 text-violet-500" />
                ) : (
                  <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate text-left">
                  {agent.display_name || agent.agent_key}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {isCommand && (
                    <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">CAO</span>
                  )}
                  {agent.is_default && (
                    <span className="text-xs text-muted-foreground">{t("default")}</span>
                  )}
                </div>
              </button>
            );
          })}
          {/* Create agent shortcut */}
          <div className="mt-1 border-t pt-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setOpen(false); navigate(ROUTES.AGENTS); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Quản lý agents</span>
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

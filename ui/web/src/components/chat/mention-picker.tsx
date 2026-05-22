import { useEffect, useRef } from "react";
import { Bot, Terminal } from "lucide-react";

export interface MentionAgent {
  key: string;
  name: string;
  emoji?: string | null;
  agentType?: string;
}

interface MentionPickerProps {
  query: string;
  agents: MentionAgent[];
  onSelect: (agent: MentionAgent) => void;
  onDismiss: () => void;
}

/**
 * Floating mention picker — shown above the ChatInput when user types `@`.
 * Filters agents by `query` and inserts the chosen agent on click/Enter.
 */
export function MentionPicker({ query, agents, onSelect, onDismiss }: MentionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.key.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 6);

  // Dismiss on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-1 z-50 rounded-xl border bg-popover shadow-lg overflow-hidden"
    >
      <div className="px-2 py-1.5 border-b">
        <span className="text-[11px] text-muted-foreground font-medium">
          Đề cập agent{query ? ` · "${query}"` : ""}
        </span>
      </div>
      <div className="max-h-44 overflow-y-auto py-1">
        {filtered.map((agent) => {
          const isCommand = agent.agentType === "command";
          return (
            <button
              key={agent.key}
              type="button"
              onClick={() => onSelect(agent)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent transition-colors"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                {agent.emoji ? (
                  <span>{agent.emoji}</span>
                ) : isCommand ? (
                  <Terminal className="h-3 w-3 text-violet-500" />
                ) : (
                  <Bot className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-medium">{agent.name}</span>
              <span className="text-xs text-muted-foreground ml-auto font-mono">@{agent.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

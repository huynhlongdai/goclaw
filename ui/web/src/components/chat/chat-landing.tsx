import { useEffect, useState, useMemo } from "react";
import { Bot, Terminal, Sparkles, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHttp } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import type { AgentData } from "@/types/agent";

interface ChatLandingProps {
  onSelect: (agentKey: string) => void;
  onCreateAgent?: () => void;
}

export function ChatLanding({ onSelect, onCreateAgent }: ChatLandingProps) {
  const http = useHttp();
  const connected = useAuthStore((s) => s.connected);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) return;
    setLoading(true);
    http
      .get<{ agents: AgentData[] }>("/v1/agents")
      .then((res) => {
        setAgents((res.agents ?? []).filter((a) => a.status === "active"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [http, connected]);

  const { featured, rest } = useMemo(() => {
    const f = agents.filter((a) => a.agent_type === "command" || a.is_default);
    const r = agents
      .filter((a) => a.agent_type !== "command" && !a.is_default)
      .sort((a, b) => (a.display_name || a.agent_key).localeCompare(b.display_name || b.agent_key));
    return { featured: f, rest: r };
  }, [agents]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-0 overflow-y-auto px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-semibold">Bắt đầu trò chuyện</h2>
          <p className="text-sm text-muted-foreground">
            Chọn agent để bắt đầu — mỗi agent có vai trò, model và quyền hạn riêng
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[72px] rounded-xl border bg-muted/30 animate-pulse" />
              ))}
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 py-10 text-center space-y-2">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chưa có agent nào.</p>
            <p className="text-xs text-muted-foreground">Hãy tạo agent trước ở trang Agents.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured agents (command / default) — full-width prominent cards */}
            {featured.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
                  Đề xuất
                </p>
                {featured.map((agent) => {
                  const isCommand = agent.agent_type === "command";
                  const emoji = agent.emoji;
                  return (
                    <button
                      key={agent.agent_key}
                      type="button"
                      onClick={() => onSelect(agent.agent_key)}
                      className="w-full flex items-center gap-4 rounded-xl border bg-card px-5 py-4 text-left hover:bg-accent hover:border-primary/30 transition-all"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
                        {emoji ? (
                          <span>{emoji}</span>
                        ) : isCommand ? (
                          <Terminal className="h-5 w-5 text-violet-500" />
                        ) : (
                          <Bot className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base">
                            {agent.display_name || agent.agent_key}
                          </span>
                          {isCommand && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 font-medium">
                              Cấp cao
                            </Badge>
                          )}
                          {agent.is_default && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              Mặc định
                            </Badge>
                          )}
                        </div>
                        {agent.agent_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {agent.agent_description}
                          </p>
                        )}
                        {(agent.provider || agent.model) && (
                          <p className="text-[11px] text-muted-foreground/70 font-mono">
                            {[agent.provider, agent.model].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-primary font-medium">Bắt đầu →</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Regular agents grid */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {featured.length > 0 && (
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
                    Tất cả agent
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rest.map((agent) => {
                    const emoji = agent.emoji;
                    return (
                      <button
                        key={agent.agent_key}
                        type="button"
                        onClick={() => onSelect(agent.agent_key)}
                        className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-left hover:bg-accent hover:border-primary/30 transition-all"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                          {emoji ? <span>{emoji}</span> : <Bot className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5 pt-0.5">
                          <span className="font-medium text-sm block truncate">
                            {agent.display_name || agent.agent_key}
                          </span>
                          {agent.agent_description ? (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {agent.agent_description}
                            </p>
                          ) : (agent.model || agent.provider) ? (
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {[agent.provider, agent.model].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Create agent CTA */}
        {onCreateAgent && (
          <div className="border-t pt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Chưa có agent phù hợp?
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={onCreateAgent}
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo Agent mới
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

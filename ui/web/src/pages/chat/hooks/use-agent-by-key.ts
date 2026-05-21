import { useState, useEffect } from "react";
import { useHttp } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import type { AgentData } from "@/types/agent";

export interface AgentSummary {
  agent_key: string;
  display_name: string;
  emoji?: string;
  agent_description?: string | null;
  model?: string;
  provider?: string;
  other_config?: Record<string, unknown>;
}

/** Fetch a lightweight agent summary by agent_key. Returns null while loading. */
export function useAgentByKey(agentKey: string): AgentSummary | null {
  const http = useHttp();
  const connected = useAuthStore((s) => s.connected);
  const [agent, setAgent] = useState<AgentSummary | null>(null);

  useEffect(() => {
    if (!connected || !agentKey) { setAgent(null); return; }
    http
      .get<{ agents: AgentData[] }>("/v1/agents")
      .then((res) => {
        const found = (res.agents ?? []).find((a) => a.agent_key === agentKey);
        if (found) {
          setAgent({
            agent_key: found.agent_key,
            display_name: found.display_name || found.agent_key,
            emoji: found.emoji ?? undefined,
            agent_description: found.agent_description,
            model: found.model,
            provider: found.provider,
            other_config: found.other_config as Record<string, unknown> | undefined,
          });
        } else {
          setAgent({ agent_key: agentKey, display_name: agentKey });
        }
      })
      .catch(() => setAgent({ agent_key: agentKey, display_name: agentKey }));
  }, [http, connected, agentKey]);

  return agent;
}

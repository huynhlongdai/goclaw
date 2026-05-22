import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Settings, Bot, Cpu } from "lucide-react";
import { useAgentByKey } from "@/pages/chat/hooks/use-agent-by-key";
import { useAgents } from "@/pages/agents/hooks/use-agents";
import { uniqueId } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { TeamData } from "@/types/team";

interface TeamLeadAgentSectionProps {
  team: TeamData;
  onChangeLead: (agentId: string) => Promise<void>;
}

export function TeamLeadAgentSection({ team, onChangeLead }: TeamLeadAgentSectionProps) {
  const navigate = useNavigate();
  const leadAgent = useAgentByKey(team.lead_agent_key ?? "");
  const { agents, loading: agentsLoading, refresh } = useAgents();
  const [saving, setSaving] = useState(false);

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const agentOptions = useMemo(
    () =>
      agents
        .filter((a) => a.status === "active")
        .map((a) => ({
          id: a.id,
          key: a.agent_key,
          label: a.display_name || a.agent_key,
          emoji: a.emoji,
          model: a.model,
          provider: a.provider,
        })),
    [agents],
  );

  const handleChangeLead = async (agentId: string) => {
    setSaving(true);
    try {
      await onChangeLead(agentId);
    } finally {
      setSaving(false);
    }
  };

  const handleChat = () => {
    const key = team.lead_agent_key;
    if (!key) return;
    const sessionKey = `agent:${key}:ws:direct:${uniqueId()}`;
    navigate(`${ROUTES.CHAT}/${encodeURIComponent(sessionKey)}`);
  };

  const handleViewSettings = () => {
    if (team.lead_agent_id) {
      navigate(`/agents/${team.lead_agent_id}`);
    }
  };

  const hasLead = !!team.lead_agent_key;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Lead Agent (AI Cấp cao)</span>
        <Select
          value={team.lead_agent_id ?? ""}
          onValueChange={handleChangeLead}
          disabled={saving || agentsLoading}
        >
          <SelectTrigger className="h-7 w-auto min-w-[96px] text-xs gap-1.5">
            <SelectValue placeholder={saving ? "Đang lưu..." : "Đổi Lead"} />
          </SelectTrigger>
          <SelectContent align="end">
            {agentOptions.map((opt) => (
              <SelectItem key={opt.id} value={opt.id} className="gap-2">
                <span className="mr-1">{opt.emoji || "🤖"}</span>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasLead ? (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          {/* Agent identity */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
              {leadAgent?.emoji || <Bot className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {leadAgent?.display_name || team.lead_display_name || team.lead_agent_key}
              </p>
              {leadAgent?.agent_description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {leadAgent.agent_description}
                </p>
              )}
            </div>
          </div>

          {/* Model & provider */}
          {(leadAgent?.model || leadAgent?.provider) && (
            <div className="flex flex-wrap gap-2">
              {leadAgent.provider && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Cpu className="h-3 w-3" />
                  {leadAgent.provider}
                </Badge>
              )}
              {leadAgent.model && (
                <Badge variant="outline" className="text-xs font-mono">
                  {leadAgent.model}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleChat} className="gap-1.5 flex-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat ngay
            </Button>
            {team.lead_agent_id && (
              <Button variant="outline" size="sm" onClick={handleViewSettings} className="gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Cài đặt Agent
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center space-y-2">
          <Bot className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chưa có Lead Agent</p>
          <p className="text-xs text-muted-foreground">
            Chọn một agent cấp cao để làm đầu mối điều phối, nhận yêu cầu và tạo sub-agent.
          </p>
        </div>
      )}
    </div>
  );
}

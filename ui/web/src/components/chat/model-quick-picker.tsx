import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Loader2, Cpu } from "lucide-react";
import { useHttp } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import { usePortalDropdownClose } from "@/hooks/use-portal-dropdown-close";
import { useProviders } from "@/pages/providers/hooks/use-providers";
import { useProviderModels } from "@/pages/providers/hooks/use-provider-models";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/use-toast-store";
import type { AgentData } from "@/types/agent";

interface ModelQuickPickerProps {
  agentId: string;
  /** Called after model successfully updated */
  onUpdated?: (model: string, provider: string) => void;
}

export function ModelQuickPicker({ agentId, onUpdated }: ModelQuickPickerProps) {
  const http = useHttp();
  const connected = useAuthStore((s) => s.connected);
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});

  const { providers } = useProviders();
  const enabledProviders = providers.filter((p) => p.enabled);
  const { models, loading: modelsLoading } = useProviderModels(selectedProvider || undefined);

  // Load agent data
  useEffect(() => {
    if (!connected || !agentId) return;
    http
      .get<{ agents: AgentData[] }>("/v1/agents")
      .then((res) => {
        const found = (res.agents ?? []).find((a) => a.agent_key === agentId);
        if (found) {
          setAgent(found);
          setSelectedProvider(found.provider || "");
        }
      })
      .catch(() => {});
  }, [http, connected, agentId]);

  // Reposition dropdown
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: 260,
      zIndex: 9999,
    });
  }, [open]);

  usePortalDropdownClose({ open, onClose: () => setOpen(false), ignore: [triggerRef, dropdownRef] });

  const handleSelectModel = async (provider: string, model: string) => {
    if (!agent || (provider === agent.provider && model === agent.model)) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      await http.put(`/v1/agents/${agent.id}`, { provider, model });
      setAgent((prev) => prev ? { ...prev, provider, model } : prev);
      onUpdated?.(model, provider);
      setOpen(false);
      toast.success("Model đã cập nhật", `${model.split("/").pop() ?? model}`);
    } catch {
      toast.error("Cập nhật thất bại", "Không thể đổi model");
    } finally {
      setSaving(false);
    }
  };

  const currentModel = agent?.model?.split("/").pop() ?? agent?.model ?? "…";
  const currentProvider = agent?.provider ?? "";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title={`${currentProvider} / ${agent?.model ?? "…"}`}
      >
        {saving ? (
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
        ) : (
          <Cpu className="h-2.5 w-2.5" />
        )}
        <span className="max-w-[120px] truncate">{currentModel}</span>
        <ChevronDown className="h-2.5 w-2.5 shrink-0" />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropStyle}
          className="pointer-events-auto rounded-xl border bg-popover shadow-xl overflow-hidden"
        >
          {/* Provider tabs */}
          <div className="flex gap-0 border-b bg-muted/30 overflow-x-auto">
            {enabledProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSelectedProvider(p.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedProvider === p.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.name || p.id}
              </button>
            ))}
          </div>

          {/* Model list */}
          <div className="max-h-52 overflow-y-auto p-1">
            {modelsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : models.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">Không có model</p>
            ) : (
              models.map((m) => {
                const isActive = selectedProvider === agent?.provider && m.id === agent?.model;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectModel(selectedProvider, m.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                      isActive && "bg-accent",
                    )}
                  >
                    <span className="flex-1 truncate font-mono">{m.id.split("/").pop() ?? m.id}</span>
                    {isActive && <Check className="h-3 w-3 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

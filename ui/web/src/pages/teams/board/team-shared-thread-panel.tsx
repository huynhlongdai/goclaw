import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, MessageSquareDashed, Send, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamData, TeamMemberData } from "@/types/team";

interface TeamSharedThreadPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamData;
  members: TeamMemberData[];
}

/**
 * Phase 5 scaffold — Shared Thread UI shell.
 * Demonstrates the concept of a multi-agent shared conversation thread.
 * Full functionality requires backend WebSocket support for thread events.
 *
 * TODO (v1.5):
 *  - Add Methods.THREAD_MESSAGES_LIST / THREAD_SEND to protocol
 *  - Add useSharedThread() hook for real-time message streaming
 *  - Connect ChatInput with thread session key
 */
export function TeamSharedThreadPanel({
  open,
  onOpenChange,
  team,
  members,
}: TeamSharedThreadPanelProps) {
  const [inputValue, setInputValue] = useState("");

  const namedMembers = members.slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageSquareDashed className="h-4 w-4 text-primary" />
            Thread chung · {team.name}
          </SheetTitle>

          {/* Participants strip */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex -space-x-1.5">
              {namedMembers.map((m) => (
                <div
                  key={m.agent_id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs"
                  title={m.display_name || m.agent_key}
                >
                  {m.display_name?.[0] ?? m.agent_key?.[0] ?? <Bot className="h-3 w-3" />}
                </div>
              ))}
              {members.length > 5 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{members.length} thành viên</span>
          </div>
        </SheetHeader>

        {/* Thread messages area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-4 px-6 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MessageSquareDashed className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-sm">Thread chung sắp ra mắt</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Tính năng này cho phép tất cả agent trong team tham gia cùng một cuộc trò chuyện,
              dễ dàng @mention từng agent theo vai trò.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Lock className="h-3 w-3" />
              Cần backend WebSocket thread API
            </Badge>
            <p className="text-[11px] text-muted-foreground/60">
              Dự kiến: v1.5 — Phase 5 Shared Thread Foundation
            </p>
          </div>
        </div>

        {/* Disabled input preview */}
        <div className="border-t px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 opacity-60">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled
              placeholder="Nhắn tin vào thread (sắp có)..."
              className="flex-1 bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed"
            />
            <Button size="sm" variant="ghost" disabled className="h-7 w-7 p-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground/50">
            Dùng @agent-key để đề cập agent cụ thể
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { memo } from "react";
import { Bot } from "lucide-react";
import { ActivityIndicator } from "./activity-indicator";
import { BlockReplyBubble } from "./block-reply-bubble";
import { ThinkingBlock } from "./thinking-block";
import { StreamingText } from "./streaming-text";
import { ToolCallCard } from "./tool-call-card";
import type { RunActivity, ToolStreamEntry, ChatMessage } from "@/types/chat";

interface ActiveRunZoneProps {
  isRunning: boolean;
  activity: RunActivity | null;
  thinkingText: string | null;
  streamText: string | null;
  toolStream: ToolStreamEntry[];
  blockReplies: ChatMessage[];
}

export const ActiveRunZone = memo(function ActiveRunZone({
  isRunning,
  activity,
  thinkingText,
  streamText,
  toolStream,
  blockReplies,
}: ActiveRunZoneProps) {
  const hasContent =
    blockReplies.length > 0 ||
    toolStream.length > 0 ||
    thinkingText !== null ||
    streamText !== null;

  if (!isRunning && !hasContent) return null;

  return (
    <div className="flex items-start gap-2.5 animate-in fade-in-0 duration-200">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card shadow-xs">
        <Bot className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {blockReplies.map((msg, i) => (
          <BlockReplyBubble key={msg.timestamp ?? i} message={msg} />
        ))}

        {/* Tool cards */}
        {toolStream.length > 0 && (
          <div className="rounded-xl border bg-muted/30 divide-y divide-border overflow-hidden">
            {toolStream.map((entry) => (
              <ToolCallCard key={entry.toolCallId} entry={entry} compact />
            ))}
          </div>
        )}

        {/* Streaming text */}
        {(thinkingText !== null || streamText !== null) && (
          <div className="rounded-2xl rounded-tl-sm border bg-card px-4 py-3 shadow-xs text-card-foreground">
            {thinkingText !== null && (
              <div className={streamText !== null ? "mb-2" : ""}>
                <ThinkingBlock text={thinkingText} isStreaming={isRunning && streamText === null} />
              </div>
            )}
            {streamText !== null && <StreamingText text={streamText} />}
          </div>
        )}

        {(isRunning || activity?.phase === "leader_processing") && (
          <ActivityIndicator activity={activity} isRunning={isRunning} />
        )}
      </div>
    </div>
  );
});

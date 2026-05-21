import { useState, useCallback } from "react";
import { Bot, User, Copy, Check, RotateCcw } from "lucide-react";
import { MessageContent } from "./message-content";
import { ThinkingBlock } from "./thinking-block";
import { ToolCallCard } from "./tool-call-card";
import { BlockReplyBubble } from "./block-reply-bubble";
import { MediaGallery } from "./media-gallery";
import { useUiStore } from "@/stores/use-ui-store";
import { resolveTimezone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title="Sao chép"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const timezone = useUiStore((s) => s.timezone);
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  if (isTool) return null;
  if (message.isNotification) return null;
  if (message.isBlockReply) return <BlockReplyBubble message={message} />;

  const isAssistant = message.role === "assistant";
  const hasThinking = isAssistant && !!message.thinking;
  const hasToolDetails = isAssistant && message.toolDetails && message.toolDetails.length > 0;
  const hasToolCalls = isAssistant && message.tool_calls && message.tool_calls.length > 0;
  const hasContent = !!message.content?.trim();

  if (isAssistant && !hasContent && !hasToolCalls && !hasToolDetails) return null;

  const isToolOnly = isAssistant && !hasContent && !hasThinking && (hasToolDetails || hasToolCalls);

  const timeStr = message.timestamp
    ? new Intl.DateTimeFormat([], {
        timeZone: resolveTimezone(timezone),
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(message.timestamp))
    : null;

  /* ── User message ── */
  if (isUser) {
    return (
      <div className="group flex flex-row-reverse items-end gap-2.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col items-end gap-1 max-w-[78%]">
          <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-sm">
            <MessageContent content={message.content} role={message.role} mediaBasenames={message.mediaItems?.map((m) => m.path.split("/").pop() ?? "").filter(Boolean)} />
            {message.mediaItems && message.mediaItems.length > 0 && (
              <div className="mt-2"><MediaGallery items={message.mediaItems} /></div>
            )}
          </div>
          {timeStr && (
            <span className="text-[10px] text-muted-foreground/60 px-1">{timeStr}</span>
          )}
        </div>
        {/* Hover copy action */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
          <CopyButton text={typeof message.content === "string" ? message.content : ""} />
        </div>
      </div>
    );
  }

  /* ── Tool-only message ── */
  if (isToolOnly) {
    return (
      <div className="flex items-start gap-2.5 animate-in fade-in-0 duration-200">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-muted">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 rounded-xl border bg-muted/30 divide-y divide-border overflow-hidden">
          {hasThinking && (
            <div className="px-3 py-2"><ThinkingBlock text={message.thinking!} /></div>
          )}
          {hasToolDetails && message.toolDetails!.map((entry) => (
            <ToolCallCard key={entry.toolCallId} entry={entry} compact />
          ))}
        </div>
      </div>
    );
  }

  /* ── Assistant message ── */
  return (
    <div className="group flex items-start gap-2.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card shadow-xs">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {hasThinking && <ThinkingBlock text={message.thinking!} />}
        {hasToolDetails && (
          <div className="rounded-xl border bg-muted/30 divide-y divide-border overflow-hidden">
            {message.toolDetails!.map((entry) => (
              <ToolCallCard key={entry.toolCallId} entry={entry} compact />
            ))}
          </div>
        )}
        {hasContent && (
          <div className={cn(
            "rounded-2xl rounded-tl-sm border bg-card px-4 py-3 shadow-xs",
            "text-card-foreground",
          )}>
            <MessageContent
              content={message.content}
              role={message.role}
              mediaBasenames={message.mediaItems?.map((m) => m.path.split("/").pop() ?? "").filter(Boolean)}
            />
            {message.mediaItems && message.mediaItems.length > 0 && (
              <div className="mt-3"><MediaGallery items={message.mediaItems} /></div>
            )}
          </div>
        )}
        {/* Action row: timestamp + copy */}
        <div className="flex items-center gap-1 pl-1">
          {timeStr && (
            <span className="text-[10px] text-muted-foreground/50">{timeStr}</span>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
            <CopyButton text={typeof message.content === "string" ? message.content : ""} />
            <button
              type="button"
              className="flex items-center rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Tạo lại"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

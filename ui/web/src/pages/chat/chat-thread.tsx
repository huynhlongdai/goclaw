import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, ChevronDown } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ActiveRunZone } from "@/components/chat/active-run-zone";
import { SystemNotification } from "@/components/chat/system-notification";
import { TeamActivityPanel } from "@/components/chat/team-activity-panel";
import { ToolCallCard } from "@/components/chat/tool-call-card";
import { ThinkingBlock } from "@/components/chat/thinking-block";
import { ChatImageGalleryProvider } from "@/components/chat/chat-image-gallery-context";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import type { ChatMessage, ToolStreamEntry, RunActivity, ActiveTeamTask } from "@/types/chat";
import type { LightboxImage } from "@/components/shared/image-lightbox";

interface ChatThreadProps {
  messages: ChatMessage[];
  streamText: string | null;
  thinkingText: string | null;
  toolStream: ToolStreamEntry[];
  blockReplies: ChatMessage[];
  activity: RunActivity | null;
  teamTasks: ActiveTeamTask[];
  isRunning: boolean;
  isBusy: boolean;
  loading?: boolean;
  scrollTrigger?: number;
  onToggleTaskPanel?: () => void;
}

/** Check if a message is tool-only (no user-visible text content) */
function isToolOnlyMsg(msg: ChatMessage): boolean {
  if (msg.role !== "assistant") return false;
  const hasContent = !!msg.content?.trim();
  const hasTools = (msg.toolDetails && msg.toolDetails.length > 0) || (msg.tool_calls && msg.tool_calls.length > 0);
  return !hasContent && !!hasTools;
}

type DisplayItem =
  | { kind: "message"; msg: ChatMessage; idx: number }
  | { kind: "notification"; msg: ChatMessage; idx: number }
  | { kind: "merged-tools"; msgs: ChatMessage[]; idx: number };

/** Merge consecutive tool-only assistant messages into single groups */
function buildDisplayItems(messages: ChatMessage[]): DisplayItem[] {
  const filtered = messages.filter(
    (msg) => !(msg.role === "user" && typeof msg.content === "string" && msg.content.startsWith("[System]")),
  );

  const items: DisplayItem[] = [];
  let toolGroup: ChatMessage[] = [];
  let groupStartIdx = 0;

  const flushToolGroup = () => {
    if (toolGroup.length > 0) {
      items.push({ kind: "merged-tools", msgs: toolGroup, idx: groupStartIdx });
      toolGroup = [];
    }
  };

  filtered.forEach((msg, i) => {
    if (msg.isNotification) {
      flushToolGroup();
      items.push({ kind: "notification", msg, idx: i });
    } else if (isToolOnlyMsg(msg)) {
      if (toolGroup.length === 0) groupStartIdx = i;
      toolGroup.push(msg);
    } else {
      flushToolGroup();
      items.push({ kind: "message", msg, idx: i });
    }
  });
  flushToolGroup();

  return items;
}

export const ChatThread = memo(function ChatThread({
  messages, streamText, thinkingText, toolStream, blockReplies,
  activity, teamTasks, isRunning, isBusy, loading, scrollTrigger = 0, onToggleTaskPanel,
}: ChatThreadProps) {
  const { t } = useTranslation("chat");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const { ref, onScroll } = useAutoScroll<HTMLDivElement>(
    [messages.length, streamText, thinkingText, toolStream.length],
    100,
    scrollTrigger,
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll();
    const el = e.currentTarget;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  };

  const scrollToBottom = () => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  };

  const displayItems = useMemo(() => buildDisplayItems(messages), [messages]);

  // Collect all images from all messages for conversation-wide gallery.
  // Sources: mediaItems (attached files) + markdown inline images ![alt](src).
  const allImages = useMemo<LightboxImage[]>(() => {
    const seen = new Set<string>();
    const imgs: LightboxImage[] = [];
    const add = (src: string, alt?: string, fileName?: string, size?: number) => {
      const key = src.split("?")[0] ?? src; // dedupe by path without query params
      if (seen.has(key)) return;
      seen.add(key);
      imgs.push({ src, alt, fileName, size });
    };
    for (const msg of messages) {
      // From mediaItems (attached files)
      if (msg.mediaItems) {
        for (const item of msg.mediaItems) {
          if (item.kind === "image") add(item.path, item.fileName ?? "", item.fileName, item.size);
        }
      }
      // From markdown inline images: ![alt](src)
      if (msg.content) {
        const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match: RegExpExecArray | null;
        while ((match = re.exec(msg.content)) !== null) {
          const alt = match[1] ?? "";
          let src = match[2] ?? "";
          // Resolve relative file paths to API URL
          if (src && !src.startsWith("http") && !src.startsWith("/v1/files/")) {
            src = `/v1/files/${encodeURIComponent(src)}`;
          }
          if (src) add(src, alt, alt || (src.split("/").pop() ?? "image"));
        }
      }
    }
    return imgs;
  }, [messages]);

  if (messages.length === 0 && !isBusy) {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 text-3xl">
          <Bot className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground/80">{t("empty.title")}</p>
          <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
        </div>
      </div>
    );
  }

  return (
    <ChatImageGalleryProvider images={allImages}>
      <div className="relative flex-1 min-h-0">
        <div
          ref={ref}
          onScroll={handleScroll}
          className="h-full overflow-y-auto overscroll-contain px-4 py-6"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {displayItems.map((item) => {
              switch (item.kind) {
                case "notification":
                  return <SystemNotification key={`notif-${item.idx}`} message={item.msg} />;
                case "message":
                  return <MessageBubble key={`msg-${item.idx}`} message={item.msg} />;
                case "merged-tools":
                  return <MergedToolGroup key={`tools-${item.idx}`} msgs={item.msgs} />;
              }
            })}

            {teamTasks.length > 0 && <TeamActivityPanel tasks={teamTasks} onTogglePanel={onToggleTaskPanel} />}

            <ActiveRunZone
              isRunning={isRunning}
              activity={activity}
              thinkingText={thinkingText}
              streamText={streamText}
              toolStream={toolStream}
              blockReplies={blockReplies}
            />
          </div>
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border bg-card/95 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground shadow-md hover:bg-accent hover:text-accent-foreground transition-colors animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Cuộn xuống
          </button>
        )}
      </div>
    </ChatImageGalleryProvider>
  );
});

/** Renders multiple consecutive tool-only messages as a single compact card */
function MergedToolGroup({ msgs }: { msgs: ChatMessage[] }) {
  // Collect all tool details from all messages
  const allTools = msgs.flatMap((msg) => msg.toolDetails ?? []);
  const allThinking = msgs.map((m) => m.thinking).filter(Boolean);

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 rounded-md border bg-muted/30 divide-y divide-border">
        {allThinking.length > 0 && (
          <div className="px-2 py-1.5">
            <ThinkingBlock text={allThinking.join("\n\n")} />
          </div>
        )}
        {allTools.map((entry) => (
          <ToolCallCard key={entry.toolCallId} entry={entry} compact />
        ))}
      </div>
    </div>
  );
}

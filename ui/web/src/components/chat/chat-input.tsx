import { useState, useRef, useCallback, useLayoutEffect, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Send, Square, Paperclip, X, Mic } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

export interface AttachedFile {
  file: File;
  /** Server path after upload, set during send */
  serverPath?: string;
}

interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  onAbort: () => void;
  /** True when main agent or team tasks are active — controls stop button, file attach */
  isBusy: boolean;
  disabled?: boolean;
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
}

export function ChatInput({
  onSend,
  onAbort,
  isBusy,
  disabled,
  files,
  onFilesChange,
}: ChatInputProps) {
  const { t } = useTranslation("common");
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorder = useVoiceRecorder();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVoiceToggle = useCallback(async () => {
    if (voiceRecorder.isRecording) {
      const blob = await voiceRecorder.stopRecording();
      if (blob) {
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        onFilesChange([...files, { file }]);
      }
    } else {
      await voiceRecorder.startRecording();
    }
  }, [voiceRecorder, files, onFilesChange]);

  const handleCancelRecording = useCallback(() => {
    voiceRecorder.cancelRecording();
  }, [voiceRecorder]);

  const handleSend = useCallback(() => {
    if ((!value.trim() && files.length === 0) || disabled) return;
    onSend(value, files.length > 0 ? files : undefined);
    setValue("");
    onFilesChange([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, files, onSend, onFilesChange, disabled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const cmdEnter = (e.metaKey || e.ctrlKey) && e.key === "Enter";
      const plainEnter = e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing;
      if ((cmdEnter || plainEnter) && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, []);

  // Sync textarea height on mount and whenever value changes externally (e.g. after send).
  // Prevents browser's default rows=1 height from leaving a gap above the icons.
  useLayoutEffect(() => {
    handleInput();
  }, [value, handleInput]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: AttachedFile[] = Array.from(selected).map((f) => ({ file: f }));
    onFilesChange([...files, ...newFiles]);
    e.target.value = "";
  }, [files, onFilesChange]);

  const removeFile = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  }, [files, onFilesChange]);

  const hasContent = value.trim().length > 0 || files.length > 0;

  return (
    <div
      className="px-4 pb-4 safe-bottom"
      style={{ paddingBottom: `calc(max(1rem, env(safe-area-inset-bottom)) + var(--keyboard-height, 0px))` }}
    >
      {/* File chips above input */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 px-1">
          {files.map((af, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted border px-2.5 py-1 text-xs"
            >
              <span className="max-w-[140px] truncate">{af.file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="rounded-full p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />

      {/* Floating input container */}
      <div className="rounded-2xl border bg-card/95 backdrop-blur-sm shadow-md transition-shadow focus-within:shadow-lg focus-within:ring-1 focus-within:ring-ring/50">

        {/* Textarea row */}
        <div className="flex items-end px-4 pt-3 pb-1">
          {voiceRecorder.isRecording ? (
            <div className="flex flex-1 items-center gap-3 py-1">
              <div className="flex items-end gap-0.5">
                {[...Array(6)].map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-destructive animate-pulse"
                    style={{ height: `${10 + Math.sin(i * 1.2) * 8}px`, animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
              <span className="text-sm font-mono text-destructive">{formatDuration(voiceRecorder.duration)}</span>
              <span className="text-xs text-muted-foreground">Đang ghi âm…</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={t("sendMessage")}
              disabled={disabled}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50 max-h-[200px]"
            />
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center gap-1 px-3 pb-2.5">
          {/* Left: attach + voice */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleFileSelect}
              disabled={disabled || isBusy || voiceRecorder.isRecording}
              title={t("attachFile")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={voiceRecorder.isRecording ? handleCancelRecording : handleVoiceToggle}
              disabled={disabled || isBusy && !voiceRecorder.isRecording}
              title={voiceRecorder.isRecording ? t("cancelRecording") : t("recordVoice")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                voiceRecorder.isRecording
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              }`}
            >
              {voiceRecorder.isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1" />

          {/* Right: hint + send/stop */}
          {!voiceRecorder.isRecording && !isBusy && (
            <span className="hidden sm:block text-[11px] text-muted-foreground/40 mr-2">
              Enter / ⌘+Enter để gửi · Shift+Enter xuống dòng
            </span>
          )}

          {voiceRecorder.isRecording ? (
            <button
              type="button"
              onClick={handleVoiceToggle}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              title={t("stopRecording")}
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : isBusy ? (
            <div className="flex items-center gap-1">
              {value.trim() && (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={disabled}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
                  title={t("sendFollowUp")}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onAbort}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/20"
                title={t("stopGeneration")}
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!hasContent || disabled}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              title={t("sendMessageTitle")}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

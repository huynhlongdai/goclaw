import { useState } from "react";
import { X } from "lucide-react";
import { useTasksStore } from "@/stores/use-tasks-store";
import { useAgents } from "@/pages/agents/hooks/use-agents";
import type { TaskStatus, TaskPriority } from "@/types/task";
import { TASK_PRIORITY_META, TASK_STATUS_META, KANBAN_COLUMNS } from "@/types/task";
import { cn } from "@/lib/utils";

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: TaskStatus;
}

export function TaskCreateDialog({ open, onOpenChange, initialStatus = "todo" }: TaskCreateDialogProps) {
  const { addTask } = useTasksStore();
  const { agents } = useAgents();
  const activeAgents = agents.filter((a) => a.status === "active");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [assigneeId, setAssigneeId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    const assigneeAgent = activeAgents.find((a) => a.id === assigneeId);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      assignee_type: assigneeAgent ? "agent" : undefined,
      assignee_id: assigneeAgent?.id,
      assignee_name: assigneeAgent ? (assigneeAgent.display_name || assigneeAgent.agent_key) : undefined,
      assignee_emoji: assigneeAgent?.emoji ?? undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    setTitle(""); setDescription(""); setPriority("medium"); setStatus(initialStatus); setAssigneeId(""); setTagsInput(""); setDueDate("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Tạo task mới</h2>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tiêu đề *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề task..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm mô tả chi tiết..."
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mức độ ưu tiên</label>
              <div className="flex flex-col gap-1">
                {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors",
                      priority === p ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", TASK_PRIORITY_META[p].dot)} />
                    {TASK_PRIORITY_META[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Giao cho agent</label>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setAssigneeId("")}
                  className={cn("rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors", !assigneeId ? "bg-accent" : "hover:bg-muted")}
                >
                  Chưa giao
                </button>
                {activeAgents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAssigneeId(a.id)}
                    className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors", assigneeId === a.id ? "bg-accent" : "hover:bg-muted")}
                  >
                    <span>{a.emoji ?? "🤖"}</span>
                    <span className="truncate">{a.display_name || a.agent_key}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trạng thái</label>
              <div className="flex flex-col gap-1">
                {KANBAN_COLUMNS.map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors",
                      status === s ? "bg-accent font-medium" : "hover:bg-muted text-muted-foreground"
                    )}>
                    <span className={cn("h-2 w-2 rounded-full shrink-0",
                      s === "todo" ? "bg-slate-400" : s === "in_progress" ? "bg-blue-500" : s === "in_review" ? "bg-amber-500" : s === "blocked" ? "bg-red-500" : "bg-green-500"
                    )} />
                    {TASK_STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hạn chật</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags (phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="bug, feature, docs..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!title.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Tạo task
          </button>
        </div>
      </div>
    </div>
  );
}

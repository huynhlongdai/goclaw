import { useState, useRef } from "react";
import { X, Flag, Clock, CheckCircle2, CircleDot, Eye, Circle, Trash2, Pencil, Check, AlertOctagon, MessageSquareShare, ListChecks, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksStore } from "@/stores/use-tasks-store";
import { useAgents } from "@/pages/agents/hooks/use-agents";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";
import { TASK_STATUS_META, TASK_PRIORITY_META, KANBAN_COLUMNS } from "@/types/task";

interface TaskDetailDrawerProps {
  task: Task;
  onClose: () => void;
  onDelete: () => void;
  /** Optional: open chat with assigned agent pre-filled with task info */
  onDispatch?: (task: Task) => void;
}

export function TaskDetailDrawer({ task, onClose, onDelete, onDispatch }: TaskDetailDrawerProps) {
  const { updateTask, moveTask } = useTasksStore();
  const { agents } = useAgents();
  const activeAgents = agents.filter((a) => a.status === "active");

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descDraft, setDescDraft] = useState(task.description ?? "");
  const [newCheckItem, setNewCheckItem] = useState("");
  const checkInputRef = useRef<HTMLInputElement>(null);

  const saveTitle = () => {
    if (titleDraft.trim()) updateTask(task.id, { title: titleDraft.trim() });
    setEditingTitle(false);
  };
  const saveDesc = () => {
    updateTask(task.id, { description: descDraft.trim() || undefined });
    setEditingDesc(false);
  };

  const priorityMeta = TASK_PRIORITY_META[task.priority];
  const statusMeta = TASK_STATUS_META[task.status];

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-[420px] max-w-[95vw] border-l bg-background shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-200">

        {/* Header */}
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                  className="flex-1 rounded-md border bg-background px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button type="button" onClick={saveTitle} className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h2 className="font-semibold leading-tight">{task.title}</h2>
                <button type="button" onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                  className="rounded p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-accent transition-all">
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", statusMeta.color, statusMeta.bgColor)}>
                <StatusIcon status={task.status} size="xs" />
                {statusMeta.label}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", priorityMeta.color)}>
                <Flag className="h-2.5 w-2.5" />
                {priorityMeta.label}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mô tả</p>
              {!editingDesc && (
                <button type="button" onClick={() => { setDescDraft(task.description ?? ""); setEditingDesc(true); }}
                  className="rounded p-0.5 text-muted-foreground hover:bg-accent transition-colors">
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Thêm mô tả chi tiết..."
                />
                <div className="flex gap-2">
                  <button type="button" onClick={saveDesc} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Lưu</button>
                  <button type="button" onClick={() => setEditingDesc(false)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">Huỷ</button>
                </div>
              </div>
            ) : (
              <p className={cn("text-sm leading-relaxed", task.description ? "text-foreground/80" : "italic text-muted-foreground/50")}>
                {task.description || "Chưa có mô tả. Click bút chì để thêm."}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Mức ưu tiên</p>
            <div className="flex gap-1.5 flex-wrap">
              {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => {
                const pm = TASK_PRIORITY_META[p];
                return (
                  <button key={p} type="button"
                    onClick={() => updateTask(task.id, { priority: p })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      task.priority === p ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground",
                    )}>
                    <span className={cn("h-2 w-2 rounded-full shrink-0", pm.dot)} />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Trạng thái</p>
            <div className="grid grid-cols-2 gap-1.5">
              {KANBAN_COLUMNS.map((status) => {
                const meta = TASK_STATUS_META[status];
                const isActive = task.status === status;
                return (
                  <button key={status} type="button"
                    onClick={() => moveTask(task.id, status)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs text-left transition-colors",
                      isActive ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-muted text-muted-foreground",
                    )}>
                    <StatusIcon status={status} size="xs" />
                    <span>{meta.label}</span>
                    {isActive && <Check className="ml-auto h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Giao cho agent</p>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              <button type="button"
                onClick={() => updateTask(task.id, { assignee_id: undefined, assignee_name: undefined, assignee_emoji: undefined, assignee_type: undefined })}
                className={cn("rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors", !task.assignee_id ? "bg-accent font-medium" : "hover:bg-muted text-muted-foreground")}>
                Chưa giao
              </button>
              {activeAgents.map((a) => (
                <button key={a.id} type="button"
                  onClick={() => updateTask(task.id, { assignee_type: "agent", assignee_id: a.id, assignee_name: a.display_name || a.agent_key, assignee_emoji: a.emoji ?? undefined })}
                  className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors", task.assignee_id === a.id ? "bg-accent font-medium" : "hover:bg-muted text-muted-foreground")}>
                  <span>{a.emoji ?? "🤖"}</span>
                  <span className="truncate">{a.display_name || a.agent_key}</span>
                  {task.assignee_id === a.id && <Check className="ml-auto h-3 w-3 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Hạn chót</p>
            <input
              type="date"
              value={task.due_date ? task.due_date.slice(0, 10) : ""}
              onChange={(e) => updateTask(task.id, { due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-full"
            />
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Tags</p>
            <input
              type="text"
              defaultValue={task.tags?.join(", ") ?? ""}
              onBlur={(e) => {
                const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                updateTask(task.id, { tags: tags.length > 0 ? tags : undefined });
              }}
              placeholder="bug, feature, docs..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                Checklist
                {(task.checklist_items?.length ?? 0) > 0 && (
                  <span className="text-muted-foreground/70">
                    ({task.checklist_items!.filter((i) => i.done).length}/{task.checklist_items!.length})
                  </span>
                )}
              </p>
            </div>
            {/* Existing items */}
            <div className="space-y-1 mb-2">
              {(task.checklist_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-muted/50">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (task.checklist_items ?? []).map((ci) =>
                        ci.id === item.id ? { ...ci, done: !ci.done } : ci
                      );
                      updateTask(task.id, { checklist_items: updated });
                    }}
                    className={cn("h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors",
                      item.done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"
                    )}
                  >
                    {item.done && <Check className="h-2.5 w-2.5" />}
                  </button>
                  <span className={cn("flex-1 text-xs", item.done && "line-through text-muted-foreground")}>{item.text}</span>
                  <button
                    type="button"
                    onClick={() => updateTask(task.id, { checklist_items: (task.checklist_items ?? []).filter((ci) => ci.id !== item.id) })}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {/* Add new item */}
            <div className="flex items-center gap-2">
              <input
                ref={checkInputRef}
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCheckItem.trim()) {
                    const newItem = { id: Math.random().toString(36).slice(2), text: newCheckItem.trim(), done: false };
                    updateTask(task.id, { checklist_items: [...(task.checklist_items ?? []), newItem] });
                    setNewCheckItem("");
                  }
                }}
                placeholder="Thêm mục… Enter để lưu"
                className="flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                disabled={!newCheckItem.trim()}
                onClick={() => {
                  if (!newCheckItem.trim()) return;
                  const newItem = { id: Math.random().toString(36).slice(2), text: newCheckItem.trim(), done: false };
                  updateTask(task.id, { checklist_items: [...(task.checklist_items ?? []), newItem] });
                  setNewCheckItem("");
                  checkInputRef.current?.focus();
                }}
                className="rounded-lg border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Tạo: {new Date(task.created_at).toLocaleDateString("vi-VN")}</span>
            {task.completed_at && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Xong: {new Date(task.completed_at).toLocaleDateString("vi-VN")}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center gap-2">
          <button type="button" onClick={onDelete}
            className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            Xoá
          </button>
          {task.assignee_id && onDispatch && (
            <button type="button" onClick={() => onDispatch(task)}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors">
              <MessageSquareShare className="h-3.5 w-3.5" />
              Gửi agent
            </button>
          )}
          <button type="button" onClick={onClose}
            className="ml-auto rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}

export function StatusIcon({ status, size = "sm" }: { status: TaskStatus; size?: "xs" | "sm" }) {
  const cls = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  switch (status) {
    case "todo":        return <Circle className={cn(cls, "text-slate-400")} />;
    case "in_progress": return <CircleDot className={cn(cls, "text-blue-500")} />;
    case "in_review":   return <Eye className={cn(cls, "text-amber-500")} />;
    case "blocked":     return <AlertOctagon className={cn(cls, "text-red-500")} />;
    case "done":        return <CheckCircle2 className={cn(cls, "text-green-500")} />;
    case "cancelled":   return <Circle className={cn(cls, "text-muted-foreground")} />;
  }
}

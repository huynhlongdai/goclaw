import { X, Bot, Flag, Clock, CheckCircle2, CircleDot, Eye, Circle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";
import { TASK_STATUS_META, TASK_PRIORITY_META, KANBAN_COLUMNS } from "@/types/task";

interface TaskDetailDrawerProps {
  task: Task;
  onClose: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
}

export function TaskDetailDrawer({ task, onClose, onMove, onDelete }: TaskDetailDrawerProps) {
  const priorityMeta = TASK_PRIORITY_META[task.priority];

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-96 max-w-[90vw] border-l bg-background shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold leading-tight">{task.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", priorityMeta.color)}>
                <Flag className="h-3 w-3" />
                {priorityMeta.label}
              </span>
              {task.tags?.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Mô tả</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {task.assignee_name && (
              <MetaRow label="Giao cho" icon={<Bot className="h-3.5 w-3.5" />}>
                <span>{task.assignee_emoji ?? "🤖"} {task.assignee_name}</span>
              </MetaRow>
            )}
            {task.due_date && (
              <MetaRow label="Hạn" icon={<Clock className="h-3.5 w-3.5" />}>
                {new Date(task.due_date).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}
              </MetaRow>
            )}
            <MetaRow label="Tạo lúc" icon={<Clock className="h-3.5 w-3.5" />}>
              {new Date(task.created_at).toLocaleDateString("vi-VN")}
            </MetaRow>
            {task.completed_at && (
              <MetaRow label="Hoàn thành" icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}>
                {new Date(task.completed_at).toLocaleDateString("vi-VN")}
              </MetaRow>
            )}
          </div>

          {/* Move to */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Chuyển trạng thái</p>
            <div className="flex flex-col gap-1">
              {KANBAN_COLUMNS.map((status) => {
                const meta = TASK_STATUS_META[status];
                const isActive = task.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isActive}
                    onClick={() => onMove(status)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                      isActive ? "bg-accent font-medium" : "hover:bg-muted",
                    )}
                  >
                    <StatusIcon status={status} />
                    <span>{meta.label}</span>
                    {isActive && <span className="ml-auto text-[11px] text-muted-foreground">Hiện tại</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xoá task
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}

function MetaRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className="text-xs font-medium">{children}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case "todo": return <Circle className="h-3.5 w-3.5 text-slate-400" />;
    case "in_progress": return <CircleDot className="h-3.5 w-3.5 text-blue-500" />;
    case "in_review": return <Eye className="h-3.5 w-3.5 text-amber-500" />;
    case "done": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case "cancelled": return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, LayoutGrid, List, Bot, Clock, Trash2, Search, X, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useTasksStore, tasksByStatus } from "@/stores/use-tasks-store";
import type { Task, TaskStatus } from "@/types/task";
import { TASK_STATUS_META, TASK_PRIORITY_META, KANBAN_COLUMNS } from "@/types/task";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskDetailDrawer, StatusIcon } from "./task-detail-drawer";

export function TasksPage() {
  const navigate = useNavigate();
  const { tasks, moveTask, deleteTask } = useTasksStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>("todo");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const openCreate = (status: TaskStatus = "todo") => {
    setCreateInitialStatus(status);
    setCreateOpen(true);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.includes(q))
      );
    }
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, search, priorityFilter]);

  const grouped = useMemo(() => tasksByStatus(filteredTasks), [filteredTasks]);
  const openTasks = filteredTasks.filter((t) => t.status !== "done" && t.status !== "cancelled");

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) moveTask(taskId, status);
    setDragOver(null);
  };

  return (
    <div className="flex min-h-0 h-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-bold">Task Board</h1>
            <p className="text-xs text-muted-foreground">{openTasks.length} task đang mở · {tasks.filter((t) => t.status === "done").length} xong</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn("rounded-md p-1.5 transition-colors", viewMode === "kanban" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")}
              title="Kanban"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn("rounded-md p-1.5 transition-colors", viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")}
              title="Danh sách"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => openCreate("todo")}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Task mới
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2 bg-muted/20">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm task..."
            className="w-full rounded-lg border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {(["all", "urgent", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                priorityFilter === p
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {p === "all" ? "Tất cả" : p === "urgent" ? "⚠ Khẩn" : p === "high" ? "↑ Cao" : p === "medium" ? "= TB" : "↓ Thấp"}
            </button>
          ))}
        </div>
        {(search || priorityFilter !== "all") && (
          <span className="text-[11px] text-muted-foreground">{filteredTasks.length} task</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 && !search && priorityFilter === "all" ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/10">
                <KanbanSquare className="h-8 w-8 text-primary/50" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground/80 text-base">Board trống</h3>
                <p className="mt-1 text-sm text-muted-foreground">Tạo task đầu tiên để bắt đầu quản lý công việc.</p>
              </div>
              <button
                type="button"
                onClick={() => openCreate("todo")}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Tạo task đầu tiên
              </button>
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="flex h-full gap-3 p-4 min-w-max">
            {KANBAN_COLUMNS.map((status) => {
              const meta = TASK_STATUS_META[status];
              const columnTasks = grouped[status] ?? [];
              const isDragOver = dragOver === status;

              return (
                <div
                  key={status}
                  className={cn(
                    "flex w-72 shrink-0 flex-col rounded-xl border transition-colors",
                    isDragOver ? "border-primary/40 bg-primary/5" : status === "blocked" ? "bg-red-500/5" : "bg-muted/30",
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={status} />
                      <span className="text-sm font-semibold">{meta.label}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {columnTasks.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreate(status)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto min-h-0">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={handleDragStart}
                        onClick={() => setSelectedTask(task)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="flex h-16 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground/50">
                        Kéo task vào đây
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ListView tasks={filteredTasks} onSelect={setSelectedTask} onDelete={deleteTask} />
        )}
      </div>

      <TaskCreateDialog open={createOpen} onOpenChange={setCreateOpen} initialStatus={createInitialStatus} />

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={() => { deleteTask(selectedTask.id); setSelectedTask(null); }}
          onDispatch={(t: Task) => {
            setSelectedTask(null);
            navigate(`${ROUTES.CHAT}?agent=${t.assignee_id}&task=${t.id}`);
          }}
        />
      )}
    </div>
  );
}


function TaskCard({ task, onDragStart, onClick, onDelete }: {
  task: Task;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
  onDelete: () => void;
}) {
  const priorityMeta = TASK_PRIORITY_META[task.priority];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="group cursor-pointer rounded-lg border bg-card p-3 shadow-xs hover:shadow-sm hover:border-primary/30 transition-all"
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2 mb-2">
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", priorityMeta.dot)} title={priorityMeta.label} />
        <p className="text-sm font-medium leading-tight line-clamp-2">{task.title}</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
          title="Xoá"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Checklist progress */}
      {task.checklist_items && task.checklist_items.length > 0 && (() => {
        const done = task.checklist_items.filter((i) => i.done).length;
        const total = task.checklist_items.length;
        const pct = Math.round((done / total) * 100);
        return (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{done}/{total}</span>
          </div>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {task.assignee_name && (
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            {task.assignee_emoji ?? ""} {task.assignee_name}
          </span>
        )}
        {task.due_date && (
          <span className="ml-auto flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

function ListView({ tasks, onSelect, onDelete }: {
  tasks: Task[];
  onSelect: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 space-y-1">
      {tasks.filter((t) => t.status !== "cancelled").map((task) => {
        const statusMeta = TASK_STATUS_META[task.status];
        const priorityMeta = TASK_PRIORITY_META[task.priority];
        return (
          <div
            key={task.id}
            onClick={() => onSelect(task)}
            className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/30 hover:bg-accent/30 cursor-pointer transition-all"
          >
            <StatusIcon status={task.status} />
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", priorityMeta.color)}>
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle", priorityMeta.dot)} />
              {priorityMeta.label}
            </span>
            <span className="flex-1 text-sm font-medium truncate">{task.title}</span>
            {task.assignee_name && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Bot className="h-3 w-3" />
                {task.assignee_name}
              </span>
            )}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", statusMeta.color, statusMeta.bgColor)}>
              {statusMeta.label}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="rounded p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

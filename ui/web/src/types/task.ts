export type TaskStatus = "todo" | "in_progress" | "in_review" | "blocked" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskComment {
  id: string;
  content: string;
  author: "user" | "agent";
  author_name?: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_type?: "agent" | "team";
  assignee_id?: string;
  assignee_name?: string;
  assignee_emoji?: string;
  parent_task_id?: string;
  tags?: string[];
  due_date?: string;
  session_key?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  comments?: TaskComment[];
  checklist_items?: ChecklistItem[];
  subtask_ids?: string[];
}

export const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  todo: { label: "Cần làm", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800" },
  in_progress: { label: "Đang chạy", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950" },
  in_review: { label: "Đang review", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950" },
  blocked: { label: "Bị chặn", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950" },
  done: { label: "Xong", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-950" },
  cancelled: { label: "Đã huỷ", color: "text-muted-foreground", bgColor: "bg-muted" },
};

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  low: { label: "Thấp", color: "text-muted-foreground", dot: "bg-slate-400" },
  medium: { label: "Trung bình", color: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  high: { label: "Cao", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  urgent: { label: "Khẩn cấp", color: "text-destructive", dot: "bg-destructive" },
};

export const KANBAN_COLUMNS: TaskStatus[] = ["todo", "in_progress", "in_review", "blocked", "done"];

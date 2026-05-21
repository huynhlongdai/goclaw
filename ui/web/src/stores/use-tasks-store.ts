import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, TaskStatus } from "@/types/task";

interface TasksState {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const DEMO_TASKS: Task[] = [
  {
    id: "demo-1",
    title: "Review báo cáo doanh thu Q2",
    description: "Phân tích số liệu và tóm tắt xu hướng",
    status: "todo",
    priority: "high",
    assignee_type: "agent",
    assignee_name: "Tiểu Hồ",
    tags: ["finance"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Soạn thảo email thông báo",
    description: "Gửi thông báo cập nhật sản phẩm đến khách hàng",
    status: "in_progress",
    priority: "medium",
    assignee_type: "agent",
    assignee_name: "Tiểu Hồ",
    tags: ["marketing"],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "Kiểm tra bug thanh toán",
    description: "Xác nhận lỗi trên flow thanh toán mobile",
    status: "in_review",
    priority: "urgent",
    tags: ["bug", "payment"],
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    title: "Cập nhật documentation API",
    status: "done",
    priority: "low",
    tags: ["docs"],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  },
];

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: DEMO_TASKS,

      addTask: (data) => {
        const now = new Date().toISOString();
        const task: Task = {
          ...data,
          id: genId(),
          created_at: now,
          updated_at: now,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t,
          ),
        }));
      },

      moveTask: (id, status) => {
        const now = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              status,
              updated_at: now,
              ...(status === "in_progress" && !t.started_at ? { started_at: now } : {}),
              ...(status === "done" ? { completed_at: now } : {}),
            };
          }),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },
    }),
    { name: "goclaw:tasks" },
  ),
);

export function tasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!map[t.status]) map[t.status] = [];
    map[t.status]!.push(t);
  }
  return map as Record<TaskStatus, Task[]>;
}

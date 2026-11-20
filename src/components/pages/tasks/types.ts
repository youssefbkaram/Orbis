export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  project: string | null;
  labels: string[];
  dueDate: string | null;
  scheduledDate: string | null;
  reminderAt: string | null;
  location: string | null;
  priority: number;
  completed: boolean;
  sortOrder?: number;
};

export type TaskSubtaskRecord = {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  notes: string | null;
  project: string | null;
  labels: string[];
  scheduledDate: string | null;
  dueDate: string | null;
  reminderAt: string | null;
  location: string | null;
  priority: number;
  completed: boolean;
  sortOrder?: number;
};

export type TaskDragPayload =
  | { kind: "task"; id: string }
  | { kind: "subtask"; id: string; parentId: string };

export type TaskView = "active" | "scheduled" | "unscheduled" | "completed";

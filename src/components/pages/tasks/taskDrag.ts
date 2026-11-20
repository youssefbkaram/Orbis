import type { TaskDragPayload } from "./types";

const taskDragType = "application/x-orbis-task";

export function writeTaskDrag(
  transfer: DataTransfer,
  payload: TaskDragPayload,
) {
  transfer.effectAllowed = "move";
  transfer.setData(taskDragType, JSON.stringify(payload));
}

export function readTaskDrag(transfer: DataTransfer): TaskDragPayload | null {
  try {
    const value: unknown = JSON.parse(transfer.getData(taskDragType));
    if (
      typeof value === "object" &&
      value !== null &&
      "kind" in value &&
      "id" in value &&
      (value.kind === "task" || value.kind === "subtask") &&
      typeof value.id === "string" &&
      (value.kind === "task" ||
        ("parentId" in value && typeof value.parentId === "string"))
    ) {
      if (value.kind === "task") {
        return { kind: "task", id: value.id };
      }
      if ("parentId" in value && typeof value.parentId === "string") {
        return { kind: "subtask", id: value.id, parentId: value.parentId };
      }
    }
    return null;
  } catch {
    return null;
  }
}

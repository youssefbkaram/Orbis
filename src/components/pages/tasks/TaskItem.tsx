"use client";

import { ChevronDown, Flag, GitBranch, GripVertical, Inbox } from "lucide-react";
import { useState, type CSSProperties, type DragEvent } from "react";
import { setTaskSubtaskCompleted } from "@/app/(main)/tasks/actions";
import type { TaskDragPayload, TaskRecord, TaskSubtaskRecord } from "./types";
import { readTaskDrag, writeTaskDrag } from "./taskDrag";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  index: number;
  saving: boolean;
  task: TaskRecord;
  subtasks: TaskSubtaskRecord[];
  groupTaskIds: string[];
  onOpen: (task: TaskRecord) => void;
  onCompleted: (id: string, completed: boolean) => Promise<void>;
  onSubtasksChange: (taskId: string, subtasks: TaskSubtaskRecord[]) => void;
  onDropOnTask: (
    payload: TaskDragPayload,
    targetTaskId: string,
    edge: "before" | "inside" | "after",
    groupTaskIds: string[],
    targetDate: string | null,
  ) => void;
  onDropOnSubtask: (
    payload: TaskDragPayload,
    targetSubtaskId: string,
    parentTaskId: string,
    subtaskIds: string[],
    before: boolean,
  ) => void;
  onError: (message: string) => void;
};

export function TaskItem({
  index,
  saving,
  task,
  subtasks,
  groupTaskIds,
  onOpen,
  onCompleted,
  onSubtasksChange,
  onDropOnTask,
  onDropOnSubtask,
  onError,
}: Props) {
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<Set<string>>(
    () => new Set(),
  );
  const [dropEdge, setDropEdge] = useState<"before" | "inside" | "after" | null>(
    null,
  );
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length;

  async function handleChange(completed: boolean) {
    setPending(true);
    try {
      await onCompleted(task.id, completed);
    } finally {
      setPending(false);
    }
  }

  async function handleSubtaskChange(
    subtask: TaskSubtaskRecord,
    completed: boolean,
  ) {
    const updated = subtasks.map((item) =>
      item.id === subtask.id ? { ...item, completed } : item,
    );
    setPendingSubtasks((current) => new Set(current).add(subtask.id));
    onSubtasksChange(task.id, updated);
    try {
      await setTaskSubtaskCompleted(task.id, subtask.id, completed);
    } catch {
      onSubtasksChange(
        task.id,
        subtasks.map((item) =>
          item.id === subtask.id
            ? { ...item, completed: subtask.completed }
            : item,
        ),
      );
      onError("Could not update this sub-task. Please try again.");
    } finally {
      setPendingSubtasks((current) => {
        const next = new Set(current);
        next.delete(subtask.id);
        return next;
      });
    }
  }

  function getDropEdge(event: DragEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientY - bounds.top) / bounds.height;
    if (position < 0.28) return "before" as const;
    if (position > 0.72) return "after" as const;
    return "inside" as const;
  }

  function handleTaskDragOver(event: DragEvent<HTMLLIElement>) {
    if (!Array.from(event.dataTransfer.types).includes("application/x-orbis-task")) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropEdge(getDropEdge(event));
  }

  function handleTaskDrop(event: DragEvent<HTMLLIElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDropEdge(null);
    const payload = readTaskDrag(event.dataTransfer);
    if (!payload || payload.id === task.id) return;
    onDropOnTask(
      payload,
      task.id,
      getDropEdge(event),
      groupTaskIds,
      task.scheduledDate,
    );
  }

  function handleSubtaskDrop(
    event: DragEvent<HTMLLIElement>,
    subtask: TaskSubtaskRecord,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const payload = readTaskDrag(event.dataTransfer);
    if (!payload || payload.id === subtask.id) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    onDropOnSubtask(
      payload,
      subtask.id,
      task.id,
      subtasks.map((item) => item.id),
      event.clientY < bounds.top + bounds.height / 2,
    );
  }

  return (
    <li
      className={`${styles.taskRow}${pending || saving ? ` ${styles.taskRowPending}` : ""}${subtasks.length ? ` ${styles.taskRowHasSubtasks}` : ""}${dropEdge ? ` ${styles[`taskDrop${dropEdge[0].toUpperCase()}${dropEdge.slice(1)}`]}` : ""}`}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDropEdge(null);
        }
      }}
      onDragOver={handleTaskDragOver}
      onDrop={handleTaskDrop}
      style={{ "--row-index": index } as CSSProperties}
    >
      <div className={styles.taskRowLine}>
        <div className={styles.taskMain}>
          <button
            aria-label={`Drag task ${task.title}`}
            className={styles.taskDragHandle}
            draggable
            onDragEnd={() => setDropEdge(null)}
            onDragStart={(event) => {
              writeTaskDrag(event.dataTransfer, { kind: "task", id: task.id });
              const row = event.currentTarget.closest(`.${styles.taskRow}`);
              if (row instanceof HTMLElement) {
                const bounds = row.getBoundingClientRect();
                event.dataTransfer.setDragImage(
                  row,
                  event.clientX - bounds.left,
                  event.clientY - bounds.top,
                );
              }
            }}
            type="button"
          >
            <GripVertical aria-hidden="true" size={16} />
          </button>
          {subtasks.length > 0 ? (
            <button
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} sub-tasks for ${task.title}`}
              className={styles.taskSubtaskToggle}
              onClick={() => setExpanded((value) => !value)}
              type="button"
            >
              <ChevronDown
                aria-hidden="true"
                className={expanded ? "" : styles.taskSubtaskToggleCollapsed}
                size={13}
              />
            </button>
          ) : (
            <span aria-hidden="true" className={styles.taskSubtaskToggleSpacer} />
          )}
          <input
            aria-label={`Mark “${task.title}” ${task.completed ? "active" : "complete"}`}
            checked={task.completed}
            className={`${styles.checkbox}${task.completed ? ` ${styles.checkboxCompleted}` : ""}`}
            data-priority={`p${task.priority}`}
            disabled={pending}
            onChange={(event) => void handleChange(event.target.checked)}
            type="checkbox"
          />
          <button
            className={styles.taskOpen}
            onClick={() => onOpen(task)}
            type="button"
          >
            <span className={styles.taskOpenHeading}>
              <span className={`${styles.taskTitle}${task.completed ? ` ${styles.completedTask}` : ""}`}>
                {task.title}
              </span>
              {task.project && <span className={styles.project}>{task.project}</span>}
            </span>
            {subtasks.length > 0 && (
              <span className={styles.taskSubtaskCount}>
                <GitBranch aria-hidden="true" size={12} />
                <span>{completedSubtasks}/{subtasks.length}</span>
              </span>
            )}
          </button>
        </div>
        <button
          aria-label={`Open details for ${task.title}`}
          className={styles.taskMetaOpen}
          onClick={() => onOpen(task)}
          type="button"
        >
          <span className={styles.taskMeta}>
            {saving && <span className={styles.savingLabel}>Saving…</span>}
            {!task.project && (
              <span className={styles.inboxLabel}>
                <span>Inbox</span>
                <Inbox aria-hidden="true" size={11} />
              </span>
            )}
            {task.dueDate && task.dueDate !== task.scheduledDate && (
              <span className={task.priority <= 2 ? styles.priorityDue : styles.due}>
                {task.priority <= 2 && <Flag aria-hidden="true" size={13} />}
                Due {formatDate(task.dueDate)}
              </span>
            )}
          </span>
        </button>
      </div>
      {expanded && subtasks.length > 0 && (
        <ul
          aria-label={`Sub-tasks for ${task.title}`}
          className={styles.taskInlineSubtasks}
        >
          {subtasks.map((subtask) => (
            <li
              className={styles.taskInlineSubtask}
              key={subtask.id}
              onDragOver={(event) => {
                if (Array.from(event.dataTransfer.types).includes("application/x-orbis-task")) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(event) => handleSubtaskDrop(event, subtask)}
            >
              <button
                aria-label={`Drag sub-task ${subtask.title}`}
                className={styles.subtaskDragHandle}
                draggable
                onDragStart={(event) => {
                  writeTaskDrag(event.dataTransfer, {
                    kind: "subtask",
                    id: subtask.id,
                    parentId: task.id,
                  });
                  const row = event.currentTarget.closest(
                    `.${styles.taskInlineSubtask}`,
                  );
                  if (row instanceof HTMLElement) {
                    const bounds = row.getBoundingClientRect();
                    event.dataTransfer.setDragImage(
                      row,
                      event.clientX - bounds.left,
                      event.clientY - bounds.top,
                    );
                  }
                }}
                type="button"
              >
                <GripVertical aria-hidden="true" size={15} />
              </button>
              <input
                aria-label={`Mark “${subtask.title}” ${subtask.completed ? "active" : "complete"}`}
                checked={subtask.completed}
                disabled={pendingSubtasks.has(subtask.id)}
                onChange={(event) =>
                  void handleSubtaskChange(subtask, event.target.checked)
                }
                type="checkbox"
              />
              <button
                className={`${styles.taskInlineSubtaskTitle}${subtask.completed ? ` ${styles.taskInlineSubtaskCompleted}` : ""}`}
                onClick={() => onOpen(task)}
                type="button"
              >
                {subtask.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

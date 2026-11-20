import { Plus } from "lucide-react";
import type { DragEvent } from "react";
import type { TaskRecord, TaskSubtaskRecord } from "./types";
import type { TaskDragPayload } from "./types";
import { readTaskDrag } from "./taskDrag";
import { TaskItem } from "./TaskItem";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  title: string;
  summary: string;
  dropDate: string | null;
  tasks: TaskRecord[];
  savingIds: Set<string>;
  subtasksByTask: Record<string, TaskSubtaskRecord[]>;
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
  onDropOnGroup: (
    payload: TaskDragPayload,
    dropDate: string | null,
    taskIds: string[],
  ) => void;
  onOpen: (task: TaskRecord) => void;
  onAddTask: (date: string) => void;
  onError: (message: string) => void;
};

export function TaskGroup({
  title,
  summary,
  dropDate,
  tasks,
  savingIds,
  subtasksByTask,
  onCompleted,
  onSubtasksChange,
  onDropOnTask,
  onDropOnSubtask,
  onDropOnGroup,
  onOpen,
  onAddTask,
  onError,
}: Props) {
  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.currentTarget.classList.remove(styles.taskGroupDragOver);
    const payload = readTaskDrag(event.dataTransfer);
    if (!payload) return;
    onDropOnGroup(payload, dropDate, tasks.map((item) => item.id));
  }

  return (
    <section
      aria-labelledby={`group-${slugify(title)}`}
      className={styles.taskGroup}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("application/x-orbis-task")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          event.currentTarget.classList.add(styles.taskGroupDragOver);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          event.currentTarget.classList.remove(styles.taskGroupDragOver);
        }
      }}
      onDrop={handleDrop}
    >
      <div className={styles.groupHeader}>
        <div className={styles.groupTitle}>
          <h2 id={`group-${slugify(title)}`}>{title}</h2>
        </div>
        {summary && <span className={styles.groupSummary}>{summary}</span>}
      </div>
      <ul className={styles.taskList}>
        {tasks.map((item, index) => (
          <TaskItem
            index={index}
            key={item.id}
            saving={savingIds.has(item.id)}
            subtasks={subtasksByTask[item.id] ?? []}
            groupTaskIds={tasks.map((groupTask) => groupTask.id)}
            onCompleted={onCompleted}
            onSubtasksChange={onSubtasksChange}
            onDropOnTask={onDropOnTask}
            onDropOnSubtask={onDropOnSubtask}
            onOpen={onOpen}
            onError={onError}
            task={item}
          />
        ))}
      </ul>
      {dropDate && (
        <button
          className={styles.groupAddTask}
          onClick={() => onAddTask(dropDate)}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          <span>Add task</span>
        </button>
      )}
    </section>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
}

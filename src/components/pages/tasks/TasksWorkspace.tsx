"use client";

import { ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  autoScheduleTasks,
  demoteTaskToSubtask,
  deleteTask as deleteTaskAction,
  getTaskSubtasks,
  moveSubtaskToTask,
  promoteSubtaskToTask,
  reorderSubtasks,
  reorderTasks,
  setTaskCompleted,
} from "@/app/(main)/tasks/actions";
import type {
  TaskDragPayload,
  TaskRecord,
  TaskSubtaskRecord,
  TaskView,
} from "./types";
import { TaskComposer } from "./TaskComposer";
import { TaskDetailsDialog } from "./TaskDetailsDialog";
import { TaskFilters } from "./TaskFilters";
import { TaskGroup } from "./TaskGroup";
import { TaskToast, type TaskToastMessage } from "./TaskToast";
import { TaskViewTabs } from "./TaskViewTabs";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  initialTasks: TaskRecord[];
  initialSubtasks: TaskSubtaskRecord[];
  today: string;
};

type PendingDelete = {
  taskId: string;
  expiresAt: number;
};

const pendingDeletesKey = "orbis:pending-task-deletes";

export function TasksWorkspace({ initialTasks, initialSubtasks, today }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [subtasksByTask, setSubtasksByTask] = useState(() =>
    groupSubtasks(initialSubtasks),
  );
  const [selectedView, setSelectedView] = useState<TaskView>("active");
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInitialDate, setComposerInitialDate] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<TaskToastMessage | null>(null);
  const toastRef = useRef<TaskToastMessage | null>(null);
  const completionOperations = useRef(new Map<string, Promise<void>>());
  const deleteOperations = useRef(new Map<string, Promise<void>>());
  const restoredPendingDeletes = useRef(false);

  const restoreDeletedTask = useCallback((deletedTask: TaskRecord, index: number) => {
    setTasks((current) => {
      if (current.some((item) => item.id === deletedTask.id)) return current;
      const restored = [...current];
      restored.splice(Math.min(index, restored.length), 0, deletedTask);
      return restored;
    });
  }, []);

  const commitPendingDelete = useCallback((
    taskId: string,
    deletedTask: TaskRecord,
    deletedTaskIndex: number,
  ) => {
    const existing = deleteOperations.current.get(taskId);
    if (existing) return existing;
    const operation = deleteTaskAction(taskId)
      .then(() => {
        setTasks((current) => current.filter((item) => item.id !== taskId));
        try {
          removePendingDelete(taskId);
        } catch {
          setMessage("The task was deleted, but its Undo state could not be cleared.");
        }
      })
      .catch(() => {
        restoreDeletedTask(deletedTask, deletedTaskIndex);
        try {
          removePendingDelete(taskId);
          setMessage("Could not delete this task. Please try again.");
        } catch {
          setMessage("Could not delete the task or clear its pending Undo state.");
        }
      })
      .finally(() => deleteOperations.current.delete(taskId));
    deleteOperations.current.set(taskId, operation);
    return operation;
  }, [restoreDeletedTask]);

  useEffect(() => {
    function openTaskFromHash() {
      const taskId = new URLSearchParams(window.location.hash.slice(1)).get("task");
      if (taskId && initialTasks.some((item) => item.id === taskId)) {
        queueMicrotask(() => setSelectedTaskId(taskId));
      }
    }
    openTaskFromHash();
    window.addEventListener("hashchange", openTaskFromHash);

    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key.toLowerCase() !== "n" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (target instanceof HTMLElement &&
          (target.isContentEditable ||
            target.matches("input, textarea, select, [role='textbox']")))
      ) {
        return;
      }

      event.preventDefault();
      setComposerInitialDate(null);
      setComposerOpen(true);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener("hashchange", openTaskFromHash);
    };
  }, [initialTasks]);

  useEffect(() => {
    if (restoredPendingDeletes.current) return;
    restoredPendingDeletes.current = true;
    const timer = window.setTimeout(() => {
      let pendingDeletes: PendingDelete[];
      try {
        pendingDeletes = readPendingDeletes();
      } catch {
        setMessage("Could not restore a pending deletion from this browser session.");
        return;
      }

      for (const pendingDelete of pendingDeletes) {
        const taskId = pendingDelete.taskId;
        const deletedTaskIndex = initialTasks.findIndex((item) => item.id === taskId);
        const deletedTask = initialTasks[deletedTaskIndex];
        if (!deletedTask) {
          try {
            removePendingDelete(taskId);
          } catch {
            setMessage("Could not clear an expired task deletion from this browser session.");
          }
          continue;
        }

        const remainingMs = pendingDelete.expiresAt - Date.now();
        if (remainingMs <= 0) {
          void commitPendingDelete(taskId, deletedTask, deletedTaskIndex);
          continue;
        }

        setTasks((current) => current.filter((item) => item.id !== taskId));
        showToast({
          id: taskId,
          message: "Task deleted",
          kind: "success",
          durationMs: remainingMs,
          onUndo: () => {
            try {
              removePendingDelete(taskId);
              restoreDeletedTask(deletedTask, deletedTaskIndex);
            } catch {
              setMessage("Could not preserve Undo in this browser session.");
            }
          },
          onExpire: () => commitPendingDelete(taskId, deletedTask, deletedTaskIndex),
        });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [commitPendingDelete, initialTasks, restoreDeletedTask]);

  const counts = useMemo(
    () => ({
      active: tasks.filter((task) => !task.completed).length,
      scheduled: tasks.filter((task) => !task.completed && task.scheduledDate).length,
      unscheduled: tasks.filter((task) => !task.completed && !task.scheduledDate).length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks],
  );
  const projects = useMemo(
    () =>
      [...new Set(tasks.map((task) => task.project).filter((value): value is string => Boolean(value)))].sort(),
    [tasks],
  );
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      const matchesView =
        selectedView === "completed"
          ? task.completed
          : !task.completed &&
            (selectedView === "active" ||
              (selectedView === "scheduled" && Boolean(task.scheduledDate)) ||
              (selectedView === "unscheduled" && !task.scheduledDate));
      const matchesProject = !project || task.project === project;
      const matchesPriority = !priorityOnly || task.priority < 4;
      const matchesSearch =
        !query ||
        task.title.toLocaleLowerCase().includes(query) ||
        task.project?.toLocaleLowerCase().includes(query);
      return matchesView && matchesProject && matchesPriority && matchesSearch;
    });
  }, [tasks, selectedView, search, project, priorityOnly]);

  const groups = useMemo(
    () => getGroups(filteredTasks, today, selectedView),
    [filteredTasks, today, selectedView],
  );
  const selectedTask = tasks.find((item) => item.id === selectedTaskId);
  const selectedTaskIndex = selectedTask
    ? filteredTasks.findIndex((item) => item.id === selectedTask.id)
    : -1;

  async function handleAutoSchedule() {
    setScheduling(true);
    setMessage("");
    try {
      const scheduled = await autoScheduleTasks();
      const scheduledById = new Map(
        scheduled.map((item) => [item.id, item.scheduledDate]),
      );
      setTasks((current) =>
        current.map((item) =>
          scheduledById.has(item.id)
            ? { ...item, scheduledDate: scheduledById.get(item.id) ?? null }
            : item,
        ),
      );
      setMessage(
        scheduled.length
          ? `Scheduled ${scheduled.length} ${scheduled.length === 1 ? "task" : "tasks"} on consecutive upcoming dates.`
          : "There are no unscheduled active tasks.",
      );
    } catch {
      setMessage("Could not schedule tasks. Please try again.");
    } finally {
      setScheduling(false);
    }
  }

  function showToast(nextToast: TaskToastMessage) {
    if (toastRef.current?.onExpire) void toastRef.current.onExpire();
    toastRef.current = nextToast;
    setToast(nextToast);
  }

  function dismissToast(id: string, commit: boolean) {
    const activeToast = toastRef.current;
    if (!activeToast || activeToast.id !== id) return;
    if (commit && activeToast.onExpire) void activeToast.onExpire();
    toastRef.current = null;
    setToast(null);
  }

  function persistCompletion(id: string, completed: boolean) {
    const previous = completionOperations.current.get(id) ?? Promise.resolve();
    const operation = previous
      .catch(() => undefined)
      .then(() => setTaskCompleted(id, completed));
    completionOperations.current.set(id, operation);
    return operation.finally(() => {
      if (completionOperations.current.get(id) === operation) {
        completionOperations.current.delete(id);
      }
    });
  }

  async function handleCompleted(id: string, completed: boolean) {
    const previous = tasks.find((item) => item.id === id);
    if (!previous || previous.completed === completed) return;
    setTasks((current) =>
      current.map((item) => (item.id === id ? { ...item, completed } : item)),
    );
    setMessage("");
    const toastId = crypto.randomUUID();
    if (completed) {
      showToast({
        id: toastId,
        message: "Task completed",
        kind: "success",
        onUndo: async () => {
          setTasks((current) =>
            current.map((item) =>
              item.id === id ? { ...item, completed: previous.completed } : item,
            ),
          );
          try {
            await persistCompletion(id, previous.completed);
          } catch {
            setTasks((current) =>
              current.map((item) =>
                item.id === id ? { ...item, completed: true } : item,
              ),
            );
            setMessage("Could not undo task completion. Please try again.");
          }
        },
      });
    } else if (toastRef.current?.message === "Task completed") {
      dismissToast(toastRef.current.id, false);
    }

    try {
      await persistCompletion(id, completed);
    } catch {
      setTasks((current) =>
        current.map((item) =>
          item.id === id ? { ...item, completed: previous.completed } : item,
        ),
      );
      if (completed) dismissToast(toastId, false);
      setMessage("Could not update this task. Please try again.");
    }

  }

  function handleTaskUpdated(updatedTask: TaskRecord) {
    setTasks((current) =>
      current.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
    );
    setMessage("");
  }

  function openTask(taskId: string) {
    setSelectedTaskId(taskId);
    window.history.replaceState(null, "", `/tasks#task=${encodeURIComponent(taskId)}`);
  }

  function closeTask(refreshSubtasks = true) {
    const closingTaskId = selectedTaskId;
    setSelectedTaskId(null);
    window.history.replaceState(null, "", "/tasks");
    if (refreshSubtasks && closingTaskId) {
      void getTaskSubtasks(closingTaskId)
        .then((items) => {
          setSubtasksByTask((current) => ({ ...current, [closingTaskId]: items }));
        })
        .catch(() => {
          setMessage("Could not refresh this task’s sub-tasks.");
        });
    }
  }

  async function handleDuplicateTask(duplicate: TaskRecord) {
    setTasks((current) => [duplicate, ...current]);
    setSelectedTaskId(duplicate.id);
    window.history.replaceState(null, "", `/tasks#task=${encodeURIComponent(duplicate.id)}`);
  }

  async function handleDeleteTask(taskId: string) {
    const deletedTaskIndex = tasks.findIndex((item) => item.id === taskId);
    const deletedTask = tasks[deletedTaskIndex];
    if (!deletedTask) return;

    const pendingDelete = { taskId, expiresAt: Date.now() + 5000 };
    try {
      writePendingDeletes([...readPendingDeletes(), pendingDelete]);
    } catch {
      setMessage("Could not start Undo because browser session storage is unavailable.");
      return;
    }

    setTasks((current) => current.filter((item) => item.id !== taskId));
    closeTask(false);
    setMessage("");
    const toastId = crypto.randomUUID();
    showToast({
      id: toastId,
      message: "Task deleted",
      kind: "success",
      durationMs: 5000,
      onUndo: () => {
        try {
          removePendingDelete(taskId);
          restoreDeletedTask(deletedTask, deletedTaskIndex);
        } catch {
          setMessage("Could not preserve Undo in this browser session.");
        }
      },
      onExpire: () => commitPendingDelete(taskId, deletedTask, deletedTaskIndex),
    });
  }

  function showActivity(message: string) {
    showToast({
      id: crypto.randomUUID(),
      message,
      kind: "info",
    });
  }

  function handleCreated(task: TaskRecord) {
    setSavingIds((current) => new Set(current).add(task.id));
    setTasks((current) => [task, ...current]);
    setMessage("");
  }

  function handleSaved(id: string) {
    setSavingIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function handleCreateFailed(id: string, error: string) {
    handleSaved(id);
    setTasks((current) => current.filter((task) => task.id !== id));
    setMessage(error);
  }

  function reorderTaskInGroup(
    payload: Extract<TaskDragPayload, { kind: "task" }>,
    orderedIds: string[],
    scheduledDate: string | null,
  ) {
    const previousTasks = tasks;
    setTasks((current) =>
      orderTaskRecords(current, orderedIds, payload.id, scheduledDate),
    );
    setMessage("");
    void reorderTasks({
      taskIds: orderedIds,
      movedTaskId: payload.id,
      scheduledDate,
    }).catch(() => {
      setTasks(previousTasks);
      setMessage("Could not move this task. Please try again.");
    });
  }

  async function handleDemoteTask(
    sourceTaskId: string,
    targetTaskId: string,
  ) {
    if (sourceTaskId === targetTaskId) return;
    const source = tasks.find((item) => item.id === sourceTaskId);
    if (!source) return;
    const previousTasks = tasks;
    const previousSubtasks = subtasksByTask;
    const movedChildren = subtasksByTask[sourceTaskId] ?? [];
    const optimistic: TaskSubtaskRecord = {
      id: source.id,
      taskId: targetTaskId,
      title: source.title,
      description: source.description,
      notes: source.notes,
      project: source.project,
      labels: source.labels,
      scheduledDate: source.scheduledDate,
      dueDate: source.dueDate,
      reminderAt: source.reminderAt,
      location: source.location,
      priority: source.priority,
      completed: source.completed,
    };
    setTasks((current) => current.filter((item) => item.id !== sourceTaskId));
    setSubtasksByTask((current) => ({
      ...current,
      [targetTaskId]: [...(current[targetTaskId] ?? []), optimistic, ...movedChildren],
      [sourceTaskId]: [],
    }));
    if (selectedTaskId === sourceTaskId) {
      setSelectedTaskId(null);
      window.history.replaceState(null, "", "/tasks");
    }
    setMessage("");
    try {
      await demoteTaskToSubtask(sourceTaskId, targetTaskId);
      const refreshed = await getTaskSubtasks(targetTaskId);
      setSubtasksByTask((current) => ({ ...current, [targetTaskId]: refreshed }));
    } catch {
      setTasks(previousTasks);
      setSubtasksByTask(previousSubtasks);
      setMessage("Could not make this task a sub-task. Please try again.");
    }
  }

  async function handlePromoteSubtask(
    subtaskId: string,
    parentTaskId: string,
    scheduledDate: string | null,
    orderedTaskIds?: string[],
    newTaskId = crypto.randomUUID(),
  ) {
    const sourceSubtasks = subtasksByTask[parentTaskId] ?? [];
    const subtask = sourceSubtasks.find((item) => item.id === subtaskId);
    if (!subtask) return;
    const previousTasks = tasks;
    const previousSubtasks = subtasksByTask;
    const optimisticTask: TaskRecord = {
      id: newTaskId,
      title: subtask.title,
      description: subtask.description,
      notes: subtask.notes,
      project: subtask.project,
      labels: subtask.labels,
      dueDate: subtask.dueDate,
      scheduledDate,
      reminderAt: subtask.reminderAt,
      location: subtask.location,
      priority: subtask.priority,
      completed: subtask.completed,
      sortOrder: orderedTaskIds?.indexOf(newTaskId) ?? 0,
    };
    setSubtasksByTask((current) => ({
      ...current,
      [parentTaskId]: (current[parentTaskId] ?? []).filter(
        (item) => item.id !== subtaskId,
      ),
    }));
    setTasks((current) => {
      const next = [...current];
      next.push(optimisticTask);
      return next;
    });
    setMessage("");
    try {
      const promoted = await promoteSubtaskToTask(
        subtaskId,
        parentTaskId,
        scheduledDate,
        newTaskId,
      );
      setTasks((current) =>
        current.map((item) => (item.id === newTaskId ? promoted : item)),
      );
      if (orderedTaskIds) {
        setTasks((current) =>
          orderTaskRecords(current, orderedTaskIds, newTaskId, scheduledDate),
        );
        try {
          await reorderTasks({
            taskIds: orderedTaskIds,
            movedTaskId: newTaskId,
            scheduledDate,
          });
        } catch {
          setMessage("Sub-task moved, but its new position could not be saved.");
        }
      }
      void getTaskSubtasks(parentTaskId)
        .then((refreshed) =>
          setSubtasksByTask((current) => ({
            ...current,
            [parentTaskId]: refreshed,
          })),
        )
        .catch(() => {
          setMessage("Sub-task moved, but its previous task could not be refreshed.");
        });
    } catch {
      setTasks(previousTasks);
      setSubtasksByTask(previousSubtasks);
      setMessage("Could not move this sub-task out of its task. Please try again.");
    }
  }

  async function handleDropOnTask(
    payload: TaskDragPayload,
    targetTaskId: string,
    edge: "before" | "inside" | "after",
    groupTaskIds: string[],
    targetDate: string | null,
  ) {
    if (payload.kind === "task") {
      if (edge === "inside") {
        await handleDemoteTask(payload.id, targetTaskId);
        return;
      }
      const order = groupTaskIds.filter((id) => id !== payload.id);
      const targetIndex = order.indexOf(targetTaskId);
      const insertionIndex = Math.max(
        0,
        targetIndex + (edge === "after" ? 1 : 0),
      );
      order.splice(insertionIndex, 0, payload.id);
      reorderTaskInGroup(payload, order, targetDate);
      return;
    }

    if (edge === "inside") {
      if (payload.parentId === targetTaskId) return;
      const previousSubtasks = subtasksByTask;
      const sourceSubtask = previousSubtasks[payload.parentId]?.find(
        (item) => item.id === payload.id,
      );
      if (!sourceSubtask) return;
      setSubtasksByTask((current) => ({
        ...current,
        [payload.parentId]: (current[payload.parentId] ?? []).filter(
          (item) => item.id !== payload.id,
        ),
        [targetTaskId]: [...(current[targetTaskId] ?? []), {
          ...sourceSubtask,
          taskId: targetTaskId,
        }],
      }));
      try {
        await moveSubtaskToTask(payload.id, payload.parentId, targetTaskId);
      } catch {
        setSubtasksByTask(previousSubtasks);
        setMessage("Could not move this sub-task. Please try again.");
      }
      return;
    }

    const newTaskId = crypto.randomUUID();
    const orderedTaskIds = groupTaskIds.filter((id) => id !== payload.id);
    const targetIndex = orderedTaskIds.indexOf(targetTaskId);
    orderedTaskIds.splice(
      Math.max(0, targetIndex + (edge === "after" ? 1 : 0)),
      0,
      newTaskId,
    );
    await handlePromoteSubtask(
      payload.id,
      payload.parentId,
      targetDate,
      orderedTaskIds,
      newTaskId,
    );
  }

  async function handleDropOnSubtask(
    payload: TaskDragPayload,
    targetSubtaskId: string,
    parentTaskId: string,
    subtaskIds: string[],
    before: boolean,
  ) {
    if (payload.kind === "task") {
      await handleDemoteTask(payload.id, parentTaskId);
      return;
    }
    if (payload.parentId !== parentTaskId) {
      await handleDropOnTask(payload, parentTaskId, "inside", [], null);
      return;
    }
    if (payload.id === targetSubtaskId) return;
    const orderedIds = subtaskIds.filter((id) => id !== payload.id);
    const targetIndex = orderedIds.indexOf(targetSubtaskId);
    orderedIds.splice(Math.max(0, targetIndex + (before ? 0 : 1)), 0, payload.id);
    const previous = subtasksByTask[parentTaskId] ?? [];
    const next: TaskSubtaskRecord[] = [];
    orderedIds.forEach((id, sortOrder) => {
      const item = previous.find((subtask) => subtask.id === id);
      if (item) next.push({ ...item, sortOrder });
    });
    setSubtasksByTask((current) => ({ ...current, [parentTaskId]: next }));
    try {
      await reorderSubtasks(parentTaskId, orderedIds);
    } catch {
      setSubtasksByTask((current) => ({ ...current, [parentTaskId]: previous }));
      setMessage("Could not reorder sub-tasks. Please try again.");
    }
  }

  function handleDropOnGroup(
    payload: TaskDragPayload,
    dropDate: string | null,
    targetTaskIds: string[],
  ) {
    if (payload.kind === "task") {
      const orderedIds = targetTaskIds.filter((id) => id !== payload.id);
      orderedIds.push(payload.id);
      const taskDate =
        dropDate === null && tasks.find((item) => item.id === payload.id)?.completed
          ? tasks.find((item) => item.id === payload.id)?.scheduledDate ?? null
          : dropDate;
      reorderTaskInGroup(payload, orderedIds, taskDate);
      return;
    }
    const newTaskId = crypto.randomUUID();
    void handlePromoteSubtask(
      payload.id,
      payload.parentId,
      dropDate,
      [...targetTaskIds, newTaskId],
      newTaskId,
    );
  }

  return (
    <div className={styles.page} key="tasks-page">
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.subtitle}>
            Your tasks, organized around what needs to get done.
          </p>
        </div>
        <div
          className={`${styles.pageActions}${composerOpen ? ` ${styles.pageActionsComposer}` : ""}`}
        >
          <TaskFilters
            onPriorityChange={setPriorityOnly}
            onProjectChange={setProject}
            onSearchChange={setSearch}
            priorityOnly={priorityOnly}
            project={project}
            projects={projects}
            search={search}
          />
          {!composerOpen && (
            <button
              aria-expanded={composerOpen}
              className={styles.newTaskButton}
              onClick={() => {
                setComposerInitialDate(null);
                setComposerOpen(true);
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              <span>New Task</span>
              <kbd>N</kbd>
            </button>
          )}
          <TaskComposer
            onOpenChange={setComposerOpen}
            onCreated={handleCreated}
            onCreateFailed={handleCreateFailed}
            initialDate={composerInitialDate}
            onSaved={handleSaved}
            open={composerOpen}
            today={today}
          />
        </div>
      </header>

      <div className={styles.viewBar}>
        <TaskViewTabs
          counts={counts}
          onSelect={setSelectedView}
          selected={selectedView}
        />
        <button
          className={styles.autoSchedule}
          aria-busy={scheduling}
          disabled={scheduling || counts.unscheduled === 0}
          onClick={() => void handleAutoSchedule()}
          type="button"
        >
          <Sparkles aria-hidden="true" size={14} />
          <span>{counts.unscheduled} unscheduled</span>
          <span className={styles.viewDivider}>·</span>
          <span className={styles.autoScheduleAction}>
            {scheduling ? "Scheduling…" : "Auto-schedule"}
          </span>
          <ArrowUpRight aria-hidden="true" className={styles.autoScheduleArrow} size={13} />
        </button>
      </div>

      {message && (
        <p aria-live="polite" className={styles.statusMessage} role="status">
          {message}
        </p>
      )}

      {groups.length > 0 ? (
        <div className={styles.taskGroups}>
          {groups.map((group) => (
            <TaskGroup
              key={group.title}
              dropDate={group.dropDate}
              onCompleted={handleCompleted}
              onOpen={(item) => openTask(item.id)}
              onAddTask={(date) => {
                setComposerInitialDate(date);
                setComposerOpen(true);
              }}
              onError={setMessage}
              onDropOnGroup={handleDropOnGroup}
              onDropOnSubtask={handleDropOnSubtask}
              onDropOnTask={handleDropOnTask}
              savingIds={savingIds}
              subtasksByTask={subtasksByTask}
              onSubtasksChange={(taskId, subtasks) =>
                setSubtasksByTask((current) => ({
                  ...current,
                  [taskId]: subtasks,
                }))
              }
              tasks={group.tasks}
              title={group.title}
              summary={group.summary}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>{tasks.length === 0 ? "Your task list is ready" : "No tasks found"}</h2>
          <p>
            {tasks.length === 0
              ? "Create your first task to start building your personal plan."
              : "Try another view or clear some filters."}
          </p>
        </div>
      )}
      {toast && !selectedTask && (
        <TaskToast key={toast.id} onDismiss={dismissToast} toast={toast} />
      )}
      {selectedTask && (
        <TaskDetailsDialog
          key={selectedTask.id}
          today={today}
          canGoPrevious={selectedTaskIndex > 0}
          canGoNext={selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length - 1}
          onPrevious={() => {
            if (selectedTaskIndex > 0) openTask(filteredTasks[selectedTaskIndex - 1].id);
          }}
          onNext={() => {
            if (selectedTaskIndex >= 0 && selectedTaskIndex < filteredTasks.length - 1) {
              openTask(filteredTasks[selectedTaskIndex + 1].id);
            }
          }}
          onClose={closeTask}
          onUpdated={handleTaskUpdated}
          onDuplicate={handleDuplicateTask}
          onDelete={handleDeleteTask}
          onActivity={showActivity}
          onCompletionChange={handleCompleted}
          onToastDismiss={dismissToast}
          toast={toast}
          task={selectedTask}
        />
      )}
    </div>
  );
}

function groupSubtasks(subtasks: TaskSubtaskRecord[]) {
  return subtasks.reduce<Record<string, TaskSubtaskRecord[]>>((groups, subtask) => {
    (groups[subtask.taskId] ??= []).push(subtask);
    return groups;
  }, {});
}

function readPendingDeletes(): PendingDelete[] {
  const raw = window.sessionStorage.getItem(pendingDeletesKey);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) {
    throw new Error("Pending task deletion data is invalid.");
  }
  return value.map((item): PendingDelete => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("taskId" in item) ||
      typeof item.taskId !== "string" ||
      !("expiresAt" in item) ||
      typeof item.expiresAt !== "number" ||
      !Number.isSafeInteger(item.expiresAt)
    ) {
      throw new Error("Pending task deletion data is invalid.");
    }
    return { taskId: item.taskId, expiresAt: item.expiresAt };
  });
}

function writePendingDeletes(pendingDeletes: PendingDelete[]) {
  window.sessionStorage.setItem(pendingDeletesKey, JSON.stringify(pendingDeletes));
}

function removePendingDelete(taskId: string) {
  const remaining = readPendingDeletes().filter((item) => item.taskId !== taskId);
  if (remaining.length) writePendingDeletes(remaining);
  else window.sessionStorage.removeItem(pendingDeletesKey);
}

function orderTaskRecords(
  tasks: TaskRecord[],
  orderedIds: string[],
  movedTaskId: string,
  scheduledDate: string | null,
) {
  const orderedSet = new Set(orderedIds);
  const orderedItems: TaskRecord[] = [];
  orderedIds.forEach((id, sortOrder) => {
    const item = tasks.find((candidate) => candidate.id === id);
    if (item) {
      orderedItems.push({
        ...item,
        sortOrder,
        ...(id === movedTaskId ? { scheduledDate } : {}),
      });
    }
  });
  const firstGroupIndex = tasks.findIndex((item) => orderedSet.has(item.id));
  const insertAt = Math.max(
    0,
    firstGroupIndex -
      tasks
        .slice(0, Math.max(firstGroupIndex, 0))
        .filter((item) => orderedSet.has(item.id)).length,
  );
  const next = tasks.filter((item) => !orderedSet.has(item.id));
  next.splice(insertAt, 0, ...orderedItems);
  return next;
}

function getGroups(tasks: TaskRecord[], today: string, view: TaskView) {
  const dateBuckets = new Map<string, TaskRecord[]>();
  const buckets = new Map<string, TaskRecord[]>();

  for (const task of tasks) {
    if (task.completed || view === "completed") {
      buckets.set("Completed", [...(buckets.get("Completed") ?? []), task]);
    } else if (task.scheduledDate) {
      dateBuckets.set(task.scheduledDate, [
        ...(dateBuckets.get(task.scheduledDate) ?? []),
        task,
      ]);
    } else {
      buckets.set("Unscheduled", [...(buckets.get("Unscheduled") ?? []), task]);
    }
  }

  const groups: {
    title: string;
    summary: string;
    dropDate: string | null;
    tasks: TaskRecord[];
  }[] = [...dateBuckets.entries()]
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, groupedTasks]) => ({
      title: formatGroupDate(date, today),
      summary: "",
      dropDate: date,
      tasks: groupedTasks,
    }));

  for (const title of ["Unscheduled", "Completed"]) {
    const groupedTasks = buckets.get(title);
    if (!groupedTasks) continue;
    groups.push({
      title,
      summary: title === "Unscheduled" ? "No schedule date" : "Finished tasks",
      dropDate: null,
      tasks: groupedTasks,
    });
  }

  return groups;
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function formatGroupDate(date: string, today: string) {
  const day = new Intl.DateTimeFormat("en", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  const dateLabel = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  const relative =
    date === today
      ? "Today"
      : date === addDays(today, 1)
        ? "Tomorrow"
        : date === addDays(today, -1)
          ? "Yesterday"
          : null;

  return [dateLabel, relative, day].filter(Boolean).join(" · ");
}

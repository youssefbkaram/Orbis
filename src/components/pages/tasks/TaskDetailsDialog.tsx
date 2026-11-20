"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  CopyPlus,
  Flag,
  Inbox,
  ListChecks,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  deleteTaskSubtask,
  duplicateTask as duplicateTaskAction,
  getTaskActivity,
  getTaskSubtasks,
  setTaskSubtaskCompleted,
  updateTask,
} from "@/app/(main)/tasks/actions";
import type { TaskRecord, TaskSubtaskRecord } from "./types";
import { TaskComposer } from "./TaskComposer";
import { TaskDatePicker } from "./TaskDatePicker";
import { PriorityPicker } from "./PriorityPicker";
import { TaskToast, type TaskToastMessage } from "./TaskToast";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  task: TaskRecord;
  today: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onUpdated: (task: TaskRecord) => void;
  onDuplicate: (task: TaskRecord) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onActivity: (message: string) => void;
  onCompletionChange: (taskId: string, completed: boolean) => Promise<void>;
  toast: TaskToastMessage | null;
  onToastDismiss: (id: string, commit: boolean) => void;
};

const priorityColors = ["#d04444", "#d87924", "#477bc2", "#858b95"];

export function TaskDetailsDialog({
  task,
  today,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onClose,
  onUpdated,
  onDuplicate,
  onDelete,
  onActivity,
  onCompletionChange,
  toast,
  onToastDismiss,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const savedSnapshot = useRef("");
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSubtaskCreates = useRef(new Set<string>());
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [project, setProject] = useState(task.project ?? "");
  const [scheduledDate, setScheduledDate] = useState(task.scheduledDate ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [reminderAt, setReminderAt] = useState(
    toLocalDateTime(task.reminderAt),
  );
  const [priority, setPriority] = useState(task.priority);
  const [subtasks, setSubtasks] = useState<TaskSubtaskRecord[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(true);
  const [subtaskComposerOpen, setSubtaskComposerOpen] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const [subtaskPending, setSubtaskPending] = useState<Set<string>>(
    () => new Set(),
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Saved");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  const draft = {
    id: task.id,
    title,
    description: description.trim() || null,
    notes: notes.trim() || null,
    project: project.trim() || null,
    labels: task.labels,
    scheduledDate: scheduledDate || null,
    dueDate: dueDate || null,
    reminderAt: toIsoDateTime(reminderAt),
    location: task.location,
    priority,
    completed: task.completed,
  };
  const snapshot = JSON.stringify(draft);

  function enqueueSave(values: typeof draft, valueSnapshot: string) {
    const operation = saveQueue.current.catch(() => undefined).then(async () => {
      if (valueSnapshot === savedSnapshot.current) return;
      setSaving(true);
      setSaveMessage("Saving…");
      setError("");
      try {
        const updated = await updateTask(values);
        savedSnapshot.current = valueSnapshot;
        onUpdated(updated);
        setSaveMessage("Saved");
      } catch {
        setSaveMessage("Not saved");
        setError("Could not save task details. Please try again.");
        throw new Error("Task details could not be saved.");
      } finally {
        setSaving(false);
      }
    });
    saveQueue.current = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation.then(
      () => true,
      () => false,
    );
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      titleInputRef.current?.focus();
    }
    savedSnapshot.current = snapshot;
    // The dialog is keyed by task ID, so initialize the autosave baseline once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    if (deleteConfirm && !dialog.open) dialog.showModal();
    else if (!deleteConfirm && dialog.open) dialog.close();
  }, [deleteConfirm]);

  useEffect(() => {
    let active = true;
    void getTaskSubtasks(task.id)
      .then((items) => {
        if (active) {
          setSubtasks((current) => [
            ...items,
            ...current.filter(
              (item) =>
                pendingSubtaskCreates.current.has(item.id) &&
                !items.some((loaded) => loaded.id === item.id),
            ),
          ]);
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not load subtasks. Please try again.");
        }
      })
      .finally(() => {
        if (active) setSubtasksLoading(false);
      });

    return () => {
      active = false;
    };
  }, [task.id]);

  useEffect(() => {
    if (snapshot === savedSnapshot.current) return;
    const timer = setTimeout(() => {
      void enqueueSave(draft, snapshot);
    }, 550);

    return () => clearTimeout(timer);
    // The serialized snapshot covers every persisted draft field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, onUpdated]);

  async function saveNow() {
    return enqueueSave(draft, snapshot);
  }

  async function handleClose() {
    if (!(await saveNow())) return;
    onClose();
  }

  function toggleTaskCompletion() {
    const next = !task.completed;
    savedSnapshot.current = JSON.stringify({ ...draft, completed: next });
    void onCompletionChange(task.id, next);
  }

  async function handleSubtaskChange(
    subtask: TaskSubtaskRecord,
    isCompleted: boolean,
  ) {
    setSubtaskPending((current) => new Set(current).add(subtask.id));
    setSubtasks((current) =>
      current.map((item) =>
        item.id === subtask.id ? { ...item, completed: isCompleted } : item,
      ),
    );
    setError("");
    try {
      await setTaskSubtaskCompleted(task.id, subtask.id, isCompleted);
    } catch {
      setSubtasks((current) =>
        current.map((item) =>
          item.id === subtask.id
            ? { ...item, completed: subtask.completed }
            : item,
        ),
      );
      setError("Could not update this subtask. Please try again.");
    } finally {
      setSubtaskPending((current) => {
        const next = new Set(current);
        next.delete(subtask.id);
        return next;
      });
    }
  }

  async function handleDeleteSubtask(subtaskId: string) {
    const index = subtasks.findIndex((item) => item.id === subtaskId);
    const removed = subtasks[index];
    if (!removed) return;
    setSubtaskPending((current) => new Set(current).add(subtaskId));
    setSubtasks((current) => current.filter((item) => item.id !== subtaskId));
    setError("");
    try {
      await deleteTaskSubtask(task.id, subtaskId);
    } catch {
      setSubtasks((current) => {
        if (current.some((item) => item.id === subtaskId)) return current;
        const restored = [...current];
        restored.splice(Math.min(index, restored.length), 0, removed);
        return restored;
      });
      setError("Could not remove this subtask. Please try again.");
    } finally {
      setSubtaskPending((current) => {
        const next = new Set(current);
        next.delete(subtaskId);
        return next;
      });
    }
  }

  async function showActivity() {
    setMenuOpen(false);
    setActivityLoading(true);
    try {
      const activity = await getTaskActivity(task.id);
      onActivity(
        `Activity · Created ${formatActivityDate(activity.createdAt)} · Last updated ${formatActivityDate(activity.updatedAt)}`,
      );
    } catch {
      setError("Could not load task activity. Please try again.");
    } finally {
      setActivityLoading(false);
    }
  }

  async function duplicateCurrentTask() {
    setBusyAction(true);
    setMenuOpen(false);
    if (!(await saveNow())) {
      setBusyAction(false);
      return;
    }
    try {
      const duplicate = await duplicateTaskAction(task.id);
      await onDuplicate(duplicate);
    } catch {
      setError("Could not duplicate this task. Please try again.");
    } finally {
      setBusyAction(false);
    }
  }

  async function deleteCurrentTask() {
    setBusyAction(true);
    setError("");
    if (!(await saveNow())) {
      setBusyAction(false);
      return;
    }
    try {
      await onDelete(task.id);
    } catch {
      setError("Could not delete this task. Please try again.");
      setBusyAction(false);
    }
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) void handleClose();
  }

  const completedSubtasks = subtasks.filter((item) => item.completed).length;

  return (
    <dialog
      aria-labelledby="task-details-dialog-title"
      className={styles.taskDialog}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
            if (deleteConfirm) setDeleteConfirm(false);
            else if (menuOpen) setMenuOpen(false);
          else void handleClose();
        } else if (
          event.key === "Delete" &&
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement)
        ) {
          event.preventDefault();
          setDeleteConfirm(true);
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        void handleClose();
      }}
      onClick={handleDialogClick}
      ref={dialogRef}
    >
      <div className={styles.taskDetails}>
        <header className={styles.taskDialogHeader}>
          <div className={styles.taskDialogProject}>
            <Inbox aria-hidden="true" size={14} />
            <span>{project.trim() || "Inbox"}</span>
          </div>
          <div className={styles.taskDialogHeaderActions}>
            <span aria-live="polite" className={styles.taskSaveStatus}>
              {saving && <span className={styles.taskSaveDot} />}
              {saveMessage}
            </span>
            <button
              aria-label="Previous task"
              className={styles.taskDialogIconButton}
              disabled={!canGoPrevious}
              onClick={async () => {
                if (await saveNow()) onPrevious();
              }}
              type="button"
            >
              <ChevronUp aria-hidden="true" size={17} />
            </button>
            <button
              aria-label="Next task"
              className={styles.taskDialogIconButton}
              disabled={!canGoNext}
              onClick={async () => {
                if (await saveNow()) onNext();
              }}
              type="button"
            >
              <ChevronDown aria-hidden="true" size={17} />
            </button>
            <div className={styles.taskMoreWrap}>
              <button
                aria-expanded={menuOpen}
                aria-label="Task actions"
                className={styles.taskDialogIconButton}
                onClick={() => setMenuOpen((value) => !value)}
                type="button"
              >
                <MoreHorizontal aria-hidden="true" size={18} />
              </button>
              {menuOpen && (
                <div className={styles.taskActionsMenu} role="menu">
                  <button onClick={() => void duplicateCurrentTask()} role="menuitem" type="button">
                    <CopyPlus aria-hidden="true" size={15} />
                    Duplicate
                  </button>
                  <button
                    disabled={activityLoading}
                    onClick={() => void showActivity()}
                    role="menuitem"
                    type="button"
                  >
                    <ListChecks aria-hidden="true" size={15} />
                    {activityLoading ? "Checking activity…" : "Check activity"}
                  </button>
                  <div className={styles.taskMenuDivider} />
                  <button
                    className={styles.taskDeleteAction}
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteConfirm(true);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                    Delete
                    <kbd>Delete</kbd>
                  </button>
                </div>
              )}
            </div>
            <button
              aria-label="Close task details"
              className={styles.taskDialogIconButton}
              onClick={() => void handleClose()}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </header>

        <div className={styles.taskDialogBody}>
          <section className={styles.taskDetailsMain}>
            <div className={styles.taskDetailsTitleRow}>
              <button
                aria-label={task.completed ? "Mark task active" : "Mark task complete"}
                className={`${styles.taskDetailsCheck}${task.completed ? ` ${styles.taskDetailsCheckCompleted}` : ""}`}
                onClick={toggleTaskCompletion}
                type="button"
              >
                {task.completed && <Check aria-hidden="true" size={14} />}
              </button>
              <input
                aria-label="Task name"
                autoFocus
                className={styles.taskDetailsTitle}
                id="task-title"
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Task name"
                required
                ref={titleInputRef}
                value={title}
              />
            </div>

            <section className={styles.taskDescriptionSection}>
              <textarea
                aria-label="Description"
                id="task-description"
                maxLength={4000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                rows={1}
                value={description}
              />
            </section>

            <section aria-labelledby="subtasks-title" className={styles.subtasksSection}>
              <div className={styles.subtasksHeader}>
                <button
                  aria-expanded={subtasksExpanded}
                  aria-label={subtasksExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}
                  className={styles.subtaskToggle}
                  onClick={() => setSubtasksExpanded((expanded) => !expanded)}
                  type="button"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={subtasksExpanded ? "" : styles.subtaskToggleCollapsed}
                    size={14}
                  />
                  <span id="subtasks-title">Sub-tasks</span>
                </button>
                <span className={styles.subtasksCount}>
                  {completedSubtasks}/{subtasks.length}
                </span>
              </div>
              {subtasksExpanded && (
                <>
                  {subtasksLoading ? (
                    <p className={styles.subtasksMessage}>Loading sub-tasks…</p>
                  ) : (
                    <ul className={styles.subtaskList}>
                      {subtasks.map((subtask) => (
                        <li className={styles.subtaskItem} key={subtask.id}>
                          <input
                            aria-label={`Mark “${subtask.title}” ${subtask.completed ? "active" : "complete"}`}
                            checked={subtask.completed}
                            disabled={subtaskPending.has(subtask.id)}
                            onChange={(event) =>
                              void handleSubtaskChange(subtask, event.target.checked)
                            }
                            type="checkbox"
                          />
                          <span className={subtask.completed ? styles.subtaskCompleted : ""}>
                            {subtask.title}
                          </span>
                          <span className={styles.subtaskMeta}>
                            {subtask.scheduledDate && <span>{formatShortDate(subtask.scheduledDate)}</span>}
                            <Flag color={priorityColors[subtask.priority - 1]} size={12} />
                            P{subtask.priority}
                          </span>
                          <button
                            aria-label={`Delete ${subtask.title}`}
                            className={styles.subtaskDelete}
                            disabled={subtaskPending.has(subtask.id)}
                            onClick={() => void handleDeleteSubtask(subtask.id)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!subtaskComposerOpen && (
                    <button
                      className={styles.addSubtaskButton}
                      onClick={() => setSubtaskComposerOpen(true)}
                      type="button"
                    >
                      <Plus aria-hidden="true" size={16} />
                      Add sub-task
                    </button>
                  )}
                  <TaskComposer
                    mode="subtask"
                    onOpenChange={setSubtaskComposerOpen}
                    onSubtaskCreated={(created) => {
                      pendingSubtaskCreates.current.add(created.id);
                      setSubtaskPending((current) => new Set(current).add(created.id));
                      setSubtasks((current) => [...current, created])
                    }}
                    onSubtaskSaved={(optimisticId, saved) => {
                      pendingSubtaskCreates.current.delete(optimisticId);
                      setSubtaskPending((current) => {
                        const next = new Set(current);
                        next.delete(optimisticId);
                        return next;
                      });
                      setSubtasks((current) =>
                        current.map((item) =>
                          item.id === optimisticId ? saved : item,
                        ),
                      )
                    }}
                    onSubtaskCreateFailed={(optimisticId) => {
                      pendingSubtaskCreates.current.delete(optimisticId);
                      setSubtaskPending((current) => {
                        const next = new Set(current);
                        next.delete(optimisticId);
                        return next;
                      });
                      setSubtasks((current) =>
                        current.filter((item) => item.id !== optimisticId),
                      )
                    }}
                    open={subtaskComposerOpen}
                    project={project}
                    taskId={task.id}
                    today={today}
                  />
                </>
              )}
            </section>

            <section aria-labelledby="task-notes-title" className={styles.taskNotesSection}>
              <div className={styles.taskNotesHeader}>
                <NotebookPen aria-hidden="true" size={16} />
                <h3 id="task-notes-title">Notes</h3>
                <span>Private to this task</span>
              </div>
              <textarea
                aria-label="Task notes"
                maxLength={10000}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Capture details, ideas, or anything you want to remember…"
                value={notes}
              />
            </section>

          </section>

          <aside aria-label="Task properties" className={styles.taskProperties}>
            <div className={styles.taskProperty}>
              <span>Project</span>
              <label className={styles.taskPropertyValue}>
                <Inbox aria-hidden="true" size={14} />
                <input
                  aria-label="Project"
                  maxLength={80}
                  onChange={(event) => setProject(event.target.value)}
                  placeholder="Inbox"
                  value={project}
                />
              </label>
            </div>
            <div className={styles.taskProperty}>
              <span>Scheduled date</span>
              <TaskDatePicker
                label="Choose date"
                onChange={setScheduledDate}
                today={today}
                value={scheduledDate}
              />
            </div>
            <div className={styles.taskProperty}>
              <span>Deadline</span>
              <TaskDatePicker
                label="Add deadline"
                onChange={setDueDate}
                today={today}
                value={dueDate}
              />
            </div>
            <div className={styles.taskProperty}>
              <span>Priority</span>
              <PriorityPicker priority={priority} onChange={setPriority} />
            </div>
            <div className={styles.taskProperty}>
              <span>Reminders</span>
              <TaskDatePicker
                includeTime
                icon="reminder"
                label="Set reminder"
                onChange={setReminderAt}
                today={today}
                value={reminderAt}
              />
            </div>
          </aside>
        </div>

        {error && (
          <div className={styles.taskDialogNotice}>
            <p aria-live="polite" role="status">{error}</p>
          </div>
        )}
      </div>
      <dialog
        aria-labelledby="delete-task-title"
        className={styles.deleteConfirmDialog}
        onCancel={(event) => {
          event.preventDefault();
          setDeleteConfirm(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDeleteConfirm(false);
        }}
        ref={deleteDialogRef}
      >
        <div className={styles.deleteConfirmContent}>
          <span className={styles.deleteConfirmIcon}>
            <Trash2 aria-hidden="true" size={20} />
          </span>
          <div className={styles.deleteConfirmCopy}>
            <h2 id="delete-task-title">Delete this task?</h2>
            <p>
              “{task.title}” and its subtasks will be removed. You can undo this
              for 5 seconds after deleting.
            </p>
          </div>
          <div className={styles.deleteConfirmActions}>
            <button
              className={styles.deleteConfirmCancel}
              onClick={() => setDeleteConfirm(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.deleteConfirmSubmit}
              disabled={busyAction}
              onClick={() => void deleteCurrentTask()}
              type="button"
            >
              {busyAction ? "Deleting…" : "Delete task"}
            </button>
          </div>
        </div>
      </dialog>
      {toast && (
        <TaskToast key={toast.id} onDismiss={onToastDismiss} toast={toast} />
      )}
    </dialog>
  );
}

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

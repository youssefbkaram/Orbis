"use client";

import {
  ArrowUp,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createTask, createTaskSubtask } from "@/app/(main)/tasks/actions";
import type { TaskRecord, TaskSubtaskRecord } from "./types";
import { PriorityPicker } from "./PriorityPicker";
import { ProjectPicker } from "./ProjectPicker";
import { TaskDatePicker } from "./TaskDatePicker";
import { addDays, isValidDate } from "./taskDateUtils";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type CommonProps = {
  open: boolean;
  today: string;
  initialDate?: string | null;
  onOpenChange: (open: boolean) => void;
};

type TaskComposerProps = CommonProps & {
  mode?: "task";
  onCreated: (task: TaskRecord) => void;
  onSaved: (id: string) => void;
  onCreateFailed: (id: string, message: string) => void;
};

type SubtaskComposerProps = CommonProps & {
  mode: "subtask";
  taskId: string;
  project: string;
  onSubtaskCreated: (subtask: TaskSubtaskRecord) => void;
  onSubtaskSaved: (optimisticId: string, saved: TaskSubtaskRecord) => void;
  onSubtaskCreateFailed: (optimisticId: string) => void;
};

type Props = TaskComposerProps | SubtaskComposerProps;

type ParsedTask = {
  title: string;
  project: string | null;
  date: string | null;
  priority: number | null;
  highlights: { start: number; end: number; kind: "date" | "priority" | "project" }[];
};

const transitionMs = 150;

export function TaskComposer(props: Props) {
  const { open, today, onOpenChange } = props;
  const [text, setText] = useState("");
  const [manualDate, setManualDate] = useState<string | null | undefined>(
    undefined,
  );
  const [manualPriority, setManualPriority] = useState<number | null>(null);
  const [manualReminder, setManualReminder] = useState("");
  const [manualProject, setManualProject] = useState<string | null | undefined>(
    undefined,
  );
  const [closing, setClosing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  function closeComposer() {
    setClosing(true);
    setSubmitError("");
    onOpenChange(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      if (openRef.current) return;
      setClosing(false);
      setText("");
      setManualDate(undefined);
      setManualPriority(null);
      setManualReminder("");
      setManualProject(undefined);
    }, transitionMs);
  }

  const parsed = useMemo(() => parseTaskText(text, today), [text, today]);
  const selectedDate =
    parsed.date ??
    (manualDate === undefined ? props.initialDate ?? null : manualDate);
  const selectedPriority = parsed.priority ?? manualPriority ?? 4;
  const inheritedProject =
    props.mode === "subtask" ? props.project.trim() || null : null;
  const selectedProject =
    manualProject !== undefined
      ? manualProject
      : (parsed.project ?? inheritedProject);
  const selectedReminder = manualReminder
    ? new Date(manualReminder).toISOString()
    : null;
  const projectOptions = [
    null,
    ...(inheritedProject && inheritedProject !== "Inbox" ? [inheritedProject] : []),
    ...(selectedProject ? [selectedProject] : []),
  ];
  const invalidDetails =
    parsed.title.length > 200 || (parsed.project?.length ?? 0) > 80;
  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace") return;
    const input = event.currentTarget;
    const caret = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? caret;
    if (caret !== selectionEnd || caret === 0) return;

    const token = parsed.highlights.find(
      (item) =>
        item.kind !== "project" &&
        item.end === caret &&
        text[item.start] !== "\u200b",
    );
    if (!token) return;

    event.preventDefault();
    const markerPosition = token.start + 1;
    setText(`${text.slice(0, markerPosition)}\u200b${text.slice(markerPosition)}`);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(caret + 1, caret + 1);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsed.title || invalidDetails) return;

    if (props.mode === "subtask") {
      setSubmitError("");
      const optimisticId = crypto.randomUUID();
      const optimisticSubtask: TaskSubtaskRecord = {
        id: optimisticId,
        taskId: props.taskId,
        title: parsed.title,
        description: null,
        notes: null,
        project: selectedProject,
        labels: [],
        scheduledDate: selectedDate,
        dueDate: selectedDate,
        reminderAt: selectedReminder,
        location: null,
        priority: selectedPriority,
        completed: false,
      };
      props.onSubtaskCreated(optimisticSubtask);
      setText("");
      setManualDate(undefined);
      setManualPriority(null);
      setManualReminder("");
      setManualProject(undefined);
      void createTaskSubtask({
        taskId: props.taskId,
        title: parsed.title,
        description: optimisticSubtask.description,
        notes: optimisticSubtask.notes,
        project: optimisticSubtask.project,
        labels: optimisticSubtask.labels,
        scheduledDate: selectedDate,
        dueDate: selectedDate,
        reminderAt: selectedReminder,
        location: optimisticSubtask.location,
        priority: selectedPriority,
      })
        .then((created) => {
          props.onSubtaskSaved(optimisticId, created);
        })
        .catch(() => {
          props.onSubtaskCreateFailed(optimisticId);
          setSubmitError("Could not add this subtask. Please try again.");
        });
      return;
    }

    const optimisticTask: TaskRecord = {
      id: crypto.randomUUID(),
      title: parsed.title,
      description: null,
      notes: null,
      project: selectedProject,
      labels: [],
      dueDate: selectedDate,
      scheduledDate: selectedDate,
      reminderAt: selectedReminder,
      location: null,
      priority: selectedPriority,
      completed: false,
    };

    props.onCreated(optimisticTask);
    setText("");
    setManualDate(undefined);
    setManualPriority(null);
    setManualReminder("");
    setManualProject(undefined);

    void createTask(optimisticTask)
      .then(() => props.onSaved(optimisticTask.id))
      .catch(() =>
        props.onCreateFailed(
          optimisticTask.id,
          "Could not save the task. Please check your connection and try again.",
        ),
      );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") closeComposer();
  }

  if (!open && !closing) return null;

  return (
    <form
      className={`${styles.inlineComposer}${props.mode === "subtask" ? ` ${styles.subtaskComposer}` : ""}${closing && !open ? ` ${styles.inlineComposerClosing}` : ""}`}
      onKeyDown={handleKeyDown}
      onSubmit={handleSubmit}
    >
      <label className={styles.composerInputWrap}>
        <span className={styles.visuallyHidden}>Task name and details</span>
        <div aria-hidden="true" className={styles.composerHighlight} ref={overlayRef}>
          {renderHighlightedText(text, parsed.highlights)}
        </div>
        <input
          ref={inputRef}
          autoFocus
          autoComplete="off"
          maxLength={400}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleInputKeyDown}
          onScroll={(event) => {
            if (overlayRef.current) {
              overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
            }
          }}
          placeholder="Task name"
          value={text}
        />
      </label>

      {invalidDetails && (
        <p className={styles.composerHint} role="status">
          Keep task names under 200 characters and project names under 80.
        </p>
      )}
      {submitError && (
        <p className={styles.composerHint} role="alert">
          {submitError}
        </p>
      )}

      <div className={styles.composerToolbar}>
        <div className={styles.composerTools}>
          <div className={styles.composerDatePriority}>
            <TaskDatePicker
              fullWidth={false}
              label="Date"
              onChange={setManualDate}
              portalToBody={props.mode !== "subtask"}
              today={today}
              value={selectedDate ?? ""}
            />
            <PriorityPicker priority={selectedPriority} onChange={setManualPriority} />
          </div>
          <TaskDatePicker
            fullWidth={false}
            icon="reminder"
            includeTime
            label="Reminders"
            onChange={setManualReminder}
            portalToBody={props.mode !== "subtask"}
            today={today}
            value={manualReminder}
          />
          <ProjectPicker
            onChange={setManualProject}
            project={selectedProject}
            projects={projectOptions}
          />
        </div>
        <div className={styles.composerActions}>
          <button
            aria-label={props.mode === "subtask" ? "Cancel subtask" : "Cancel task"}
            className={styles.composerCancel}
            onClick={closeComposer}
            type="button"
          >
            <X size={17} />
          </button>
          <button
            aria-label={props.mode === "subtask" ? "Add subtask" : "Add task"}
            className={styles.composerSubmit}
            disabled={!parsed.title || invalidDetails}
            type="submit"
          >
            <ArrowUp aria-hidden="true" size={17} />
          </button>
        </div>
      </div>
    </form>
  );
}

function parseTaskText(text: string, today: string): ParsedTask {
  let project: string | null = null;
  let date: string | null = null;
  let priority: number | null = null;
  const highlights: ParsedTask["highlights"] = [];
  const tokenRegex =
    /(?:^|\s)(!!?[1-4]|p[1-4])\b|#([\p{L}\d_-]+)|\b(today|tomorrow|\d{4}-\d{2}-\d{2})\b/giu;
  const matches = [...text.matchAll(tokenRegex)];
  const recognized: RegExpMatchArray[] = [];
  let title = text;

  for (const match of matches) {
    const full = match[0];
    const index = match.index ?? 0;
    const command = match[1] ?? match[2] ?? match[3] ?? "";
    const start = index + full.lastIndexOf(command);
    const end = start + command.length;
    if (text.slice(start - 1, start) === "\u200b" || text.slice(start, end).includes("\u200b")) {
      continue;
    }

    if (match[1]) {
      priority = Number(match[1].replaceAll("!", "").replace(/^p/i, ""));
      highlights.push({ start, end, kind: "priority" });
    } else if (match[2]) {
      project = match[2].replaceAll("_", " ");
      highlights.push({ start: index, end: index + full.length, kind: "project" });
    } else if (match[3]) {
      const token = match[3].toLowerCase();
      if (token === "today") date = today;
      else if (token === "tomorrow") date = addDays(today, 1);
      else if (isValidDate(token)) date = token;
      else continue;
      highlights.push({ start, end, kind: "date" });
    }
    recognized.push(match);
  }

  for (const match of recognized.reverse()) {
    const full = match[0];
    const index = match.index ?? 0;
    title = `${title.slice(0, index)} ${title.slice(index + full.length)}`;
  }

  return {
    title: title.replaceAll("\u200b", "").replace(/\s{2,}/g, " ").trim(),
    project,
    date,
    priority,
    highlights: highlights.sort((a, b) => a.start - b.start),
  };
}

function renderHighlightedText(
  text: string,
  highlights: ParsedTask["highlights"],
) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  highlights.forEach(({ start, end, kind }, index) => {
    if (start < cursor) return;
    parts.push(text.slice(cursor, start));
    parts.push(
      <mark className={styles[highlightClass(kind)]} key={index}>
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  parts.push(text.slice(cursor));
  return parts;
}

function highlightClass(kind: ParsedTask["highlights"][number]["kind"]) {
  if (kind === "date") return "commandHighlightDate";
  if (kind === "priority") return "commandHighlightPriority";
  return "commandHighlightProject";
}

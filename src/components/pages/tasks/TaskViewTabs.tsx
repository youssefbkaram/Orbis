"use client";

import type { TaskView } from "./types";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

const views: { id: TaskView; label: string }[] = [
  { id: "active", label: "All Active" },
  { id: "scheduled", label: "Scheduled" },
  { id: "unscheduled", label: "Unscheduled" },
  { id: "completed", label: "Completed" },
];

type Props = {
  selected: TaskView;
  counts: Record<TaskView, number>;
  onSelect: (view: TaskView) => void;
};

export function TaskViewTabs({ selected, counts, onSelect }: Props) {
  return (
    <div aria-label="Task views" className={styles.taskViews} role="tablist">
      {views.map((view) => (
        <button
          aria-selected={selected === view.id}
          className={`${styles.taskView}${selected === view.id ? ` ${styles.taskViewActive}` : ""}`}
          key={view.id}
          onClick={() => onSelect(view.id)}
          role="tab"
          type="button"
        >
          {view.label}
          <span className={selected === view.id ? styles.viewCount : styles.viewTotal}>
            {counts[view.id]}
          </span>
        </button>
      ))}
    </div>
  );
}

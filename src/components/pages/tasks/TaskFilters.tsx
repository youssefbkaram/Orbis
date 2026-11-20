"use client";

import { SlidersHorizontal } from "lucide-react";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  projects: string[];
  project: string;
  search: string;
  priorityOnly: boolean;
  onProjectChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPriorityChange: (value: boolean) => void;
};

export function TaskFilters({
  projects,
  project,
  search,
  priorityOnly,
  onProjectChange,
  onSearchChange,
  onPriorityChange,
}: Props) {
  return (
    <details className={styles.filterMenu}>
      <summary className={styles.filterButton}>
        <SlidersHorizontal aria-hidden="true" size={15} />
        Filter
      </summary>
      <div className={styles.filterPanel}>
        <label className={styles.filterField}>
          <span>Search tasks</span>
          <input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title or project"
            type="search"
            value={search}
          />
        </label>
        <label className={styles.filterField}>
          <span>Project</span>
          <select
            onChange={(event) => onProjectChange(event.target.value)}
            value={project}
          >
            <option value="">All projects</option>
            {projects.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.priorityFilter}>
          <input
            checked={priorityOnly}
            onChange={(event) => onPriorityChange(event.target.checked)}
            type="checkbox"
          />
          <span>Priority 1–3 only</span>
        </label>
      </div>
    </details>
  );
}

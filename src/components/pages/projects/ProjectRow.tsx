"use client";

import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { ProjectRecord } from "./types";
import styles from "@/app/(main)/projects/ProjectsPage.module.scss";

type Props = {
  project: ProjectRecord;
  today: string;
  onOpen: (project: ProjectRecord) => void;
};

function getHealth(project: ProjectRecord, today: string) {
  if (project.status === "archived") return { color: "neutral", label: "Archived" };
  if (project.status === "completed") return { color: "good", label: "Completed" };
  if (project.targetDate && project.targetDate < today) {
    return { color: "late", label: "Past target date" };
  }
  if (project.progress >= 75) return { color: "good", label: "On track" };
  if (project.targetDate && project.targetDate <= addDays(today, 14)) {
    return { color: "attention", label: "Target date approaching" };
  }
  return { color: "neutral", label: "In progress" };
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatDate(date: string | null) {
  if (!date) return "No target date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function ProjectRow({ project, today, onOpen }: Props) {
  const health = getHealth(project, today);
  const projectDomains = project.lifeDomains.length
    ? project.lifeDomains.join(", ")
    : project.domain;

  return (
    <button
      aria-label={`Open ${project.name}. ${projectDomains || "No domain"}. Target ${formatDate(project.targetDate)}. ${project.progress}% complete, ${health.label}.`}
      className={styles.projectRow}
      data-project-row
      onClick={() => onOpen(project)}
      type="button"
    >
      <span className={styles.initiativeCell}>
        <span
          aria-hidden="true"
          className={styles.projectDot}
          style={{ backgroundColor: project.color }}
        />
        <span className={styles.projectName}>{project.name}</span>
        <ArrowUpRight aria-hidden="true" className={styles.rowArrow} size={16} />
      </span>
      <span className={styles.domainCell}>
        {projectDomains ? (
          <span className={styles.domainTag}>{projectDomains}</span>
          ) : (
          <span className={styles.mutedValue}>No domain</span>
        )}
      </span>
      <span className={styles.dateCell}>
        <CalendarDays aria-hidden="true" className={styles.mobileCellIcon} size={14} />
        {formatDate(project.targetDate)}
      </span>
      <span className={styles.progressCell}>
        <span className={`${styles.healthDot} ${styles[`health${health.color}`]}`} />
        <span
          aria-label={`${project.progress}% complete`}
          className={styles.progressTrack}
          role="img"
        >
          <span
            className={styles.progressValue}
            style={{ width: `${project.progress}%`, backgroundColor: project.color }}
          />
        </span>
        <span className={styles.progressText}>{project.progress}%</span>
        <span className={styles.healthLabel}>{health.label}</span>
      </span>
    </button>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import type { ProjectDraft, ProjectRecord } from "./types";
import styles from "@/app/(main)/projects/ProjectsPage.module.scss";

const colors = [
  { value: "#2563eb", label: "Blue" },
  { value: "#0f766e", label: "Teal" },
  { value: "#d97706", label: "Amber" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#db2777", label: "Pink" },
  { value: "#475569", label: "Slate" },
];

type Props = {
  project?: ProjectRecord;
  domains: string[];
  onSave: (draft: ProjectDraft) => Promise<void>;
  onStatusChange?: (status: "active" | "completed" | "archived") => Promise<void>;
  onClose: () => void;
};

export function ProjectForm({ project, domains, onSave, onStatusChange, onClose }: Props) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [domain, setDomain] = useState(project?.domain ?? "");
  const [targetDate, setTargetDate] = useState(project?.targetDate ?? "");
  const [progress, setProgress] = useState(project?.progress ?? 0);
  const [color, setColor] = useState(project?.color ?? colors[0].value);
  const [saving, setSaving] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        id: project?.id ?? crypto.randomUUID(),
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        targetDate: targetDate || null,
        progress,
        color,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this project.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: "active" | "completed" | "archived") {
    if (!onStatusChange) return;
    setBusyStatus(true);
    setError("");
    try {
      await onStatusChange(status);
      if (status === "completed") setProgress(100);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update project status.");
    } finally {
      setBusyStatus(false);
    }
  }

  const archived = project?.status === "archived";
  const completed = project?.status === "completed";

  return (
    <form className={styles.projectForm} onSubmit={submit}>
      <div className={styles.formFields}>
        <label className={styles.field}>
          <span>Initiative name</span>
          <input
            autoFocus
            maxLength={140}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Launch the new client portal"
            required
            value={name}
          />
        </label>

        <label className={styles.field}>
          <span>Domain <small>Optional</small></span>
          <input
            list="project-domains"
            maxLength={80}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="e.g. Product, Health, Finance"
            value={domain}
          />
          <datalist id="project-domains">
            {domains.map((value) => <option key={value} value={value} />)}
          </datalist>
        </label>

        <div className={styles.formColumns}>
          <label className={styles.field}>
            <span>Target date <small>Optional</small></span>
            <input
              onChange={(event) => setTargetDate(event.target.value)}
              type="date"
              value={targetDate}
            />
          </label>
          <label className={styles.field}>
            <span>Progress <small>{progress}%</small></span>
            <input
              aria-label={`Project progress: ${progress}%`}
              disabled={project?.status === "completed"}
              max={100}
              min={0}
              onChange={(event) => setProgress(Number(event.target.value))}
              type="range"
              value={progress}
            />
          </label>
        </div>

        <fieldset className={styles.colorField}>
          <legend>Initiative color</legend>
          <div className={styles.colorOptions}>
            {colors.map((option) => (
              <button
                aria-label={`${option.label} color`}
                aria-pressed={color === option.value}
                className={styles.colorOption}
                key={option.value}
                onClick={() => setColor(option.value)}
                style={{ backgroundColor: option.value }}
                type="button"
              />
            ))}
          </div>
        </fieldset>

        <label className={styles.field}>
          <span>Description <small>Optional</small></span>
          <textarea
            maxLength={4000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What does success look like for this initiative?"
            rows={4}
            value={description}
          />
        </label>
      </div>

      {error && <p className={styles.formError} role="alert">{error}</p>}

      <div className={styles.dialogFooter}>
        {project && onStatusChange && (
          <div className={styles.statusActions}>
            {archived ? (
              <button
                className={styles.subtleButton}
                disabled={busyStatus}
                onClick={() => void changeStatus("active")}
                type="button"
              >
                Restore
              </button>
            ) : (
              <>
                <button
                  className={styles.subtleButton}
                  disabled={busyStatus}
                  onClick={() => void changeStatus(completed ? "active" : "completed")}
                  type="button"
                >
                  {completed ? "Reopen" : "Mark complete"}
                </button>
                <button
                  aria-label="Archive project"
                  className={styles.archiveButton}
                  disabled={busyStatus}
                  onClick={() => void changeStatus("archived")}
                  type="button"
                >
                  Archive
                </button>
              </>
            )}
          </div>
        )}
        <div className={styles.formActions}>
          <button className={styles.subtleButton} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={styles.primaryButton} disabled={saving} type="submit">
            {saving ? "Saving…" : project ? "Save changes" : "Create project"}
          </button>
        </div>
      </div>
    </form>
  );
}

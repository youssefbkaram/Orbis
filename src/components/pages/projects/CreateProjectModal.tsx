"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FolderKanban, LoaderCircle, X } from "lucide-react";
import type { CreateProjectInput } from "./types";
import { ProjectMultiSelect } from "./ProjectMultiSelect";
import styles from "@/app/(main)/projects/ProjectsPage.module.scss";

const lifeDomainOptions = [
  "Academics & Education",
  "Projects & Work",
  "Personal Development",
  "Relationships & Social Life",
  "Health & Lifestyle",
  "Personal Life & Vision",
];

type Props = {
  onCreate: (draft: CreateProjectInput) => Promise<void>;
  onClose: () => void;
};

export function CreateProjectModal({ onCreate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const discardButtonRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lifeDomains, setLifeDomains] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [closing, setClosing] = useState(false);

  const dirty = Boolean(
    name ||
    description ||
    lifeDomains.length ||
    startDate ||
    targetDate,
  );
  const datesInvalid = Boolean(startDate && targetDate && targetDate < startDate);
  const visibleDateError = datesInvalid
    ? "Target date cannot be before the start date."
    : dateError;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    if (confirmDiscard) discardButtonRef.current?.focus();
    else if (dialogRef.current?.open) nameInputRef.current?.focus();
  }, [confirmDiscard]);

  function closeWithTransition() {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 150);
  }

  function requestClose() {
    if (saving || closing) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    closeWithTransition();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const trimmedName = name.trim();
    setNameError(trimmedName ? "" : "Enter a project name.");
    setDateError(
      datesInvalid ? "Target date cannot be before the start date." : "",
    );
    setSubmitError("");
    if (!trimmedName || datesInvalid) return;

    setSaving(true);
    try {
      await onCreate({
        id: crypto.randomUUID(),
        name: trimmedName,
        description: description.trim() || null,
        lifeDomains,
        startDate: startDate || null,
        targetDate: targetDate || null,
      });
    } catch {
      setSubmitError("We couldn’t create the project. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      aria-labelledby="create-project-title"
      className={styles.createProjectDialog}
      data-closing={closing}
      onCancel={(event) => {
        event.preventDefault();
        if (confirmDiscard) setConfirmDiscard(false);
        else requestClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !dirty) closeWithTransition();
        else if (event.target === dialogRef.current) setConfirmDiscard(true);
      }}
      ref={dialogRef}
    >
      <div className={styles.createProjectHeader}>
        <div className={styles.dialogIcon}>
          <FolderKanban aria-hidden="true" size={18} />
        </div>
        <div className={styles.dialogHeading}>
          <h2 id="create-project-title">New Project</h2>
          <p>Create a project to organize your work and track its progress.</p>
        </div>
        <button
          aria-label="Close dialog"
          className={styles.iconButton}
          disabled={saving}
          onClick={requestClose}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>

      <form className={styles.createProjectForm} noValidate onSubmit={submit}>
        <fieldset className={styles.createFieldsSet} disabled={saving}>
          <div className={styles.createProjectFields}>
          <label className={styles.createField}>
            <span>Project Name <span className={styles.requiredMark}>*</span></span>
            <input
              aria-describedby={nameError ? "create-project-name-error" : undefined}
              aria-invalid={Boolean(nameError)}
              autoComplete="off"
              maxLength={120}
              onChange={(event) => {
                setName(event.target.value);
                if (event.target.value.trim()) setNameError("");
              }}
              placeholder="e.g. Build a STEM Education Platform"
              ref={nameInputRef}
              value={name}
            />
            {nameError ? (
              <span className={styles.fieldError} id="create-project-name-error" role="alert">
                {nameError}
              </span>
            ) : (
              <span className={styles.fieldHint}>{name.length}/120 characters</span>
            )}
          </label>

          <label className={styles.createField}>
            <span>Description <span className={styles.optionalMark}>Optional</span></span>
            <textarea
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What do you want to accomplish with this project?"
              rows={3}
              value={description}
            />
          </label>

          <div className={styles.createField}>
            <span className={styles.fieldLabel}>Life Domains <span className={styles.optionalMark}>Optional</span></span>
            <p className={styles.fieldHint}>Connect this project to relevant areas of your life.</p>
            <ProjectMultiSelect
              emptyMessage="No life domains available."
              label="Life Domains"
              onChange={setLifeDomains}
              options={lifeDomainOptions}
              placeholder="Search and select life domains"
              selected={lifeDomains}
            />
          </div>

          <div className={styles.createField}>
            <span className={styles.fieldLabel}>Connected Goals <span className={styles.optionalMark}>Optional</span></span>
            <p className={styles.fieldHint}>Link goals that this project contributes towards.</p>
            <div className={styles.goalEmptyState}>
              <p>No goals yet. You can create goals later and connect them to this project.</p>
            </div>
          </div>

          <div className={styles.createDateGrid}>
            <label className={styles.createField}>
              <span>Start Date <span className={styles.optionalMark}>Optional</span></span>
              <input
                aria-describedby={visibleDateError ? "create-project-date-error" : undefined}
                aria-invalid={Boolean(visibleDateError)}
                max={targetDate || undefined}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setDateError("");
                }}
                type="date"
                value={startDate}
              />
            </label>
            <label className={styles.createField}>
              <span>Target Date <span className={styles.optionalMark}>Optional</span></span>
              <input
                aria-describedby={visibleDateError ? "create-project-date-error" : undefined}
                aria-invalid={Boolean(visibleDateError)}
                min={startDate || undefined}
                onChange={(event) => {
                  setTargetDate(event.target.value);
                  setDateError("");
                }}
                type="date"
                value={targetDate}
              />
            </label>
          </div>
          {visibleDateError && (
            <p className={styles.fieldError} id="create-project-date-error" role="alert">
              {visibleDateError}
            </p>
          )}
          {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
          </div>
        </fieldset>

        <footer className={styles.createProjectFooter}>
          <button
            className={styles.subtleButton}
            disabled={saving}
            onClick={requestClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.primaryButton}
            disabled={saving}
            type="submit"
          >
            {saving ? (
              <>
                <LoaderCircle aria-hidden="true" className={styles.loadingIcon} size={15} />
                Creating…
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </footer>
      </form>

      {confirmDiscard && (
        <div
          aria-labelledby="discard-project-title"
          aria-modal="true"
          className={styles.discardOverlay}
          role="alertdialog"
        >
          <div className={styles.discardDialog}>
            <h3 id="discard-project-title">Discard this project?</h3>
            <p>Your changes haven’t been saved. Do you want to discard them?</p>
            <div className={styles.discardActions}>
              <button
                className={styles.subtleButton}
                onClick={() => setConfirmDiscard(false)}
                ref={discardButtonRef}
                type="button"
              >
                Keep editing
              </button>
              <button
                className={styles.discardButton}
                onClick={closeWithTransition}
                type="button"
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

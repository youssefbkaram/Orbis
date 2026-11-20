"use client";

import { useEffect, useRef, useState } from "react";
import { FolderKanban, X } from "lucide-react";
import type { ProjectDraft, ProjectRecord, ProjectStatus } from "./types";
import { ProjectForm } from "./ProjectForm";
import styles from "@/app/(main)/projects/ProjectsPage.module.scss";

type Props = {
  project: ProjectRecord | null;
  domains: string[];
  onSave: (draft: ProjectDraft) => Promise<void>;
  onStatusChange: (projectId: string, status: ProjectStatus) => Promise<void>;
  onClose: () => void;
};

export function ProjectDialog({ project, domains, onSave, onStatusChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 150);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  return (
    <dialog
      aria-labelledby="project-dialog-title"
      className={styles.projectDialog}
      data-closing={closing}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      ref={dialogRef}
    >
      <div className={styles.dialogHeader}>
        <div className={styles.dialogIcon}><FolderKanban aria-hidden="true" size={18} /></div>
        <div className={styles.dialogHeading}>
          <h2 id="project-dialog-title">{project ? "Initiative details" : "New initiative"}</h2>
          <p>{project ? "Update its details and track progress." : "Give your next meaningful effort a clear direction."}</p>
        </div>
        <button aria-label="Close dialog" className={styles.iconButton} onClick={requestClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      <ProjectForm
        key={project?.id ?? "new-project"}
        domains={domains}
        onClose={requestClose}
        onSave={onSave}
        onStatusChange={
          project ? (status) => onStatusChange(project.id, status) : undefined
        }
        project={project ?? undefined}
      />
    </dialog>
  );
}

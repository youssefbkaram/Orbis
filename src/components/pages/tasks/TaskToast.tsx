"use client";

import { CheckCircle2, Info, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

export type TaskToastMessage = {
  id: string;
  message: string;
  kind: "success" | "info";
  durationMs?: number;
  onUndo?: () => void | Promise<void>;
  onExpire?: () => void | Promise<void>;
};

type Props = {
  toast: TaskToastMessage;
  onDismiss: (id: string, commit: boolean) => void;
};

export function TaskToast({ toast, onDismiss }: Props) {
  const [closing, setClosing] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elementRef = useRef<HTMLElement>(null);
  const toastRef = useRef(toast);
  const dismissRef = useRef(onDismiss);
  const closingRef = useRef(false);

  const close = useCallback((commit: boolean) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    if (commit) void toastRef.current.onExpire?.();
    exitTimer.current = setTimeout(
      () => dismissRef.current(toastRef.current.id, false),
      220,
    );
  }, []);

  useEffect(() => {
    toastRef.current = toast;
    dismissRef.current = onDismiss;
  }, [toast, onDismiss]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    element.showPopover();
    return () => element.hidePopover();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => close(true), toast.durationMs ?? 5000);
    return () => {
      clearTimeout(timer);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [close, toast.durationMs]);

  return (
    <aside
      aria-live="polite"
      className={`${styles.taskToast}${closing ? ` ${styles.taskToastClosing}` : ""}`}
      popover="manual"
      ref={elementRef}
      role="status"
    >
      <div className={styles.taskToastContent}>
        {toast.kind === "success" ? (
          <CheckCircle2 aria-hidden="true" className={styles.taskToastSuccess} size={19} />
        ) : (
          <Info aria-hidden="true" className={styles.taskToastInfo} size={19} />
        )}
        <p>{toast.message}</p>
        {toast.onUndo && (
          <button
            className={styles.taskToastUndo}
            onClick={() => {
              void toast.onUndo?.();
              close(false);
            }}
            type="button"
          >
            <Undo2 aria-hidden="true" size={14} />
            Undo
          </button>
        )}
        <button
          aria-label="Dismiss notification"
          className={styles.taskToastClose}
          onClick={() => close(true)}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
      <span
        aria-hidden="true"
        className={styles.taskToastTimer}
        style={{ "--toast-duration": `${toast.durationMs ?? 5000}ms` } as CSSProperties}
      />
    </aside>
  );
}

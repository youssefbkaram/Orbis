import type { ReactNode } from "react";
import styles from "./AuthNotice.module.scss";

export function AuthNotice({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: ReactNode;
}) {
  return (
    <p aria-live="polite" className={styles.notice} data-kind={kind} role="status">
      {children}
    </p>
  );
}

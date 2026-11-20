import type { ReactNode } from "react";
import styles from "./MainContent.module.scss";

export function MainContent({ children }: { children: ReactNode }) {
  return (
    <main className={styles.main} id="main-content">
      <div className={styles.content}>{children}</div>
    </main>
  );
}
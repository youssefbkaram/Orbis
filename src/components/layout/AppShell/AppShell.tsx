"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import styles from "./AppShell.module.scss";
import { MainContent } from "../MainContent/MainContent";
import { Sidebar } from "../Sidebar/Sidebar";
import { Topbar } from "../Topbar/Topbar";

type AppShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

export function AppShell({ children, user }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setIsMobileSidebarOpen(false);
    };

    document.body.style.overflow = "hidden";
    desktopQuery.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = "";
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileSidebarOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileSidebarOpen]);

  return (
    <div
      className={styles.shell}
      data-collapsed={isSidebarCollapsed}
      data-mobile-open={isMobileSidebarOpen}
    >
      <div className={styles.sidebar}>
        <Suspense fallback={<div aria-hidden="true" className={styles.sidebarFallback} />}>
          <Sidebar
            collapsed={isSidebarCollapsed}
            onClose={() => setIsMobileSidebarOpen(false)}
            onToggleCollapsed={() =>
              setIsSidebarCollapsed((collapsed) => !collapsed)
            }
          />
        </Suspense>
      </div>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <button
        aria-label="Close navigation menu"
        className={styles.backdrop}
        onClick={() => setIsMobileSidebarOpen(false)}
        tabIndex={isMobileSidebarOpen ? 0 : -1}
        type="button"
      />
      <div className={styles.workspace}>
        <Suspense fallback={<div aria-hidden="true" className={styles.topbarFallback} />}>
          <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} user={user} />
        </Suspense>
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
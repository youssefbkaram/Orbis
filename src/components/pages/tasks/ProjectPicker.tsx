"use client";

import { Check, Folder, Inbox } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  project: string | null;
  projects: (string | null)[];
  onChange: (project: string | null) => void;
};

const transitionMs = 150;
const menuWidth = 224;
const viewportPadding = 8;

export function ProjectPicker({ project, projects, onChange }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    setPortalTarget(buttonRef.current?.closest("dialog") ?? document.body);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!mounted || !portalTarget) return;

    function updatePosition() {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;

      const rect = button.getBoundingClientRect();
      const width = Math.min(menu.offsetWidth || menuWidth, window.innerWidth - viewportPadding * 2);
      const left = Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - width - viewportPadding),
      );
      const below = rect.bottom + 6;
      const top =
        below + menu.offsetHeight <= window.innerHeight - viewportPadding
          ? below
          : Math.max(viewportPadding, rect.top - menu.offsetHeight - 6);

      if (portalTarget instanceof HTMLDialogElement) {
        const dialogRect = portalTarget.getBoundingClientRect();
        setPosition({
          left: left - dialogRect.left - portalTarget.clientLeft,
          top: top - dialogRect.top - portalTarget.clientTop,
        });
      } else {
        setPosition({ left, top });
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, portalTarget]);

  function showMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMounted(true);
    setOpen(true);
  }

  function hideMenu() {
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMounted(false), transitionMs);
  }

  const options = projects.filter(
    (value, index, values) => values.findIndex((candidate) => candidate === value) === index,
  );
  const selectedLabel = project || "Inbox";
  const menu = mounted && (
    <div
      ref={menuRef}
      aria-label="Choose a project"
      className={`${styles.projectMenu}${portalTarget instanceof HTMLDialogElement ? ` ${styles.projectMenuDialog}` : ` ${styles.projectMenuPortal}`}${open ? "" : ` ${styles.popoverClosing}`}`}
      role="listbox"
      style={{ left: position.left, top: position.top }}
    >
      <p className={styles.projectMenuHeading}>Add to project</p>
      {options.map((option) => (
        <button
          aria-selected={project === option}
          className={styles.projectOption}
          key={option ?? "__inbox"}
          onClick={() => {
            onChange(option);
            hideMenu();
          }}
          role="option"
          type="button"
        >
          {option ? (
            <Folder aria-hidden="true" size={15} />
          ) : (
            <Inbox aria-hidden="true" size={15} />
          )}
          <span>{option || "Inbox"}</span>
          {project === option && <Check aria-hidden="true" size={14} />}
        </button>
      ))}
      <p className={styles.projectMenuHint}>
        Use <kbd>#project</kbd> in the task name to add a project.
      </p>
    </div>
  );

  return (
    <div className={styles.dateToolWrap}>
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${styles.composerTool}${project ? ` ${styles.composerToolSelected}` : ""}`}
        onClick={() => (open ? hideMenu() : showMenu())}
        type="button"
      >
        {project ? (
          <Folder aria-hidden="true" size={14} />
        ) : (
          <Inbox aria-hidden="true" size={14} />
        )}
        <span>{selectedLabel}</span>
      </button>
      {portalTarget && menu ? createPortal(menu, portalTarget) : null}
    </div>
  );
}

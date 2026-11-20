"use client";

import { Flag } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  priority: number;
  onChange: (priority: number) => void;
};

const priorityColors = ["#d04444", "#d87924", "#477bc2", "#858b95"];
const transitionMs = 150;
const menuWidth = 190;
const viewportPadding = 8;

export function PriorityPicker({ priority, onChange }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  useEffect(() => {
    setPortalTarget(buttonRef.current?.closest("dialog") ?? document.body);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;

    function updatePosition() {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;

      const rect = button.getBoundingClientRect();
      const menuHeight = menu.offsetHeight;
      const viewportLeft = Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - menuWidth - viewportPadding),
      );
      const below = rect.bottom + 6;
      const viewportTop =
        below + menuHeight <= window.innerHeight - viewportPadding
          ? below
          : Math.max(viewportPadding, rect.top - menuHeight - 6);
      if (portalTarget instanceof HTMLDialogElement) {
        const dialogRect = portalTarget.getBoundingClientRect();
        setMenuPosition({
          left: viewportLeft - dialogRect.left - portalTarget.clientLeft,
          top: viewportTop - dialogRect.top - portalTarget.clientTop,
        });
      } else {
        setMenuPosition({ left: viewportLeft, top: viewportTop });
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

  return (
    <div className={styles.priorityWrap}>
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Priority P${priority}`}
        className={styles.priorityPicker}
        data-priority={`p${priority}`}
        onClick={() => (open ? hideMenu() : showMenu())}
        type="button"
      >
        <Flag
          aria-hidden="true"
          color={priorityColors[priority - 1]}
          fill={priority === 4 ? "none" : priorityColors[priority - 1]}
          size={14}
        />
        <span>P{priority}</span>
      </button>
      {mounted && portalTarget &&
        createPortal(
          <div
            ref={menuRef}
            aria-label="Choose a priority"
            className={`${styles.priorityMenu} ${portalTarget instanceof HTMLDialogElement ? styles.priorityMenuDialog : styles.priorityMenuPortal}${open ? "" : ` ${styles.popoverClosing}`}`}
            role="listbox"
            style={{ left: menuPosition.left, top: menuPosition.top }}
          >
            {[1, 2, 3, 4].map((value) => (
              <button
                aria-selected={priority === value}
                className={styles.priorityOption}
                key={value}
                onClick={() => {
                  onChange(value);
                  hideMenu();
                }}
                role="option"
                type="button"
              >
                <Flag
                  aria-hidden="true"
                  color={priorityColors[value - 1]}
                  fill={value === 4 ? "none" : priorityColors[value - 1]}
                  size={15}
                />
                <span>Priority {value}</span>
                {priority === value && <small>Selected</small>}
              </button>
            ))}
          </div>,
          portalTarget,
        )}
    </div>
  );
}

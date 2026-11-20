"use client";

import { Bell, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  formatDate,
  formatMonth,
  formatShortDate,
  getCalendarDays,
  getDateLabel,
  getDatePresets,
  shiftMonth,
  startOfMonth,
} from "./taskDateUtils";
import styles from "@/app/(main)/tasks/TasksPage.module.scss";

type Props = {
  value: string;
  today: string;
  label: string;
  onChange: (value: string) => void;
  includeTime?: boolean;
  portalToBody?: boolean;
  icon?: "calendar" | "reminder";
  fullWidth?: boolean;
};

const transitionMs = 150;
const viewportPadding = 8;

export function TaskDatePicker({
  value,
  today,
  label,
  onChange,
  includeTime = false,
  portalToBody = false,
  icon = "calendar",
  fullWidth = true,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(value || today),
  );
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const selectedDate = includeTime && value ? value.slice(0, 10) : value;
  const selectedTime =
    includeTime && value.length >= 16 ? value.slice(11, 16) : "09:00";
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  useEffect(() => {
    setPortalTarget(
      triggerRef.current?.closest("dialog") ??
        (portalToBody ? document.body : null),
    );
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [portalToBody]);

  useLayoutEffect(() => {
    if (!mounted || !portalTarget) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const rect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const width = Math.min(popoverRect.width, window.innerWidth - viewportPadding * 2);
      const left = Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - width - viewportPadding),
      );
      const below = rect.bottom + 6;
      const top =
        below + popoverRect.height <= window.innerHeight - viewportPadding
          ? below
          : Math.max(viewportPadding, rect.top - popoverRect.height - 6);

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
  }, [mounted, portalTarget, visibleMonth]);

  function showPopover() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setVisibleMonth(startOfMonth(value || today));
    setMounted(true);
    setOpen(true);
  }

  function hidePopover() {
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMounted(false), transitionMs);
  }

  function chooseDate(date: string) {
    onChange(includeTime ? `${date}T${selectedTime}` : date);
    hidePopover();
  }

  function chooseTime(time: string) {
    if (!time) return;
    onChange(`${selectedDate || today}T${time}`);
  }

  function clearDate() {
    onChange("");
    hidePopover();
  }

  function formatTime(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(time);
  }

  const popover = mounted && (
    <div
      ref={popoverRef}
      aria-label={`Choose ${label.toLowerCase()}`}
      className={`${styles.datePopover}${portalTarget ? ` ${styles.datePopoverPortal}${portalTarget instanceof HTMLDialogElement ? ` ${styles.datePopoverDialog}` : ""}` : ""}${includeTime ? ` ${styles.datePopoverWithTime}` : ""}${open ? "" : ` ${styles.popoverClosing}`}`}
      role="dialog"
      style={portalTarget ? { left: position.left, top: position.top } : undefined}
    >
      <div className={styles.datePresets}>
        {getDatePresets(today).map((preset) => (
          <button
            aria-pressed={selectedDate === preset.value}
            className={styles.datePreset}
            key={preset.label}
            onClick={() => chooseDate(preset.value)}
            type="button"
          >
            <CalendarDays aria-hidden="true" size={15} />
            <span>{preset.label}</span>
            <small>{formatShortDate(preset.value)}</small>
          </button>
        ))}
        {selectedDate && (
          <button
            className={styles.clearDate}
            onClick={clearDate}
            type="button"
          >
            Clear date
          </button>
        )}
      </div>
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          <strong>{formatMonth(visibleMonth)}</strong>
          <div>
            <button
              aria-label="Previous month"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={15} />
            </button>
            <button
              aria-label="Next month"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={15} />
            </button>
          </div>
        </div>
        <div className={styles.calendarGrid}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <span aria-hidden="true" className={styles.calendarWeekday} key={day}>
              {day}
            </span>
          ))}
          {calendarDays.map((day) => (
            <button
              aria-label={formatDate(day)}
              aria-pressed={selectedDate === day}
              className={`${styles.calendarDay}${day.slice(0, 7) === visibleMonth.slice(0, 7) ? "" : ` ${styles.calendarDayOutside}`}${day === today ? ` ${styles.calendarDayToday}` : ""              }${selectedDate === day ? ` ${styles.calendarDaySelected}` : ""}`}
              key={day}
              onClick={() => chooseDate(day)}
              type="button"
            >
              {Number(day.slice(-2))}
            </button>
          ))}
        </div>
      </div>
      {includeTime && (
        <label className={styles.datePopoverTime}>
          <span>Time</span>
          <input
            aria-label={`${label} time`}
            onChange={(event) => chooseTime(event.target.value)}
            type="time"
            value={selectedTime}
          />
        </label>
      )}
    </div>
  );

  return (
    <div
      className={`${styles.dateToolWrap}${portalTarget && fullWidth ? ` ${styles.taskDatePicker}` : ""}`}
    >
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${label}${selectedDate ? `, ${formatShortDate(selectedDate)}${includeTime ? ` at ${formatTime(selectedTime)}` : ""}` : ""}`}
        className={`${styles.composerTool}${value ? ` ${styles.composerToolSelected}` : ""}${portalTarget && fullWidth ? ` ${styles.taskDateTrigger}` : ""}`}
        onClick={() => (open ? hidePopover() : showPopover())}
        type="button"
      >
        {icon === "reminder" ? (
          <Bell aria-hidden="true" size={14} />
        ) : (
          <CalendarDays aria-hidden="true" size={14} />
        )}
        <span>
          {selectedDate
            ? `${getDateLabel(selectedDate, today)}${includeTime ? ` · ${formatTime(selectedTime)}` : ""}`
            : label}
        </span>
      </button>
      {portalTarget && popover ? createPortal(popover, portalTarget) : popover}
    </div>
  );
}

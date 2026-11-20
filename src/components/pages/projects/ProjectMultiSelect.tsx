"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import styles from "@/app/(main)/projects/ProjectsPage.module.scss";

type Props = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  emptyMessage: string;
};

export function ProjectMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
  emptyMessage,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option) &&
      option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (!open) return;

    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className={styles.multiSelect} ref={containerRef}>
      <div className={styles.multiSelectControl}>
        <div className={styles.selectedTags}>
          {selected.map((item) => (
            <span className={styles.selectedTag} key={item}>
              {item}
              <button
                aria-label={`Remove ${item}`}
                onClick={() => toggle(item)}
                type="button"
              >
                <X aria-hidden="true" size={12} />
              </button>
            </span>
          ))}
          <input
            aria-label={label}
            aria-controls={listboxId}
            aria-expanded={open}
            aria-haspopup="listbox"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !query && selected.length > 0) {
                event.preventDefault();
                onChange(selected.slice(0, -1));
              }
              if (event.key === "ArrowDown" && !open) {
                event.preventDefault();
                setOpen(true);
              }
            }}
            placeholder={selected.length ? "" : placeholder}
            ref={inputRef}
            role="combobox"
            value={query}
          />
          <button
            aria-label={open ? `Close ${label} options` : `Show ${label} options`}
            className={styles.multiSelectToggle}
            onClick={() => {
              setOpen((value) => !value);
              inputRef.current?.focus();
            }}
            type="button"
          >
            <ChevronDown aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
      {open && (
        <div aria-label={`${label} options`} className={styles.multiSelectOptions} id={listboxId} role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                aria-selected={false}
                className={styles.multiSelectOption}
                key={option}
                onClick={() => toggle(option)}
                role="option"
                type="button"
              >
                <span>{option}</span>
                <Check aria-hidden="true" size={14} />
              </button>
            ))
          ) : (
            <p className={styles.multiSelectEmpty}>
              {options.length === 0 ? emptyMessage : "No matching options."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

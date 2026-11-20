"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Check, ChevronDown, Filter, FolderKanban, Plus, Search, X } from "lucide-react";
import {
  createProject,
  setProjectStatus,
  updateProject,
} from "@/app/(main)/projects/actions";
import { CreateProjectModal } from "./CreateProjectModal";
import { ProjectDialog } from "./ProjectDialog";
import { ProjectRow } from "./ProjectRow";
import type { ProjectDraft, ProjectRecord, ProjectStatus } from "./types";
import type { CreateProjectInput } from "./types";
import styles from "@/app/(main)/projects/ProjectsPage.module.scss";

type Props = {
  initialProjects: ProjectRecord[];
};

type Tab = ProjectStatus;
type DialogState = { mode: "new" } | { mode: "edit"; id: string };

const tabs: { value: Tab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"));
}

export function ProjectsWorkspace({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [message, setMessage] = useState("");
  const rootRef = useRef<HTMLElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const domains = useMemo(
    () => [...new Set(projects.flatMap((item) => item.lifeDomains.length ? item.lifeDomains : item.domain ? [item.domain] : []))].sort((a, b) => a.localeCompare(b)),
    [projects],
  );
  const counts = useMemo(
    () => projects.reduce<Record<Tab, number>>((result, item) => {
      result[item.status] += 1;
      return result;
    }, { active: 0, completed: 0, archived: 0 }),
    [projects],
  );
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return projects.filter((item) => {
      if (item.status !== tab) return false;
      if (domainFilter !== "all" && !item.lifeDomains.includes(domainFilter) && item.domain !== domainFilter) return false;
      if (!query) return true;
      return [item.name, item.domain ?? "", item.description ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(query));
    });
  }, [domainFilter, projects, search, tab]);
  const selectedProject = dialog?.mode === "edit"
    ? projects.find((item) => item.id === dialog.id) ?? null
    : null;
  const highProgressCount = projects.filter(
    (item) => item.status === "active" && item.progress >= 75,
  ).length;

  const closeDialog = useCallback(() => setDialog(null), []);

  const handleSave = useCallback(async (draft: ProjectDraft) => {
    const saved = await updateProject(draft);
    setProjects((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved];
    });
    setMessage("Project changes saved.");
    setDialog(null);
  }, []);

  const handleCreate = useCallback(async (draft: CreateProjectInput) => {
    const saved = await createProject(draft);
    setProjects((current) => [...current, saved]);
    setMessage("Project created.");
    setDialog(null);
  }, []);

  const handleStatusChange = useCallback(async (
    projectId: string,
    status: ProjectStatus,
  ) => {
    const updated = await setProjectStatus(projectId, status);
    setProjects((current) => current.map((item) => item.id === updated.id ? updated : item));
    const statusMessage = status === "completed"
      ? "Project marked complete."
      : status === "archived"
        ? "Project archived. You can restore it from the Archived tab."
        : "Project restored to Active.";
    setMessage(statusMessage);
  }, []);

  useEffect(() => {
    function handleShortcuts(event: KeyboardEvent) {
      if (event.defaultPrevented || dialog || isEditableTarget(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setDialog({ mode: "new" });
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const rows = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-project-row]") ?? [])];
      if (rows.length === 0) return;
      event.preventDefault();
      const currentIndex = rows.findIndex((row) => row === document.activeElement);
      const step = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex < 0
        ? (step > 0 ? 0 : rows.length - 1)
        : (currentIndex + step + rows.length) % rows.length;
      rows[nextIndex]?.focus();
    }

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [dialog]);

  useEffect(() => {
    if (!filterOpen) return;

    function dismissFilter(event: PointerEvent) {
      if (event.target instanceof Node && !filterRef.current?.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterOpen(false);
    }

    document.addEventListener("pointerdown", dismissFilter);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissFilter);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [filterOpen]);

  const clearFilters = () => {
    setSearch("");
    setDomainFilter("all");
  };
  const hasFilters = Boolean(search.trim()) || domainFilter !== "all";

  return (
    <section aria-label="Projects" className={styles.page} ref={rootRef}>
      <header className={styles.pageHeader}>
        <div className={styles.heading}>
          <div className={styles.eyebrow}>
            <span>Strategic portfolios</span>
            <span aria-hidden="true" className={styles.eyebrowDivider}>•</span>
            <span className={styles.eyebrowAccent}>Project tracking</span>
          </div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>
            Active initiatives and strategic focus areas across your life domains.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.filterWrap} ref={filterRef}>
            <button
              aria-controls="project-filters"
              aria-expanded={filterOpen}
              className={`${styles.filterButton}${hasFilters ? ` ${styles.filterActive}` : ""}`}
              onClick={() => setFilterOpen((open) => !open)}
              type="button"
            >
              <Filter aria-hidden="true" size={15} />
              Filter
              {hasFilters && (
                <span className={styles.filterCount}>
                  {Number(Boolean(search.trim())) + Number(domainFilter !== "all")}
                </span>
              )}
              <ChevronDown aria-hidden="true" className={styles.filterChevron} size={13} />
            </button>
            {filterOpen && (
              <div aria-label="Project filters" className={styles.filterPanel} id="project-filters" role="group">
                <div className={styles.filterPanelHeading}>
                  <strong>Filter projects</strong>
                  <button aria-label="Close filters" className={styles.iconButtonSmall} onClick={() => setFilterOpen(false)} type="button">
                    <X aria-hidden="true" size={15} />
                  </button>
                </div>
                <label className={styles.filterField}>
                  <span>Domain</span>
                  <select onChange={(event) => setDomainFilter(event.target.value)} value={domainFilter}>
                    <option value="all">All domains</option>
                    {domains.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                {hasFilters && (
                  <button className={styles.clearFilters} onClick={clearFilters} type="button">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          <button className={styles.newProjectButton} onClick={() => setDialog({ mode: "new" })} type="button">
            <Plus aria-hidden="true" size={16} />
            <span>New project</span>
            <kbd>⌘N</kbd>
          </button>
        </div>
      </header>

      <section aria-label="Project portfolio" className={styles.portfolio}>
        <div className={styles.portfolioToolbar}>
          <div aria-label="Project status" className={styles.tabs} role="tablist">
            {tabs.map((item) => (
              <button
                aria-selected={tab === item.value}
                aria-controls="projects-panel"
                className={`${styles.tab}${tab === item.value ? ` ${styles.tabActive}` : ""}`}
                id={`projects-tab-${item.value}`}
                key={item.value}
                onClick={() => setTab(item.value)}
                role="tab"
                type="button"
              >
                {item.label}
                <span className={styles.tabCount}>{counts[item.value]}</span>
              </button>
            ))}
          </div>
          <div className={styles.toolbarMeta}>
            {highProgressCount > 0 && tab === "active" && (
              <span className={styles.insightBadge}>
                <Check aria-hidden="true" size={13} />
                {highProgressCount} {highProgressCount === 1 ? "project" : "projects"} at 75%+ progress
              </span>
            )}
            <label className={styles.searchBox}>
              <Search aria-hidden="true" size={15} />
              <span className={styles.visuallyHidden}>Search projects</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search initiatives"
                ref={searchRef}
                type="search"
                value={search}
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")} type="button">
                  <X aria-hidden="true" size={14} />
                </button>
              )}
            </label>
          </div>
        </div>

        <div className={styles.tableHeader} aria-hidden="true">
          <span>Initiative</span>
          <span>Domain</span>
          <span>Target date</span>
          <span>Health &amp; progress</span>
        </div>

        <div
          aria-labelledby={`projects-tab-${tab}`}
          className={styles.tabPanel}
          id="projects-panel"
          role="tabpanel"
          tabIndex={0}
        >
          {filteredProjects.length > 0 ? (
            <div className={styles.projectList}>
              {filteredProjects.map((item) => (
                <ProjectRow
                  key={item.id}
                  onOpen={(selected) => setDialog({ mode: "edit", id: selected.id })}
                  project={item}
                  today={today}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                {hasFilters ? <Search aria-hidden="true" size={19} /> : tab === "archived" ? <Archive aria-hidden="true" size={19} /> : <FolderKanban aria-hidden="true" size={19} />}
              </div>
              <h2>{hasFilters ? "No matching projects" : `No ${tab} projects yet`}</h2>
              <p>
                {hasFilters
                  ? "Try a different search or clear your filters."
                  : tab === "active"
                    ? "Create an initiative to give your next focus area a home."
                    : tab === "completed"
                      ? "Projects you mark complete will be collected here."
                      : "Archived projects stay here until you restore them."}
              </p>
              {hasFilters ? (
                <button className={styles.subtleButton} onClick={clearFilters} type="button">Clear filters</button>
              ) : tab === "active" ? (
                <button className={styles.newProjectButton} onClick={() => setDialog({ mode: "new" })} type="button">
                  <Plus aria-hidden="true" size={15} /> Create a project
                </button>
              ) : null}
            </div>
          )}
        </div>

        <footer className={styles.listFooter}>
          <div className={styles.keyboardHints}>
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Open initiative</span>
            <span><kbd>F</kbd> Search</span>
          </div>
          <p>
            Showing <strong>{filteredProjects.length}</strong> of <strong>{counts[tab]}</strong> {tab} {counts[tab] === 1 ? "initiative" : "initiatives"}
            {hasFilters && <span> · filtered</span>}
          </p>
        </footer>
      </section>

      {message && (
        <div aria-live="polite" className={styles.statusMessage} role="status">
          <Check aria-hidden="true" size={15} />
          <span>{message}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage("")} type="button">
            <X aria-hidden="true" size={14} />
          </button>
        </div>
      )}

      {dialog && (
        dialog.mode === "new" ? (
          <CreateProjectModal onClose={closeDialog} onCreate={handleCreate} />
        ) : (
          <ProjectDialog
            domains={domains}
            onClose={closeDialog}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
            project={selectedProject}
          />
        )
      )}
    </section>
  );
}

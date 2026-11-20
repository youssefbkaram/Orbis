"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react";
import { navigationGroups } from "../navigation";
import styles from "./Sidebar.module.scss";

type SidebarProps = {
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
};

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ collapsed, onClose, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Main navigation"
      className={styles.sidebar}
      data-collapsed={collapsed}
    >
      <div className={styles.brandBar}>
        <Link aria-label="Orbis home" className={styles.brand} href="/" onClick={onClose}>
          <span aria-hidden="true" className={styles.brandMark}>
            <span />
          </span>
          <span className={styles.brandName}>Orbis</span>
          <span className={styles.proBadge}>PRO</span>
        </Link>
        <button
          aria-label="Close navigation menu"
          className={`${styles.iconButton} ${styles.mobileClose}`}
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={`${styles.iconButton} ${styles.desktopToggle}`}
          onClick={onToggleCollapsed}
          type="button"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className={styles.navigation}>
        {navigationGroups.map((group) => (
          <section aria-label={group.label} className={styles.navGroup} key={group.label}>
            <h2 className={styles.groupLabel}>{group.label}</h2>
            <ul className={styles.navList}>
              {group.items.map(({ href, icon: Icon, label, badge }) => {
                const active = isActivePath(pathname, href);

                return (
                  <li key={href}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`${styles.navLink}${active ? ` ${styles.active}` : ""}`}
                      href={href}
                      onClick={onClose}
                      title={collapsed ? label : undefined}
                    >
                      <Icon aria-hidden="true" className={styles.navIcon} size={17} />
                      <span className={styles.navLabel}>{label}</span>
                      {badge && <span aria-label="New" className={styles.navDot} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <Link className={styles.assistant} href="/intelligence" onClick={onClose}>
        <span aria-hidden="true" className={styles.assistantIcon}>
          <Sparkles size={17} />
        </span>
        <span className={styles.assistantCopy}>
          <span>Orbis AI</span>
          <span>Assistant</span>
        </span>
        <ChevronRight aria-hidden="true" className={styles.assistantArrow} size={16} />
      </Link>
    </aside>
  );
}
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { navigationGroups } from "../navigation";
import styles from "./Topbar.module.scss";

type TopbarProps = {
  onMenuClick: () => void;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const currentGroup = navigationGroups.find((group) =>
    group.items.some(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
    ),
  );
  const currentItem = currentGroup?.items.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
  );
  const pageTitle =
    currentItem?.label ??
    pathname
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replaceAll("-", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) ??
    "Workspace";

  return (
    <header className={styles.topbar}>
      <div className={styles.breadcrumbs}>
        <button
          aria-label="Open navigation menu"
          className={`${styles.iconButton} ${styles.menuButton}`}
          onClick={onMenuClick}
          type="button"
        >
          <Menu size={19} />
        </button>
        <Link className={styles.workspaceLink} href="/">
          Workspace
        </Link>
        {currentGroup && (
          <>
            <ChevronRight aria-hidden="true" className={styles.separator} size={14} />
            <span className={styles.sectionName}>{currentGroup.label}</span>
          </>
        )}
        <ChevronRight aria-hidden="true" className={styles.separator} size={14} />
        <span aria-current="page" className={styles.currentPage}>
          {pageTitle}
        </span>
      </div>

      <div className={styles.actions}>
        <label className={styles.search}>
          <Search aria-hidden="true" size={16} />
          <span className={styles.visuallyHidden}>Search workspace</span>
          <input placeholder="Search workspace..." type="search" />
          <kbd>⌘ K</kbd>
        </label>
        <Link className={styles.captureButton} href="/inbox">
          <Plus aria-hidden="true" size={16} />
          <span>Capture</span>
        </Link>
        <button aria-label="Notifications" className={styles.notification} type="button">
          <Bell size={18} />
          <span aria-hidden="true" className={styles.notificationDot} />
        </button>
        <details className={styles.profileMenu}>
          <summary aria-label={`Account menu for ${user.name}`} className={styles.profile}>
            <span aria-hidden="true" className={styles.avatar}>
              {getInitials(user.name || user.email)}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={styles.profileChevron}
              size={14}
            />
          </summary>
          <div className={styles.accountDropdown}>
            <div className={styles.accountIdentity}>
              <span className={styles.accountName}>{user.name}</span>
              <span className={styles.accountEmail}>{user.email}</span>
            </div>
            <Link className={styles.accountLink} href="/settings">
              Account settings
            </Link>
            {signOutError && (
              <p className={styles.signOutError} role="alert">
                {signOutError}
              </p>
            )}
            <button
              className={styles.signOutButton}
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                setSignOutError("");
                try {
                  const result = await authClient.signOut();
                  if (result.error) {
                    setSignOutError("Could not sign out. Please try again.");
                    return;
                  }
                  router.replace("/sign-in");
                  router.refresh();
                } catch {
                  setSignOutError("Could not sign out. Please try again.");
                } finally {
                  setSigningOut(false);
                }
              }}
              type="button"
            >
              <LogOut aria-hidden="true" size={15} />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
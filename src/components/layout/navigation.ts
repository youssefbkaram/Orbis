import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckSquare,
  Compass,
  Flag,
  Folder,
  Goal,
  Inbox,
  LayoutDashboard,
  Repeat2,
  Settings,
  Sun,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: boolean;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "My Day", href: "/my-day", icon: Sun },
      { label: "Capture Inbox", href: "/inbox", icon: Inbox },
    ],
  },
  {
    label: "Organize",
    items: [
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Projects", href: "/projects", icon: Folder },
      { label: "Goals", href: "/goals", icon: Goal },
      { label: "Calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "My Life",
    items: [
      { label: "Life Domains", href: "/life-domains", icon: Compass },
      { label: "Habits", href: "/habits", icon: Repeat2 },
      { label: "Development Areas", href: "/development-areas", icon: TrendingUp },
      { label: "Milestones", href: "/milestones", icon: Flag },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Intelligence", href: "/intelligence", icon: Zap, badge: true },
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "Insights & Analytics", href: "/insights", icon: BarChart3 },
      { label: "Activity History", href: "/activity", icon: Activity },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

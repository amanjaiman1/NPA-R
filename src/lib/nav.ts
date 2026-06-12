import {
  LayoutDashboard,
  NotebookPen,
  Milestone,
  Newspaper,
  Repeat,
  TriangleAlert,
  Flame,
  Layers,
  BarChart3,
  Network,
  CalendarCheck,
  Quote,
  ListChecks,
  Target,
  BookOpen,
  Sparkles,
  Trophy,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  short: string; // for command palette keyword / tooltip
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Command",
    items: [
      { label: "Command Center", href: "/", icon: LayoutDashboard, short: "Dashboard overview" },
      { label: "Milestone Timeline", href: "/timeline", icon: Milestone, short: "The journey so far" },
    ],
  },
  {
    label: "Daily Engine",
    items: [
      { label: "Daily Journal", href: "/journal", icon: NotebookPen, short: "Log today" },
      { label: "Current Affairs", href: "/current-affairs", icon: Newspaper, short: "News vault" },
      { label: "Revision", href: "/revision", icon: Repeat, short: "Spaced repetition" },
      { label: "Mistake Tracker", href: "/mistakes", icon: TriangleAlert, short: "Learn from errors" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Study Heatmap", href: "/heatmap", icon: Flame, short: "Consistency map" },
      { label: "Subject Progress", href: "/subjects", icon: Layers, short: "Syllabus mastery" },
      { label: "Mock Analytics", href: "/mocks", icon: BarChart3, short: "Test performance" },
      { label: "Knowledge Graph", href: "/knowledge-graph", icon: Network, short: "Connected concepts" },
    ],
  },
  {
    label: "Reflect & Review",
    items: [
      { label: "Reviews", href: "/reviews", icon: CalendarCheck, short: "Weekly · Monthly · Yearly" },
      { label: "Reflections", href: "/reflections", icon: Quote, short: "Emotional journal" },
    ],
  },
  {
    label: "Life & Discipline",
    items: [
      { label: "Habits", href: "/habits", icon: ListChecks, short: "Daily disciplines" },
      { label: "Life Dashboard", href: "/wellbeing", icon: HeartPulse, short: "Sleep, movement, focus & correlations" },
      { label: "Goals", href: "/goals", icon: Target, short: "What you're chasing" },
      { label: "Library", href: "/books", icon: BookOpen, short: "Book progress" },
    ],
  },
  {
    label: "Endgame",
    items: [
      { label: "AI Study Coach", href: "/coach", icon: Sparkles, short: "Insights & guidance" },
      { label: "Selection Archive", href: "/archive", icon: Trophy, short: "The result journey" },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return allNavItems[0];
  return allNavItems
    .filter((i) => i.href !== "/")
    .find((i) => pathname.startsWith(i.href));
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, Search, Moon, Sun } from "lucide-react";
import { navGroups } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { useChronicle } from "@/lib/store";
import { useMounted } from "@/lib/hooks";
import { daysBetween, toISODate } from "@/lib/utils";

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  onOpenPalette,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  onOpenPalette: () => void;
}) {
  const pathname = usePathname();
  const profile = useChronicle((s) => s.profile);
  const theme = useChronicle((s) => s.theme);
  const toggleTheme = useChronicle((s) => s.toggleTheme);
  const mounted = useMounted();

  const daysLeft = mounted
    ? daysBetween(toISODate(new Date()), profile.examDate)
    : null;
  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-paper/[0.08] bg-ink/80 backdrop-blur-xl",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-[76px]" : "w-[270px]",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 overflow-hidden"
        >
          <Logo className="shrink-0" />
          {!collapsed && (
            <div className="min-w-0 leading-tight animate-fade-in-fast">
              <p className="truncate font-display text-[0.95rem] font-medium tracking-tight text-paper">
                The UPSC Chronicle
              </p>
              <p className="truncate text-[0.65rem] uppercase tracking-[0.18em] text-paper/40">
                Prep, documented
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Search trigger */}
      <div className="px-3">
        <button
          onClick={onOpenPalette}
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-xl border border-paper/10 bg-paper/[0.03] px-3 py-2 text-paper/50 transition-all hover:border-paper/20 hover:bg-paper/[0.06]",
            collapsed && "justify-center px-0",
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm">Search…</span>
              <kbd className="ml-auto rounded-md border border-paper/10 bg-paper/[0.04] px-1.5 py-0.5 font-mono text-[0.6rem] text-paper/40">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="mask-fade-b no-scrollbar mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-paper/30">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-accent/[0.12] text-paper"
                          : "text-paper/55 hover:bg-paper/[0.04] hover:text-paper",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                      )}
                      <Icon
                        className={cn(
                          "h-[1.05rem] w-[1.05rem] shrink-0 transition-transform duration-200",
                          active ? "text-accent" : "text-paper/45 group-hover:text-paper/80",
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate tracking-snugg">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: profile + controls */}
      <div className="border-t border-paper/[0.08] p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-2 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-info text-accent-fg">
            <span className="text-xs font-semibold">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-paper">
                {profile.name}
              </p>
              <p className="truncate text-[0.7rem] text-paper/45">
                {daysLeft !== null ? `${daysLeft} days to exam` : profile.targetExam}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleTheme}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-paper/45 transition-colors hover:bg-paper/[0.06] hover:text-paper"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className={cn(
            "mt-1 hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-paper/40 transition-colors hover:bg-paper/[0.05] hover:text-paper/70 lg:flex",
            collapsed && "justify-center px-0",
          )}
        >
          <PanelLeftClose
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

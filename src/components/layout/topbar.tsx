"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Plus, Palette, CalendarClock } from "lucide-react";
import { findNavItem } from "@/lib/nav";
import { Logo } from "./logo";
import { SyncStatus } from "./sync-status";
import { useChronicle } from "@/lib/store";
import { useMounted } from "@/lib/hooks";
import { daysBetween, toISODate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Topbar({
  onOpenDrawer,
  onOpenPalette,
  onOpenAppearance,
}: {
  onOpenDrawer: () => void;
  onOpenPalette: () => void;
  onOpenAppearance: () => void;
}) {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  const profile = useChronicle((s) => s.profile);
  const mounted = useMounted();
  const daysLeft = mounted
    ? daysBetween(toISODate(new Date()), profile.examDate)
    : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-paper/[0.08] bg-ink/70 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile: menu + brand */}
      <button
        onClick={onOpenDrawer}
        className="grid h-9 w-9 place-items-center rounded-lg text-paper/60 transition-colors hover:bg-paper/[0.06] hover:text-paper lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/" className="flex items-center gap-2 lg:hidden">
        <Logo className="h-6 w-6" />
      </Link>

      {/* Desktop: current section label */}
      <div className="hidden items-center gap-2 lg:flex">
        {current?.icon && <current.icon className="h-4 w-4 text-paper/40" />}
        <span className="text-sm font-medium tracking-snugg text-paper/80">
          {current?.label ?? "The UPSC Chronicle"}
        </span>
      </div>

      <div className="flex-1" />

      {/* Exam countdown chip */}
      {daysLeft !== null && (
        <div className="hidden items-center gap-2 rounded-full border border-paper/10 bg-paper/[0.03] px-3 py-1.5 sm:flex">
          <CalendarClock className="h-3.5 w-3.5 text-paper/45" />
          <span className="tabular text-xs text-paper/70">
            <span className="font-semibold text-paper">{daysLeft}</span> days to{" "}
            {profile.targetExam.replace("UPSC ", "")}
          </span>
        </div>
      )}

      <button
        onClick={onOpenPalette}
        className="grid h-9 w-9 place-items-center rounded-lg text-paper/60 transition-colors hover:bg-paper/[0.06] hover:text-paper sm:hidden"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      <button
        onClick={onOpenAppearance}
        className="grid h-9 w-9 place-items-center rounded-lg text-paper/60 transition-colors hover:bg-paper/[0.06] hover:text-paper lg:hidden"
        aria-label="Settings"
      >
        <Palette className="h-5 w-5" />
      </button>

      <SyncStatus />

      <Link
        href="/journal?new=1"
        className={cn(
          "hidden items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-soft transition-all hover:opacity-90 hover:-translate-y-px sm:flex",
        )}
      >
        <Plus className="h-4 w-4" />
        Log today
      </Link>
    </header>
  );
}

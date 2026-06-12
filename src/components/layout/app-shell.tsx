"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();

  // restore collapse preference
  useEffect(() => {
    const v = localStorage.getItem("upsc-chronicle-sidebar");
    if (v === "1") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("upsc-chronicle-sidebar", next ? "1" : "0");
      return next;
    });
  }

  // ⌘K / Ctrl+K to open the palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex h-[100dvh] overflow-hidden">
      {/* ambient background — a living field of blooms */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-bloom-field" />
        <div className="absolute inset-0 bg-grid bg-grid opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        {/* drifting petal-glows */}
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-bloom-float rounded-full bg-bloom-rose/25 blur-[90px]" />
        <div className="absolute right-[-5rem] top-10 h-72 w-72 animate-bloom-float-2 rounded-full bg-bloom-lilac/25 blur-[90px]" />
        <div className="absolute bottom-[-6rem] right-1/4 h-96 w-96 animate-bloom-drift rounded-full bg-bloom-sky/20 blur-[110px]" />
        <div className="absolute bottom-4 left-[-4rem] h-72 w-72 animate-bloom-float rounded-full bg-bloom-mint/20 blur-[90px] [animation-delay:-6s]" />
        <div className="absolute left-1/3 top-1/3 h-64 w-64 animate-bloom-drift rounded-full bg-bloom-marigold/15 blur-[100px] [animation-delay:-12s]" />
        <div className="absolute right-1/3 top-2/3 h-60 w-60 animate-bloom-float-2 rounded-full bg-bloom-peach/20 blur-[90px] [animation-delay:-9s]" />
        {/* Dark mode: a 90% ink scrim keeps the canvas dominant, leaving the blooms as a subtle wash. */}
        <div className="bloom-scrim absolute inset-0" />
      </div>

      {/* Desktop sidebar */}
      <div className="z-20 hidden shrink-0 lg:block">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onOpenPalette={() => setPaletteOpen(true)}
        />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <Sidebar
                collapsed={false}
                onToggleCollapse={toggleCollapse}
                onNavigate={() => setDrawerOpen(false)}
                onOpenPalette={() => {
                  setDrawerOpen(false);
                  setPaletteOpen(true);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="no-scrollbar relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

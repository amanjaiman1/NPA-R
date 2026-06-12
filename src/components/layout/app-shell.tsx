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
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-radial-accent opacity-90" />
        <div className="absolute inset-0 bg-radial-accent-2 opacity-80" />
        <div className="absolute inset-0 bg-radial-fade opacity-40" />
        <div className="absolute inset-0 bg-grid bg-grid opacity-[0.5] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
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

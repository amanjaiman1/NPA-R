"use client";

import { Check } from "lucide-react";
import { useChronicle } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { SURFACES, PALETTES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { DataBackup } from "./data-backup";

export function AppearanceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const surface = useChronicle((s) => s.surface);
  const palette = useChronicle((s) => s.palette);
  const setSurface = useChronicle((s) => s.setSurface);
  const setPalette = useChronicle((s) => s.setPalette);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      description="Personalise the Chronicle, and keep a safe copy of your data."
      className="sm:max-w-lg"
    >
      <div className="space-y-7">
        {/* Background */}
        <section>
          <p className="eyebrow mb-3">Background</p>
          <div className="grid grid-cols-3 gap-2.5">
            {SURFACES.map((s) => {
              const active = surface === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSurface(s.id)}
                  className={cn(
                    "group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
                    active
                      ? "border-accent ring-1 ring-accent/40"
                      : "border-paper/12 hover:border-paper/30",
                  )}
                >
                  <span
                    className="h-12 w-full rounded-lg border border-paper/12"
                    style={{ backgroundColor: s.swatch }}
                  />
                  <span className="text-xs font-medium text-paper">{s.label}</span>
                  <span className="text-[0.65rem] text-paper/45">{s.hint}</span>
                  {active && (
                    <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-fg">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Internal colouring */}
        <section>
          <p className="eyebrow mb-3">Internal colouring</p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PALETTES.map((p) => {
              const active = palette === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl border p-3 transition-all",
                    active
                      ? "border-accent ring-1 ring-accent/40"
                      : "border-paper/12 hover:border-paper/30",
                  )}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-full border border-paper/12 shadow-soft">
                    {p.swatches.map((c, i) => (
                      <span
                        key={i}
                        className="h-7 w-3.5"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-xs font-medium text-paper">
                      {p.label}
                    </span>
                    <span className="block truncate text-[0.65rem] text-paper/45">
                      {p.hint}
                    </span>
                  </span>
                  {active && (
                    <span className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-fg">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Backup & data */}
        <section className="border-t border-paper/[0.08] pt-6">
          <DataBackup />
        </section>
      </div>
    </Modal>
  );
}

"use client";

import { useRef, useState } from "react";
import { Download, Upload, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  useChronicle,
  readCloudSnapshot,
  SNAPSHOT_KEYS,
} from "@/lib/store";
import type { CloudSnapshot } from "@/lib/store";

/** Bumped alongside the store's persisted `version`. Stamped into backups. */
const BACKUP_SCHEMA_VERSION = 7;
const BACKUP_APP_ID = "the-upsc-chronicle";

type Note = { kind: "ok" | "err"; text: string } | null;

/**
 * Export / import the entire chronicle as a portable JSON file.
 *
 * This is the user's own safety net: a backup they hold, independent of
 * Supabase or Vercel. Restoring writes the snapshot back into the live store,
 * which (when cloud sync is configured) also propagates it to Supabase.
 */
export function DataBackup() {
  const applyCloudSnapshot = useChronicle((s) => s.applyCloudSnapshot);
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<Note>(null);

  function handleExport() {
    try {
      const payload = {
        app: BACKUP_APP_ID,
        schemaVersion: BACKUP_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: readCloudSnapshot(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `upsc-chronicle-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNote({ kind: "ok", text: "Backup downloaded to your device." });
    } catch {
      setNote({ kind: "err", text: "Couldn't create the backup. Try again." });
    }
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as
        | { data?: Partial<CloudSnapshot> }
        | Partial<CloudSnapshot>;
      // Accept either our wrapped export ({ data: … }) or a raw snapshot.
      const data = (
        parsed && typeof parsed === "object" && "data" in parsed && parsed.data
          ? parsed.data
          : parsed
      ) as Partial<CloudSnapshot>;

      const known = SNAPSHOT_KEYS.some(
        (k) => data && Object.prototype.hasOwnProperty.call(data, k),
      );
      if (!known) {
        setNote({
          kind: "err",
          text: "That doesn't look like a Chronicle backup file.",
        });
        return;
      }

      const ok = window.confirm(
        "Restore this backup? It will replace your current data on this device" +
          " (and sync to the cloud if sign-in is enabled).",
      );
      if (!ok) return;

      applyCloudSnapshot(data);
      setNote({ kind: "ok", text: "Backup restored. Your chronicle is back." });
    } catch {
      setNote({
        kind: "err",
        text: "Couldn't read that file. Make sure it's a valid backup.",
      });
    }
  }

  return (
    <div>
      <p className="eyebrow mb-1">Backup &amp; restore</p>
      <p className="mb-3 text-xs leading-relaxed text-paper/45">
        Download a copy of everything you&apos;ve logged. Keep it somewhere safe
        so you never lose your chronicle, even offline.
      </p>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={handleExport}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg shadow-soft transition-all hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download backup
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-paper/12 bg-paper/[0.03] px-4 py-2.5 text-sm font-medium text-paper/80 transition-all hover:border-paper/30 hover:bg-paper/[0.06]"
        >
          <Upload className="h-4 w-4" />
          Restore from file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = ""; // allow re-importing the same file
          }}
        />
      </div>

      {note && (
        <p
          className={
            "mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs " +
            (note.kind === "ok"
              ? "border border-accent/30 bg-accent/10 text-paper/80"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-300")
          }
        >
          {note.kind === "ok" ? (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          )}
          {note.text}
        </p>
      )}
    </div>
  );
}

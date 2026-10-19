"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { getCollection } from "@/lib/hq/collections";
import { canEdit } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { useCollection, useHq } from "@/components/hq/data";
import { RecordForm } from "@/components/hq/fields";

type Rec = Record<string, unknown>;

interface Props {
  name: string;
  onClose: () => void;
  subtitle?: React.ReactNode;
  /** shown above the form, with the record as it is being typed (links and shortcuts that belong to this record) */
  extra?: (record: Rec) => React.ReactNode;
}

function Inner({ name, initial, onClose, subtitle, extra }: Props & { initial: Rec }) {
  const def = getCollection(name)!;
  const { user, store } = useHq();
  const { save, remove } = useCollection(name);
  const canWrite = canEdit(user, def.write) && store.writable;
  const isNew = !initial.id;
  const [draft, setDraft] = useState<Rec>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSave() {
    setBusy(true);
    setError("");
    try {
      await save(draft);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!draft.id || !window.confirm(`Delete this ${def.singular.toLowerCase()}? It stays in the repository history and can be restored.`)) return;
    setBusy(true);
    try {
      await remove(String(draft.id));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? `New ${def.singular.toLowerCase()}` : String(draft[def.titleField] || def.singular)}
      subtitle={subtitle ?? def.description}
      footer={
        <div className="flex items-center gap-2">
          {!isNew && canWrite && (
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={busy} className="text-bad hover:bg-bad/10">
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              {canWrite ? "Cancel" : "Close"}
            </Button>
            {canWrite && (
              <Button onClick={onSave} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} {isNew ? "Create" : "Save changes"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      {!canWrite && <p className="mb-4 rounded border border-graphite/15 bg-paper-200/50 px-3 py-2 text-sm text-charcoal">You can view this but not change it.</p>}
      {extra?.(draft)}
      <RecordForm def={def} value={draft} onChange={setDraft} disabled={!canWrite || busy} />
    </Drawer>
  );
}

/** Generic create / edit drawer for any HQ collection. Pass `initial` (null = closed); remounts per record. */
export function RecordDrawer({ initial, ...rest }: Props & { initial: Rec | null }) {
  if (!initial) return null;
  return <Inner key={String(initial.id ?? `new-${String(initial.date ?? "")}-${String(initial.title ?? "")}`)} initial={initial} {...rest} />;
}

/** Defaults for a brand-new record of a collection (field defaults + overrides). */
export function blankRecord(name: string, overrides: Rec = {}): Rec {
  const def = getCollection(name);
  const base = Object.fromEntries((def?.fields ?? []).filter((f) => f.default !== undefined).map((f) => [f.key, f.default]));
  return { ...base, ...overrides };
}

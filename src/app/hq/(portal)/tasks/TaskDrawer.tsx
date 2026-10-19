"use client";

import { useState } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { RecordForm } from "@/components/hq/fields";
import { formatDateTime } from "@/lib/utils";
import { isDone, str, tasksDef, type Task } from "./taskUtils";

/** Edit drawer for one task (used from the board; the list view uses CollectionManager's own). */
export function TaskDrawer({ task, canWrite, readOnlyReason, onClose, onSave, onRemove }: { task: Task | null; canWrite: boolean; readOnlyReason: string; onClose: () => void; onSave: (record: Task) => Promise<unknown>; onRemove: (id: string) => Promise<unknown> }) {
  // derive the editable draft from the selected task during render (no effect needed)
  const [draft, setDraft] = useState<Task | null>(task ? { ...task } : null);
  const [seen, setSeen] = useState<Task | null>(task);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (task !== seen) {
    setSeen(task);
    setDraft(task ? { ...task } : null);
    setError("");
  }

  async function run(fn: () => Promise<unknown>) {
    setSaving(true);
    setError("");
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const title = str(draft?.title);

  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      width="max-w-xl"
      title={title ? `Task: ${title.length > 56 ? `${title.slice(0, 56)}…` : title}` : "Task"}
      subtitle={draft?.updatedAt ? `Last updated ${formatDateTime(str(draft.updatedAt))} by ${str(draft.updatedBy) || "—"}` : tasksDef.description}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && draft?.id ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (window.confirm("Delete this task? The deletion is recorded in the history.")) run(() => onRemove(String(draft.id)));
              }}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10"
            >
              <Trash2 className="size-3.5" aria-hidden /> Delete
            </button>
          ) : null}
          {canWrite && draft && !isDone(draft) && (
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => run(() => onSave({ ...draft, status: "done" }))}>
              <Check className="size-4" aria-hidden /> Mark done
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {canWrite ? "Cancel" : "Close"}
            </Button>
            {canWrite && (
              <Button size="sm" disabled={saving || !title.trim()} onClick={() => draft && run(() => onSave(draft))}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} Save
              </Button>
            )}
          </div>
        </div>
      }
    >
      {draft && (
        <>
          {!canWrite && <p className="mb-4 rounded border border-graphite/15 bg-graphite/5 px-3 py-2 text-xs text-charcoal">{readOnlyReason}</p>}
          <RecordForm def={tasksDef} value={draft} onChange={(next) => setDraft(next as Task)} disabled={!canWrite} />
          {error && (
            <p role="alert" className="mt-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
              {error}
            </p>
          )}
        </>
      )}
    </Drawer>
  );
}

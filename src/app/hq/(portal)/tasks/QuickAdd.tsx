"use client";

import { useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/form";
import { AREAS, PRIORITIES } from "./taskUtils";

/** One-line task capture: type, press Enter. Assignee, area, priority and date are optional. */
export function QuickAdd({ assignees, defaultAssignee, onAdd }: { assignees: string[]; defaultAssignee: string; onAdd: (task: Record<string, unknown>) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [area, setArea] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setNote({ ok: false, text: "Type what needs doing first." });
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await onAdd({ title: t, status: "todo", priority, assignee, ...(area ? { area } : {}), ...(due ? { dueDate: due } : {}) });
      setTitle("");
      setDue("");
      setNote({ ok: true, text: `Added “${t.length > 48 ? `${t.slice(0, 48)}…` : t}” to To do.` });
      inputRef.current?.focus();
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Could not add the task." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="no-print mb-4 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-3 sm:p-4" aria-label="Add a task">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task… e.g. “Call St. Mary’s principal about the pilot”" aria-label="Task title" maxLength={160} className="flex-1" />
        <Button type="submit" size="md" disabled={busy} className="h-10 shrink-0">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />} Add task
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee" className="h-9 text-xs">
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area" className="h-9 text-xs">
          <option value="">No area</option>
          {AREAS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority" className="h-9 text-xs">
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} priority
            </option>
          ))}
        </Select>
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className="h-9 text-xs" />
      </div>
      <p role="status" aria-live="polite" className={note ? (note.ok ? "mt-2 text-xs text-ok" : "mt-2 text-xs text-bad") : "sr-only"}>
        {note?.text}
      </p>
    </form>
  );
}

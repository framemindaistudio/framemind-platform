"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { useCollection, useHq } from "@/components/hq/data";
import { RecordForm } from "@/components/hq/fields";
import { formatDateTime } from "@/lib/utils";
import { Notice } from "@/components/hq/sales/bits";
import { checklistFor, inputsFor, servicesOf, str } from "./logic";

const projectsDef = getCollection("projects")!;

export function newProjectDraft(overrides: Record<string, unknown> = {}) {
  return { ...Object.fromEntries(projectsDef.fields.filter((f) => f.default !== undefined).map((f) => [f.key, f.default])), ...overrides };
}

/** Create / edit drawer for a project. A new project gets the studio checklist and client-input list for its services. */
export function ProjectFormDrawer({ value, onChange, onClose, onSaved }: { value: Record<string, unknown> | null; onChange: (v: Record<string, unknown>) => void; onClose: () => void; onSaved?: (r: BaseRecord, isNew: boolean) => void }) {
  const { user, store } = useHq();
  const { save } = useCollection("projects");
  const canWrite = can(user, projectsDef.write) && store.writable;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isNew = !value?.id;

  async function onSave() {
    if (!value) return;
    if (!str(value.title).trim()) {
      setError("Give the project a title.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const services = servicesOf(value as BaseRecord);
      const record = isNew
        ? {
            ...value,
            services,
            checklist: Array.isArray(value.checklist) && value.checklist.length ? value.checklist : checklistFor(services),
            inputs: Array.isArray(value.inputs) && value.inputs.length ? value.inputs : inputsFor(services),
          }
        : value;
      const saved = await save(record);
      onSaved?.(saved, isNew);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={!!value}
      onClose={() => {
        setError("");
        onClose();
      }}
      title={isNew ? "New project" : `Edit: ${str(value?.title) || "Project"}`}
      subtitle={value?.updatedAt ? `Last updated ${formatDateTime(str(value.updatedAt))} by ${str(value.updatedBy) || "—"}` : "A new project gets the studio checklist for its services. Projects started from an accepted quote also get the payment milestones."}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {canWrite ? "Cancel" : "Close"}
          </Button>
          {canWrite && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} {isNew ? "Create project" : "Save changes"}
            </Button>
          )}
        </div>
      }
    >
      {value && (
        <>
          {!canWrite && <Notice className="mb-4">{store.writable || store.viewOnly ? "You have view-only access to projects." : "HQ is in read-only mode."}</Notice>}
          <RecordForm def={projectsDef} value={value} onChange={onChange} disabled={!canWrite} />
          {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
        </>
      )}
    </Drawer>
  );
}

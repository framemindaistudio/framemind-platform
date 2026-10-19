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
import { Notice } from "./bits";

const clientsDef = getCollection("clients")!;

/** Defaults for a brand-new client record (schema defaults + overrides). */
export function newClientDraft(overrides: Record<string, unknown> = {}) {
  return { ...Object.fromEntries(clientsDef.fields.filter((f) => f.default !== undefined).map((f) => [f.key, f.default])), ...overrides };
}

/**
 * Schema-driven create / edit drawer for clients.
 * Controlled: pass a draft to open, null to close.
 */
export function ClientFormDrawer({
  value,
  onChange,
  onClose,
  onSaved,
}: {
  value: Record<string, unknown> | null;
  onChange: (next: Record<string, unknown>) => void;
  onClose: () => void;
  onSaved?: (record: BaseRecord, isNew: boolean) => void;
}) {
  const { user, store } = useHq();
  const { save } = useCollection("clients");
  const canWrite = can(user, clientsDef.write) && store.writable;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isNew = !value?.id;

  async function onSave() {
    if (!value) return;
    if (!String(value.name ?? "").trim()) {
      setError("Client name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await save(value);
      onSaved?.(saved, isNew);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setError("");
    onClose();
  }

  return (
    <Drawer
      open={!!value}
      onClose={close}
      title={isNew ? "New client" : `Edit: ${String(value?.name ?? "Client")}`}
      subtitle={value?.updatedAt ? `Last updated ${formatDateTime(String(value.updatedAt))} by ${String(value.updatedBy ?? "—")}` : "Every business, founder and institution — from first lead to repeat client."}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            {canWrite ? "Cancel" : "Close"}
          </Button>
          {canWrite && (
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} {isNew ? "Add client" : "Save changes"}
            </Button>
          )}
        </div>
      }
    >
      {value && (
        <>
          {!canWrite && <Notice className="mb-4">{store.writable || store.viewOnly ? "You have view-only access to clients." : "HQ is in read-only mode."}</Notice>}
          <RecordForm def={clientsDef} value={value} onChange={onChange} disabled={!canWrite} />
          {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
        </>
      )}
    </Drawer>
  );
}

"use client";

import { Modal } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";

/** Modal confirmation (replaces window.confirm so the flow stays on-brand and accessible). */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  danger,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} size="sm" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-charcoal">{children}</div>
      {error && (
        <p role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
    </Modal>
  );
}

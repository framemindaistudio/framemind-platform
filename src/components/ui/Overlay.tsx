"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function useLockBody(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}

/** Right-side drawer (HQ forms, detail panes). */
export function Drawer({ open, onClose, title, subtitle, width = "max-w-2xl", footer, children }: { open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; width?: string; footer?: React.ReactNode; children: React.ReactNode }) {
  useLockBody(open, onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className={cn("absolute inset-y-0 right-0 flex w-full flex-col bg-paper shadow-2xl", width)}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
          >
            <div className="bp-grid-fine flex items-start justify-between gap-4 border-b border-graphite/15 px-6 py-5">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-graphite">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-blueprint">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-charcoal hover:bg-graphite/10" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="hq-scroll flex-1 overflow-y-auto px-6 py-6" data-lenis-prevent>
              {children}
            </div>
            {footer && <div className="border-t border-graphite/15 bg-paper-50 px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Centered modal. */
export function Modal({ open, onClose, title, children, footer, size = "max-w-lg" }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; size?: string }) {
  useLockBody(open, onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cn("relative w-full overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-2xl", size)}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-graphite/15 px-6 py-4">
              <h2 className="text-base font-bold">{title}</h2>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-graphite/10" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="hq-scroll max-h-[70vh] overflow-y-auto px-6 py-5" data-lenis-prevent>
              {children}
            </div>
            {footer && <div className="flex justify-end gap-2 border-t border-graphite/15 bg-paper-50 px-6 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function ConfirmButton({ onConfirm, children, message = "Are you sure?", className }: { onConfirm: () => void; children: React.ReactNode; message?: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {children}
    </button>
  );
}

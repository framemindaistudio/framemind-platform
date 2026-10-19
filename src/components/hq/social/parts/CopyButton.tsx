"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";

/**
 * Copies a text and says so on the button itself. `what` finishes the sentence "Copy ..." for screen readers
 * ("the caption", "the hex of Paper"), so a row of copy buttons does not read as the same button seven times.
 */
export function CopyButton({
  text,
  what,
  label = "Copy",
  variant = "secondary",
  size = "sm",
  className,
  disabled,
}: {
  text: string;
  what: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      ok = false;
    }
    setState(ok ? "done" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), ok ? 1800 : 4000);
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} disabled={disabled} onClick={copy} aria-label={state === "idle" ? `${label}: ${what}` : undefined}>
      {state === "done" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span aria-live="polite">{state === "done" ? "Copied" : state === "failed" ? "Not copied: select it by hand" : label}</span>
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Palette } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { designLink, newDesignLink, type Post } from "./posts";

type Rec = Record<string, unknown>;

const captionOf = (r: Rec) => (typeof r.caption === "string" ? r.caption.trim() : "");
const titleOf = (r: Rec) => String(r.title || "Untitled");

/** Opens the design saved with a post in Create, with the words that were typed. Nothing is shown when there is none. */
export function OpenDesign({ post, compact, className }: { post: Rec; compact?: boolean; className?: string }) {
  const href = designLink(post as Post);
  if (!href) return null;
  return (
    <Link href={href} aria-label={`Open design: ${titleOf(post)}`} className={buttonClass(compact ? "ghost" : "secondary", "sm", className)}>
      <Palette className="size-3.5" aria-hidden /> Open design
    </Link>
  );
}

/** Puts the caption on the clipboard, ready to paste into the app. Disabled while the post has no caption. */
export function CopyCaption({ post, compact, className }: { post: Rec; compact?: boolean; className?: string }) {
  const text = captionOf(post);
  const [state, setState] = useState<"" | "copied" | "failed">("");

  useEffect(() => {
    if (!state) return;
    const id = setTimeout(() => setState(""), 2200);
    return () => clearTimeout(id);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // some browsers refuse without a secure page: the caption is still in the post to copy by hand
      setState("failed");
    }
  }

  const refused = "The browser did not allow copying. Open the post, select the caption and copy it by hand.";
  return (
    <>
      <button
        type="button"
        onClick={copy}
        disabled={!text}
        aria-label={`Copy caption: ${titleOf(post)}`}
        title={state === "failed" ? refused : text ? "Copies the caption and hashtags, ready to paste into the app." : "This post has no caption yet."}
        className={buttonClass(compact ? "ghost" : "secondary", "sm", cn(state === "failed" && "text-bad", className))}
      >
        {state === "copied" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : "Copy caption"}
      </button>
      {/* the button keeps its name, so the result is said here for a screen reader */}
      <span role="status" className="sr-only">
        {state === "copied" ? "Caption copied." : state === "failed" ? refused : ""}
      </span>
    </>
  );
}

/** The two things a person does with a planned post, shown at the top of its drawer. */
export function PostShortcuts({ post, canWrite }: { post: Rec; canWrite: boolean }) {
  const hasDesign = !!designLink(post as Post);
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 py-2.5">
      <p className="min-w-48 flex-1 text-xs leading-relaxed text-charcoal">
        {hasDesign ? (
          "A design is saved with this post. Open it to change the words or download it again."
        ) : canWrite ? (
          <>
            No design is saved with this post.{" "}
            <Link href={newDesignLink(post as Post)} className="font-semibold text-graphite underline underline-offset-2">
              Make one in Create
            </Link>{" "}
            and press “Save to this post”.
          </>
        ) : (
          "No design is saved with this post."
        )}
      </p>
      <OpenDesign post={post} />
      <CopyCaption post={post} />
    </div>
  );
}

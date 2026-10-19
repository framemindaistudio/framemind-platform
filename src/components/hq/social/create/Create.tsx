"use client";

import { useState } from "react";
import { getCollection } from "@/lib/hq/collections";
import { canEdit } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { useCollection, useHq } from "@/components/hq/data";
import { Loading } from "@/components/hq/ui";
import { templateById } from "@/lib/social/templates";
import type { TemplateDef } from "@/lib/social/types";
import { shortDate } from "@/lib/social/words";
import { PLAN, dayOf, type Post } from "../plan/posts";
import { Editor } from "./Editor";
import { Gallery } from "./Gallery";
import { decodeDraft, useFacts, useKit, type Draft } from "./kit";

/**
 * Social Studio → Create: the gallery of designs, and the editor for the one that is picked.
 * `draft` is a design opened from a link (the plan's "Open design"); `postId` is the planned post it is saved to.
 */
export function Create({ draft, postId, onOpenPlan, onLeaveDesign, onUnlinkPost }: { draft?: string; postId?: string; onOpenPlan: () => void; onLeaveDesign: () => void; onUnlinkPost: () => void }) {
  const kit = useKit();
  const facts = useFacts();
  const { user, store } = useHq();
  const posts = useCollection<Post>(PLAN);
  const [opened, setOpened] = useState<Draft | null>(() => decodeDraft(draft));
  const [picked, setPicked] = useState<TemplateDef | null>(() => templateById(opened?.t) ?? null);

  // only someone who may change the plan is ever saving to a post
  const mayPlan = canEdit(user, getCollection(PLAN)?.write) && store.writable;
  const post = mayPlan && postId ? (posts.records.find((r) => r.id === postId) ?? null) : null;

  if (!kit) return <Loading label="Getting the brand fonts and logo ready…" />;
  if (picked)
    return (
      <Editor
        key={picked.id}
        template={picked}
        kit={kit}
        facts={facts}
        initial={opened}
        post={post}
        onUnlinkPost={onUnlinkPost}
        onBack={() => {
          setPicked(null);
          // the linked design is closed: the next pick starts in its own size and look, with the words last typed
          setOpened(null);
          onLeaveDesign();
        }}
        onOpenPlan={onOpenPlan}
      />
    );
  return (
    <>
      {post && (
        <div role="note" className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-4 py-3">
          <p className="min-w-56 flex-1 text-sm text-charcoal">
            Pick a design for the planned post <strong className="text-graphite">“{String(post.title || "Untitled")}”</strong>
            {dayOf(post) ? ` (${shortDate(dayOf(post))})` : ""}. It will be saved to that post.
          </p>
          <Button variant="ghost" size="sm" onClick={onUnlinkPost}>
            Not for this post
          </Button>
        </div>
      )}
      <Gallery kit={kit} facts={facts} onPick={setPicked} />
    </>
  );
}

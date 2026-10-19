"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { BaseRecord } from "@/lib/hq/collections";
import { can, OPS_MEDIA } from "@/lib/hq/roles";
import { cn } from "@/lib/utils";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { StatCard } from "@/components/hq/ui";

interface Tst extends BaseRecord {
  name?: string;
  quote?: string;
  published?: boolean;
  consent?: boolean;
  featured?: boolean;
}

const CONSENT_ERROR = "Written consent is required before this can be published. Tick “Written consent to publish” once you hold it (an email or signed note is fine), then publish.";

export function TestimonialsTab() {
  const { records, save } = useCollection<Tst>("testimonials");
  const { user, store } = useHq();
  const canWrite = can(user, OPS_MEDIA) && store.writable;
  const [notice, setNotice] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const published = records.filter((r) => r.published).length;
  const awaiting = records.filter((r) => !r.consent).length;

  async function toggle(r: Tst) {
    const next = !r.published;
    if (next && !r.consent) {
      setNotice({ tone: "error", text: `${r.name || "This testimonial"}: ${CONSENT_ERROR}` });
      return;
    }
    setBusyId(r.id);
    setNotice(null);
    try {
      await save({ ...r, published: next });
      setNotice({ tone: "ok", text: next ? `Published. “${r.name || "Testimonial"}” will appear on the public site within about 5 minutes.` : `Unpublished. It will disappear from the public site within about 5 minutes.` });
    } catch (e) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : "Could not update the testimonial" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Testimonials" value={records.length} sub="Collected so far" />
        <StatCard label="On the website" value={published} sub="Published with consent" />
        <StatCard label="Without consent" value={awaiting} sub={awaiting ? "Cannot be published yet" : "All have consent"} />
        <div className="col-span-2 flex items-start gap-3 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 p-4 text-sm text-charcoal">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-graphite" aria-hidden />
          <p>
            Published testimonials appear on the public site within <strong>about 5 minutes</strong>. We only publish a quote when we hold written consent from the person (and a parent or guardian for students). Never edit a quote beyond spelling.
          </p>
        </div>
      </div>

      {notice && (
        <p role={notice.tone === "error" ? "alert" : "status"} className={cn("mb-4 flex items-start gap-2 rounded border px-3 py-2 text-sm", notice.tone === "error" ? "border-bad/30 bg-bad/10 text-bad" : "border-ok/30 bg-ok/10 text-ok")}>
          {notice.tone === "error" && <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
          {notice.text}
        </p>
      )}

      <CollectionManager<Tst>
        name="testimonials"
        columns={["name", "role", "organisation", "rating", "consent"]}
        newLabel="Add testimonial"
        emptyText="No testimonials yet. Ask the client for a short quote at handover, and record their written consent here."
        beforeSave={(r) => {
          if (r.published && !r.consent) throw new Error(CONSENT_ERROR);
          return r;
        }}
        extraColumns={[
          {
            key: "published",
            label: "On website",
            sortValue: (r) => (r.published ? 1 : 0),
            render: (r) => (
              <button
                type="button"
                role="switch"
                aria-checked={!!r.published}
                aria-label={`${r.published ? "Unpublish" : "Publish"} testimonial from ${r.name || "this person"}`}
                disabled={!canWrite || busyId === r.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(r);
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
                  r.published ? "border-graphite bg-graphite" : "border-graphite/30 bg-paper-200",
                )}
              >
                <span className={cn("inline-block size-4 rounded-full bg-paper shadow transition-transform", r.published ? "translate-x-[22px]" : "translate-x-[3px] bg-graphite/60")} />
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}

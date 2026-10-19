"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { api } from "@/components/hq/data";
import { rawHref } from "@/components/hq/docs/lib";
import { cn } from "@/lib/utils";
import { initials, str, type Rec } from "./team";

/** A portrait the shape of the ID card's photo box (4:5), 600×750, as a JPEG. The middle of the photo is kept. */
function portrait(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const W = 600, H = 750;
      const want = W / H;
      const have = img.naturalWidth / img.naturalHeight;
      // cut to 4:5 from the middle, a little above centre where faces usually are
      const sw = have > want ? img.naturalHeight * want : img.naturalWidth;
      const sh = have > want ? img.naturalHeight : img.naturalWidth / want;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = Math.max(0, (img.naturalHeight - sh) * 0.35);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const x = c.getContext("2d")!;
      x.fillStyle = "#ffffff";
      x.fillRect(0, 0, W, H);
      x.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a photo."));
    };
    img.src = url;
  });
}

/** The address of a member's photo inside HQ (cached until it changes). */
export const memberPhotoHref = (m: Rec) => (str(m.photo) ? `${rawHref(str(m.photo))}&v=${encodeURIComponent(str(m.photoUpdatedAt))}` : "");

/** The round picture on a member's card: their photo, or their initials; founders can add, change or remove it. */
export function MemberPhoto({ member, canEdit, onChanged }: { member: Rec; canEdit: boolean; onChanged: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = str(member.name);
  const src = memberPhotoHref(member);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const image = await portrait(file);
      await api("/api/hq/team/photo", { method: "PUT", body: JSON.stringify({ id: member.id, image }) });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The photo could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${name}'s photo? ID cards and the website show their initials instead.`)) return;
    setBusy(true);
    try {
      await api(`/api/hq/team/photo?id=${encodeURIComponent(member.id)}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const face = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Photo of ${name}`} className="size-full object-cover" />
  ) : (
    <span className="font-mono text-lg font-bold text-graphite">{initials(name)}</span>
  );

  return (
    <div className="shrink-0" data-photo={member.id}>
      <input ref={input} type="file" accept="image/*" className="sr-only" aria-label={`Photo of ${name}`} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
      {canEdit ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          title={src ? "Change the photo" : "Add a photo (for ID cards and the website)"}
          className="group relative grid size-14 place-items-center overflow-hidden rounded-full border-2 border-graphite bg-paper shadow-[var(--shadow-paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
        >
          {face}
          <span className={cn("absolute inset-0 grid place-items-center bg-ink/55 text-paper transition-opacity", busy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
          </span>
          <span className="sr-only">{src ? `Change ${name}'s photo` : `Add a photo of ${name}`}</span>
        </button>
      ) : (
        <span aria-hidden className="grid size-14 place-items-center overflow-hidden rounded-full border-2 border-graphite bg-paper shadow-[var(--shadow-paper)]">
          {face}
        </span>
      )}
      {canEdit && src && !busy && (
        <button type="button" onClick={remove} className="mt-1 flex w-14 items-center justify-center gap-0.5 text-[10px] font-semibold text-blueprint hover:text-bad">
          <Trash2 className="size-3" aria-hidden /> Remove
        </button>
      )}
      {canEdit && !src && !busy && <p className="mt-1 w-14 text-center text-[10px] font-semibold text-blueprint">Add photo</p>}
      {error && <p className="mt-1 max-w-40 text-[11px] text-bad">{error}</p>}
    </div>
  );
}

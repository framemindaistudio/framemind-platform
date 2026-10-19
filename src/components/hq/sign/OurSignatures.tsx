"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, ImageUp, Loader2, PenLine, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { api } from "@/components/hq/data";
import { cn } from "@/lib/utils";
import { useInks, type FounderInk } from "./useInks";

/**
 * A signature picture as it will print: only the ink. Light pixels (the paper) become see-through, the picture is
 * cut to the ink and scaled to at most 700 px wide.
 */
function inkOnly(source: CanvasImageSource, w: number, h: number): string | null {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(source, 0, 0, w, h);
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // paper and pale shadow go; the ink keeps its colour, and fades in at the edges so lines stay smooth
    const a = d[i + 3] === 0 ? 0 : lum > 200 ? 0 : lum > 150 ? Math.round(((200 - lum) / 50) * 255) : 255;
    d[i + 3] = Math.min(d[i + 3], a);
    if (d[i + 3] > 40) {
      const p = i / 4;
      const px = p % w, py = (p - px) / w;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }
  if (maxX < 0) return null;
  x.putImageData(img, 0, 0);
  const pad = 6;
  const cw = maxX - minX + 1 + pad * 2, ch = maxY - minY + 1 + pad * 2;
  const scale = Math.min(1, 700 / cw);
  const out = document.createElement("canvas");
  out.width = Math.round(cw * scale);
  out.height = Math.round(ch * scale);
  out.getContext("2d")!.drawImage(c, minX - pad, minY - pad, cw, ch, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

function fromFile(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      resolve(inkOnly(img, Math.round(img.naturalWidth * scale), Math.round(img.naturalHeight * scale)));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a picture."));
    };
    img.src = url;
  });
}

/** A pad to sign on with a finger, a pen or the mouse. */
function DrawPad({ onDone, onCancel }: { onDone: (png: string | null) => void; onCancel: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);
  useEffect(() => {
    const c = ref.current!;
    const x = c.getContext("2d")!;
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, c.width, c.height);
    x.lineCap = "round";
    x.lineJoin = "round";
    x.strokeStyle = "#1b2a5c";
    x.lineWidth = 5;
  }, []);
  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };
  return (
    <div>
      <canvas
        ref={ref}
        width={900}
        height={300}
        aria-label="Sign here"
        className="w-full touch-none rounded-[var(--radius-sm)] border border-graphite/25 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = at(e);
          const x = e.currentTarget.getContext("2d")!;
          x.beginPath();
          x.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = at(e);
          const x = e.currentTarget.getContext("2d")!;
          x.lineTo(p.x, p.y);
          x.stroke();
          setEmpty(false);
        }}
        onPointerUp={() => (drawing.current = false)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" disabled={empty} onClick={() => onDone(inkOnly(ref.current!, 900, 300))}>
          <Save className="size-3.5" aria-hidden /> Use this
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const c = ref.current!;
            const x = c.getContext("2d")!;
            x.fillStyle = "#ffffff";
            x.fillRect(0, 0, c.width, c.height);
            setEmpty(true);
          }}
        >
          <Eraser className="size-3.5" aria-hidden /> Clear
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function FounderRow({ f, canEdit, onChanged }: { f: FounderInk; canEdit: boolean; onChanged: () => Promise<void> }) {
  const file = useRef<HTMLInputElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(png: string | null) {
    setDrawing(false);
    if (!png) {
      setNote({ ok: false, text: "No ink was found in that picture. Sign in dark ink on white paper and try again." });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await api("/api/hq/sign/signatures", { method: "PUT", body: JSON.stringify({ id: f.id, image: png }) });
      await onChanged();
      setNote({ ok: true, text: "Saved. It is printed on the papers that carry our signatures." });
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Could not save it." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-4" data-founder={f.id}>
      <p className="text-sm font-semibold text-graphite">
        {f.name} <span className="font-normal text-blueprint">· {f.title}</span>
      </p>
      <div className={cn("mt-2 grid h-24 place-items-center rounded-[var(--radius-sm)] border border-dashed bg-white", f.ink ? "border-graphite/20" : "border-graphite/30")}>
        {f.ink ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.ink} alt={`Saved signature of ${f.name}`} className="max-h-20 max-w-[85%] object-contain" />
        ) : (
          <span className="text-xs text-blueprint">No signature saved</span>
        )}
      </div>
      {canEdit && (
        <>
          {drawing ? (
            <div className="mt-3">
              <DrawPad onDone={save} onCancel={() => setDrawing(false)} />
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={file}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={`Photo of the signature of ${f.name}`}
                onChange={async (e) => {
                  const pick = e.target.files?.[0];
                  e.target.value = "";
                  if (!pick) return;
                  try {
                    await save(await fromFile(pick));
                  } catch (err) {
                    setNote({ ok: false, text: err instanceof Error ? err.message : "Could not read that picture." });
                  }
                }}
              />
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => file.current?.click()}>
                {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ImageUp className="size-3.5" aria-hidden />} Upload a photo of it
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setDrawing(true)}>
                <PenLine className="size-3.5" aria-hidden /> Draw it
              </Button>
              {f.ink && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    if (!window.confirm(`Remove the saved signature of ${f.name}? Papers printed from now on leave a line to sign by hand.`)) return;
                    setBusy(true);
                    try {
                      await api(`/api/hq/sign/signatures?id=${f.id}`, { method: "DELETE" });
                      await onChanged();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden /> Remove
                </Button>
              )}
            </div>
          )}
          {note && <p className={cn("mt-2 text-xs", note.ok ? "text-ok" : "text-bad")}>{note.text}</p>}
        </>
      )}
    </li>
  );
}

/** "Our signatures": each founder's saved signature, printed on the papers that carry it. */
export function OurSignatures({ open, onClose, canEdit, onChanged }: { open: boolean; onClose: () => void; canEdit: boolean; onChanged: () => Promise<void> }) {
  const { founders, reload } = useInks();
  const changed = async () => {
    await reload();
    await onChanged();
  };
  return (
    <Modal open={open} onClose={onClose} title="Our signatures" size="max-w-xl" footer={<Button size="sm" onClick={onClose}>Done</Button>}>
      <p className="text-sm leading-relaxed text-charcoal">
        Each founder&apos;s signature, saved once and printed above their name on the papers that carry it. Sign in dark ink on plain white paper and upload a photo (the paper is removed
        automatically), or draw it here. It is kept in the File Vault where only founders can open it.
      </p>
      <ul className="mt-2 divide-y divide-graphite/10">
        {(founders ?? []).map((f) => (
          <FounderRow key={f.id} f={f} canEdit={canEdit} onChanged={changed} />
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-blueprint">A printed picture of a signature is not a Digital Signature Certificate. It is common on letters and forms; for agreements your advocate may prefer signatures by hand or Aadhaar eSign.</p>
    </Modal>
  );
}

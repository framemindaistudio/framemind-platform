"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Film, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Label } from "@/components/ui/form";
import { pictureFromFile, pictureFromVideo } from "@/lib/social/render";
import type { FieldSpec, Picture } from "@/lib/social/types";

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-20 shrink-0 text-xs text-charcoal">
        {label}
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-graphite" />
    </div>
  );
}

/**
 * One picture box of a design: add a photo, or a video and choose the frame, then set how it sits in the frame.
 * `picture` is the person's own picture (null while the design shows its illustration, or nothing).
 */
export function PictureField({ spec, picture, hasStock, onChange }: { spec: FieldSpec; picture: Picture | null; hasStock: boolean; onChange: (p: Picture | null) => void }) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<{ url: string; duration: number; at: number } | null>(null);
  const [error, setError] = useState("");

  // free the video when another file is picked or the box goes away (not while its slider moves: the address must
  // stay alive for as long as that video is on screen, or the browser can no longer jump to another frame)
  const videoUrl = video?.url;
  useEffect(() => () => void (videoUrl && URL.revokeObjectURL(videoUrl)), [videoUrl]);

  async function pick(file: File | undefined) {
    setError("");
    if (!file) return;
    if (file.type.startsWith("video/")) {
      setVideo({ url: URL.createObjectURL(file), duration: 0, at: 0 });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("That file is not a picture or a video.");
      return;
    }
    try {
      onChange(await pictureFromFile(file));
      setVideo(null);
    } catch {
      setError("That picture could not be opened. Try a JPG or PNG.");
    }
  }

  function useFrame() {
    const pic = videoRef.current ? pictureFromVideo(videoRef.current) : null;
    if (!pic) {
      setError("The video has not loaded a frame yet. Wait a moment and try again.");
      return;
    }
    onChange(pic);
    setVideo(null);
  }

  const set = (patch: Partial<Picture>) => picture && onChange({ ...picture, ...patch });

  return (
    <div>
      <Label htmlFor={inputId}>{spec.label}</Label>
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 bg-paper-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-3.5" aria-hidden /> {picture ? "Change" : "Add photo or video"}
          </Button>
          {picture && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Trash2 className="size-3.5" aria-hidden /> Remove
            </Button>
          )}
          {!picture && !video && <span className="text-xs text-blueprint">{hasStock ? "Showing an illustration until you add yours." : "Nothing added yet."}</span>}
        </div>

        {video && (
          <div className="mt-3">
            <video
              ref={videoRef}
              src={video.url}
              muted
              playsInline
              preload="auto"
              className="max-h-48 w-full rounded-[3px] bg-ink"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                setVideo((v) => (v ? { ...v, duration: Number.isFinite(d) ? d : 0 } : v));
                e.currentTarget.currentTime = Math.min(1, (Number.isFinite(d) ? d : 0) / 2);
              }}
              onError={() => {
                // a file this browser cannot play (some phone recordings): waiting would never help
                setVideo(null);
                setError("This video cannot be opened in this browser. Try an MP4 file, or take a screenshot of the moment and add it as a photo.");
              }}
            />
            <div className="mt-2 flex items-center gap-3">
              <Film className="size-4 shrink-0 text-blueprint" aria-hidden />
              <input
                type="range"
                aria-label="Choose the frame"
                min={0}
                max={video.duration || 1}
                step={0.05}
                value={video.at}
                onChange={(e) => {
                  const at = Number(e.target.value);
                  setVideo((v) => (v ? { ...v, at } : v));
                  if (videoRef.current) videoRef.current.currentTime = at;
                }}
                className="h-1.5 w-full cursor-pointer accent-graphite"
              />
              <Button type="button" size="sm" onClick={useFrame}>
                Use this frame
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-blueprint">Slide to the moment you want. The video itself stays on your computer.</p>
          </div>
        )}

        {picture && (
          <div className="mt-3 space-y-2.5">
            <Slider label="Zoom" min={1} max={3} step={0.02} value={picture.zoom} onChange={(zoom) => set({ zoom })} />
            <Slider label="Left · right" min={0} max={1} step={0.01} value={picture.fx} onChange={(fx) => set({ fx })} />
            <Slider label="Up · down" min={0} max={1} step={0.01} value={picture.fy} onChange={(fy) => set({ fy })} />
            <Checkbox label="Black and white (the brand's look for photographs)" checked={picture.bw} onChange={(e) => set({ bw: e.target.checked })} className="text-xs" />
            {/* the brand rule: a picture that is not a photograph of the real thing always says so */}
            <Checkbox label="Drawn or made with AI (adds the ILLUSTRATION label)" checked={picture.illustration} onChange={(e) => set({ illustration: e.target.checked })} className="text-xs" />
          </div>
        )}
      </div>
      {spec.help && !error && <p className="mt-1 text-xs text-blueprint">{spec.help}</p>}
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  );
}

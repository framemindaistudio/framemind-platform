import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * FrameMind AI Studio logo.
 * variant: "wordmark" (mark + FrameMind / AI STUDIO set in DM Sans) · "mark" (the framed head) · "full" (the master lock-up)
 * tone: "ink" (for light backgrounds: paper, print) · "white" (for dark backgrounds: the sidebar, the login)
 *
 * The mark and the full lock-up are cut from the 8K master with the black (or white) taken out as transparency, so the
 * glow sits on any background. The wordmark's letters are live text, so they stay sharp at every size and in print.
 */
const MARK = { ink: "/brand/fm-mark-light.png", white: "/brand/fm-mark-dark.png", w: 512, h: 512 } as const;
const FULL = { ink: "/brand/fm-logo-light.png", white: "/brand/fm-logo-dark.png", w: 800, h: 761 } as const;

export function Logo({
  variant = "wordmark",
  tone = "ink",
  className,
  href,
  priority,
  alt = "FrameMind AI Studio",
}: {
  variant?: "wordmark" | "mark" | "full";
  tone?: "ink" | "white";
  className?: string;
  href?: string;
  priority?: boolean;
  alt?: string;
}) {
  const img = (src: { ink: string; white: string; w: number; h: number }, cls?: string) => (
    <Image src={src[tone]} alt={alt} width={src.w} height={src.h} priority={priority} sizes="(max-width: 768px) 160px, 240px" className={cn("h-auto w-full select-none", cls)} draggable={false} />
  );

  const body =
    variant === "mark" ? (
      img(MARK, className)
    ) : variant === "full" ? (
      img(FULL, className)
    ) : (
      <span className={cn("flex w-full items-center gap-[0.45em] text-[length:inherit] leading-none", className)} aria-label={alt}>
        <span className="block aspect-square w-[2.1em] shrink-0">{img(MARK)}</span>
        <span className="flex min-w-0 flex-col">
          <span className={cn("font-semibold tracking-[-0.02em]", tone === "white" ? "text-paper" : "text-graphite")} style={{ fontSize: "1.08em" }}>
            FrameMind
          </span>
          <span className={cn("mt-[0.28em] font-medium uppercase tracking-[0.3em]", tone === "white" ? "text-lime" : "text-violet")} style={{ fontSize: "0.5em" }}>
            AI Studio
          </span>
        </span>
      </span>
    );

  if (!href) return body;
  return (
    <Link href={href} aria-label="FrameMind AI Studio" className="inline-block">
      {body}
    </Link>
  );
}

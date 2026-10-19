import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline-light" | "danger" | "lime";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-wide transition-all duration-300 ease-[var(--ease-out-expo)] disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-graphite text-paper hover:bg-ink shadow-[var(--shadow-paper)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 active:translate-y-0",
  secondary: "border border-graphite text-graphite bg-transparent hover:bg-graphite hover:text-paper",
  ghost: "text-graphite hover:bg-graphite/5",
  light: "bg-paper text-graphite hover:bg-white shadow-[var(--shadow-paper)] hover:-translate-y-0.5",
  "outline-light": "border border-paper/60 text-paper hover:bg-paper hover:text-graphite",
  danger: "bg-bad text-white hover:brightness-110",
  lime: "bg-lime text-graphite hover:bg-lime-dark shadow-[var(--shadow-paper)] hover:-translate-y-0.5 active:translate-y-0",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-[var(--radius-sm)]",
  md: "h-11 px-5 text-sm rounded-[var(--radius-sm)]",
  lg: "h-14 px-7 text-[15px] rounded-[var(--radius-sm)]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  href?: string;
  external?: boolean;
}

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant = "primary", size = "md", arrow, href, external, className, children, ...props }: ButtonProps) {
  const content = (
    <>
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden />}
    </>
  );
  if (href) {
    if (external || /^(https?:|mailto:|tel:)/.test(href)) {
      return (
        <a href={href} className={buttonClass(variant, size, className)} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={buttonClass(variant, size, className)}>
        {content}
      </Link>
    );
  }
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {content}
    </button>
  );
}

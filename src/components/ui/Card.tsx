import { cn } from "@/lib/utils";
import { CornerMarks } from "@/components/brand/Blueprint";

export function Card({ className, children, marks, as: Tag = "div", ...props }: React.HTMLAttributes<HTMLElement> & { marks?: boolean; as?: "div" | "section" | "article" }) {
  return (
    <Tag className={cn("relative rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)]", className)} {...props}>
      {marks && <CornerMarks />}
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-graphite/10 px-5 py-4", className)}>
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold text-graphite">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-blueprint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

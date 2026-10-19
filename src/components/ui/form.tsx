import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-3 text-sm text-graphite placeholder:text-blueprint/70 transition-colors outline-none focus:border-graphite focus:bg-white focus:ring-2 focus:ring-graphite/10 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(fieldBase, "py-2.5 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
    </div>
  );
});

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("annot mb-1.5 block text-charcoal", className)} {...props}>
      {children}
    </label>
  );
}

export function Field({ label, htmlFor, help, error, required, className, children }: { label: string; htmlFor?: string; help?: string; error?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-bad">*</span>}
      </Label>
      {children}
      {help && !error && <p className="mt-1 text-xs text-blueprint">{help}</p>}
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-graphite", className)}>
      <input type="checkbox" className="size-4 rounded-[3px] border-graphite/30 accent-graphite" {...props} />
      <span>{label}</span>
    </label>
  );
}

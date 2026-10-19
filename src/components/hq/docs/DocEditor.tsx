"use client";

import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, Bold, Check, Code, Copy, Heading1, Heading2, Heading3, Italic, Link2, List, ListChecks, ListOrdered, Loader2, Minus, Quote, RotateCcw, Save, Table, X } from "lucide-react";
import { api } from "@/components/hq/data";
import { Markdown } from "@/components/hq/Markdown";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CsvTable } from "./CsvTable";
import { copyText, sendJson } from "./hooks";
import type { FileKind } from "./lib";

type Edit = { value: string; start: number; end: number };

const STRIP = /^\s*(#{1,6}\s+|[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+|>\s?)/;

function wrap(s: Edit, before: string, after = before, placeholder = "text"): Edit {
  const chosen = s.value.slice(s.start, s.end) || placeholder;
  const value = s.value.slice(0, s.start) + before + chosen + after + s.value.slice(s.end);
  return { value, start: s.start + before.length, end: s.start + before.length + chosen.length };
}

function prefixLines(s: Edit, prefix: (i: number) => string, has: RegExp): Edit {
  const ls = s.value.lastIndexOf("\n", s.start - 1) + 1;
  let le = s.value.indexOf("\n", s.end);
  if (le === -1) le = s.value.length;
  const lines = s.value.slice(ls, le).split("\n");
  const done = lines.filter((l) => l.trim()).every((l) => has.test(l));
  let n = 0;
  const next = lines.map((l) => {
    const bare = l.replace(STRIP, "");
    if (done) return bare;
    return l.trim() ? prefix(n++) + bare : l;
  });
  const joined = next.join("\n");
  return { value: s.value.slice(0, ls) + joined + s.value.slice(le), start: ls, end: ls + joined.length };
}

function block(s: Edit, text: string): Edit {
  const before = s.value.slice(0, s.start);
  const after = s.value.slice(s.end);
  const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const value = before + lead + text + trail + after;
  const at = before.length + lead.length + text.length;
  return { value, start: at, end: at };
}

const TABLE = "| Column A | Column B | Column C |\n| --- | --- | --- |\n|  |  |  |";

export function DocEditor({
  path,
  name,
  kind,
  initial,
  onSaved,
  onClose,
  onDirtyChange,
  onReloadLatest,
}: {
  path: string;
  name: string;
  kind: FileKind;
  initial: { content: string; sha?: string };
  onSaved: (v: { content: string; sha?: string }) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onReloadLatest: () => void;
}) {
  const isMd = kind === "markdown";
  const [base, setBase] = useState(initial);
  const [text, setText] = useState(initial.content);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const pendingSel = useRef<[number, number] | null>(null);
  const deferred = useDeferredValue(text);
  const dirty = text !== base.content;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  useLayoutEffect(() => {
    const sel = pendingSel.current;
    const ta = taRef.current;
    if (sel && ta) {
      pendingSel.current = null;
      ta.focus();
      ta.setSelectionRange(sel[0], sel[1]);
    }
  }, [text]);

  const apply = (fn: (s: Edit) => Edit) => {
    const ta = taRef.current;
    if (!ta) return;
    const r = fn({ value: text, start: ta.selectionStart, end: ta.selectionEnd });
    pendingSel.current = [r.start, r.end];
    setText(r.value);
  };

  const save = useCallback(
    async (closeAfter: boolean, overwrite = false) => {
      if (saving) return;
      setSaving(true);
      setError(null);
      let sha = base.sha;
      if (overwrite) {
        try {
          sha = (await api<{ sha?: string }>(`/api/hq/docs?path=${encodeURIComponent(path)}`)).sha;
        } catch (e) {
          setSaving(false);
          setError(e instanceof Error ? e.message : "Could not read the latest version");
          return;
        }
      }
      const res = await sendJson("/api/hq/docs", "PUT", { path, content: text, sha, message: message.trim() || `Update ${name}` });
      setSaving(false);
      if (res.ok) {
        const next = { content: text, sha: typeof res.data.sha === "string" ? res.data.sha : undefined };
        setBase(next);
        setConflict(false);
        setMessage("");
        setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
        onSaved(next);
        if (closeAfter) onClose();
        return;
      }
      if (res.status === 409) {
        setConflict(true);
        return;
      }
      setError(res.error ?? "Could not save the document");
    },
    [saving, base.sha, path, text, message, name, onSaved, onClose],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === "s") {
      e.preventDefault();
      if (dirty) void save(false);
    } else if (isMd && e.target === taRef.current && (k === "b" || k === "i")) {
      e.preventDefault();
      apply((s) => (k === "b" ? wrap(s, "**") : wrap(s, "*")));
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  };

  const tools: { label: string; icon: React.ReactNode; run: (s: Edit) => Edit }[] = [
    { label: "Heading 1", icon: <Heading1 className="size-4" />, run: (s) => prefixLines(s, () => "# ", /^#\s/) },
    { label: "Heading 2", icon: <Heading2 className="size-4" />, run: (s) => prefixLines(s, () => "## ", /^##\s/) },
    { label: "Heading 3", icon: <Heading3 className="size-4" />, run: (s) => prefixLines(s, () => "### ", /^###\s/) },
    { label: "Bold (Ctrl+B)", icon: <Bold className="size-4" />, run: (s) => wrap(s, "**") },
    { label: "Italic (Ctrl+I)", icon: <Italic className="size-4" />, run: (s) => wrap(s, "*") },
    { label: "Bulleted list", icon: <List className="size-4" />, run: (s) => prefixLines(s, () => "- ", /^[-*+]\s(?!\[)/) },
    { label: "Numbered list", icon: <ListOrdered className="size-4" />, run: (s) => prefixLines(s, (i) => `${i + 1}. `, /^\d+\.\s/) },
    { label: "Checklist item", icon: <ListChecks className="size-4" />, run: (s) => prefixLines(s, () => "- [ ] ", /^[-*+]\s\[[ xX]\]\s/) },
    { label: "Quote", icon: <Quote className="size-4" />, run: (s) => prefixLines(s, () => "> ", /^>\s?/) },
    { label: "Link", icon: <Link2 className="size-4" />, run: (s) => wrap(s, "[", "](https://)", "link text") },
    { label: "Inline code", icon: <Code className="size-4" />, run: (s) => wrap(s, "`") },
    { label: "Table", icon: <Table className="size-4" />, run: (s) => block(s, TABLE) },
    { label: "Divider", icon: <Minus className="size-4" />, run: (s) => block(s, "---") },
  ];

  return (
    <div onKeyDown={onKeyDown} className="space-y-3">
      {conflict && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-warn/40 bg-warn/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-warn">
            <AlertTriangle className="size-4" aria-hidden /> Someone else changed this document while you were editing
          </p>
          <p className="mt-1 text-charcoal">Your text has not been lost. Copy it first, then either load the newest version or deliberately replace theirs.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                setCopied(await copyText(text));
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy my text"}
            </Button>
            <Button size="sm" variant="secondary" onClick={onReloadLatest}>
              <RotateCcw className="size-4" /> Discard mine &amp; reload latest
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                if (window.confirm("Replace the newer version with yours? Their changes stay in the history but will no longer be the current text.")) void save(false, true);
              }}
            >
              Save over their version
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConflict(false)}>
              Keep editing
            </Button>
          </div>
        </div>
      )}

      {isMd && (
        <div role="toolbar" aria-label="Formatting" className="no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-100/70 p-1">
          {tools.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              aria-label={t.label}
              onClick={() => apply(t.run)}
              className="grid size-8 shrink-0 place-items-center rounded text-charcoal transition-colors hover:bg-graphite hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-graphite"
            >
              {t.icon}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1 lg:hidden" role="tablist" aria-label="Editor view">
        {(["write", "preview"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold capitalize", tab === t ? "bg-graphite text-paper" : "bg-graphite/[0.07] text-charcoal")}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(tab === "preview" && "hidden lg:block")}>
          <label htmlFor="doc-editor" className="sr-only">
            Document source
          </label>
          <textarea
            id="doc-editor"
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck
            className="hq-scroll block h-[62vh] min-h-[320px] w-full resize-y rounded-[var(--radius-sm)] border border-graphite/20 bg-white p-4 font-mono text-[13px] leading-relaxed text-graphite outline-none transition-colors focus:border-graphite focus:ring-2 focus:ring-graphite/10"
            data-lenis-prevent
          />
        </div>
        <div className={cn("min-w-0", tab === "write" && "hidden lg:block")}>
          <div className="hq-scroll h-[62vh] min-h-[320px] overflow-auto rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-5" data-lenis-prevent aria-label="Live preview">
            {kind === "markdown" ? <Markdown content={deferred} /> : kind === "csv" ? <CsvTable text={deferred} /> : <pre className="whitespace-pre-wrap break-words font-mono text-[13px]">{deferred}</pre>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-100/60 p-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="doc-commit" className="annot mb-1 block text-charcoal">
            Change note (saved with the version history)
          </label>
          <input
            id="doc-commit"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Update ${name}`}
            maxLength={120}
            className="h-9 w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-3 text-sm outline-none transition-colors placeholder:text-blueprint/70 focus:border-graphite focus:bg-white focus:ring-2 focus:ring-graphite/10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular mr-1 text-xs text-blueprint" aria-live="polite">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${savedAt}` : "No changes"}
          </span>
          <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
            <X className="size-4" /> {dirty ? "Cancel" : "Close"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void save(false)} disabled={!dirty || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
          </Button>
          <Button size="sm" onClick={() => void save(true)} disabled={!dirty || saving}>
            <Check className="size-4" /> Save &amp; close
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <p className="text-xs text-blueprint">Ctrl+S saves{isMd ? " · Ctrl+B bold · Ctrl+I italic" : ""}. Every save is recorded as a new version you can restore from History.</p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, ExternalLink, LogOut, Paperclip, Send, Upload, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";

/* ───────────────────────────── types (what /api/portal returns) ───────────────────────────── */

interface Submission {
  id?: string;
  status: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  about: string;
  audience: string;
  requirements: string;
  pages: string;
  colors: string[];
  fonts: string;
  logo: string;
  references: string[];
  referenceLinks: string;
  files: string[];
  decisionNote: string;
  submittedAt: string;
}
interface Update {
  id: string;
  title: string;
  body: string;
  previewUrl: string;
  needsApproval: boolean;
  approval: { status: string; comment?: string; by?: string; at?: string } | null;
  createdAt: string;
}
interface View {
  project: { id: string; title: string; stage: string; onHold: boolean; progress: number; timeline: { key: string; label: string; state: string }[]; startDate: string; dueDate: string; lead: string; stagingUrl: string; liveUrl: string; revisionsAllowed: number; revisionsUsed: number };
  milestones: { label: string; amount: number; status: string; dueDate: string }[];
  stillNeeded: string[];
  submission: Submission | null;
  updates: Update[];
  messages: { id: string; from: string; author: string; text: string; createdAt: string }[];
  invoices: { number: string; date: string; dueDate: string; total: number; paid: number; balance: number; status: string }[];
}
interface Payload {
  me: { name: string; email: string };
  projects: { id: string; title: string }[];
  view: View | null;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json" }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.reload();
    throw new Error("Please sign in again.");
  }
  if (!res.ok) throw new Error((body as { error?: string }).error || "Something went wrong.");
  return body as T;
}
const post = <T,>(body: Record<string, unknown>) => call<T>("/api/portal", { method: "POST", body: JSON.stringify(body) });
const fileUrl = (path: string) => `/api/portal/file?path=${encodeURIComponent(path)}`;
const fileName = (path: string) => (path.split("/").pop() ?? "").replace(/^\d{4}-\d{2}-\d{2}_[a-z0-9]+_/, "");

/* ───────────────────────────── shell ───────────────────────────── */

function Shell({ children, name }: { children: React.ReactNode; name?: string }) {
  return (
    <div className="min-h-dvh bg-paper text-graphite">
      <header className="border-b border-graphite/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="w-40 text-[15px]">
            <Logo variant="wordmark" />
          </div>
          {name && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-charcoal sm:inline">{name}</span>
              <button
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-blueprint hover:bg-graphite/5 hover:text-graphite"
                onClick={async () => {
                  await fetch("/api/portal/auth", { method: "DELETE" });
                  window.location.reload();
                }}
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

function Alert({ tone, children }: { tone: "ok" | "bad" | "info"; children: React.ReactNode }) {
  const cls = { ok: "border-ok/30 bg-ok/10 text-ok", bad: "border-bad/30 bg-bad/10 text-bad", info: "border-info/30 bg-info/10 text-info" }[tone];
  return <div className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

/* ───────────────────────────── sign in ───────────────────────────── */

export function PortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell>
      <div className="mx-auto mt-10 max-w-sm rounded-[var(--radius)] border border-graphite/10 bg-white p-6">
        <h1 className="text-xl font-semibold">Client portal</h1>
        <p className="mt-1 text-sm text-charcoal">Sign in with the email and password we sent you.</p>
        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr("");
            try {
              await call("/api/portal/auth", { method: "POST", body: JSON.stringify({ email, password }) });
              window.location.reload();
            } catch (x) {
              setErr(x instanceof Error ? x.message : "Could not sign in.");
              setBusy(false);
            }
          }}
        >
          <Field label="Email" htmlFor="pe">
            <Input id="pe" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password" htmlFor="pp">
            <Input id="pp" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {err && <Alert tone="bad">{err}</Alert>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-blueprint">Forgot your password? Message your project lead and we&apos;ll send a new one.</p>
      </div>
    </Shell>
  );
}

export function PortalFirstPassword({ name }: { name: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell name={name}>
      <div className="mx-auto mt-10 max-w-sm rounded-[var(--radius)] border border-graphite/10 bg-white p-6">
        <h1 className="text-xl font-semibold">Welcome, {name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-charcoal">First, choose your own password. Use at least 10 characters with letters and a number.</p>
        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (next !== again) return setErr("The two new passwords don't match.");
            setBusy(true);
            setErr("");
            try {
              await call("/api/portal/password", { method: "POST", body: JSON.stringify({ current, next }) });
              window.location.reload();
            } catch (x) {
              setErr(x instanceof Error ? x.message : "Could not change the password.");
              setBusy(false);
            }
          }}
        >
          <Field label="Password we sent you" htmlFor="c1">
            <Input id="c1" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label="New password" htmlFor="c2">
            <Input id="c2" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          <Field label="New password again" htmlFor="c3">
            <Input id="c3" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />
          </Field>
          {err && <Alert tone="bad">{err}</Alert>}
          <Button type="submit" className="w-full" disabled={busy}>
            Save and continue
          </Button>
        </form>
      </div>
    </Shell>
  );
}

/* ───────────────────────────── the portal ───────────────────────────── */

type Tab = "overview" | "requirements" | "updates" | "messages" | "payments";

export function PortalApp() {
  const [data, setData] = useState<Payload | null>(null);
  const [project, setProject] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [err, setErr] = useState("");

  const load = useCallback(
    () =>
      call<Payload>(`/api/portal${project ? `?project=${encodeURIComponent(project)}` : ""}`)
        .then(setData)
        .catch((e) => setErr(e instanceof Error ? e.message : "Could not load your project.")),
    [project],
  );
  useEffect(() => {
    void load();
  }, [load]);

  if (err && !data) return <Shell>{<Alert tone="bad">{err}</Alert>}</Shell>;
  if (!data) return <Shell><p className="text-sm text-blueprint">Loading your project…</p></Shell>;
  const v = data.view;
  if (!v) return <Shell name={data.me.name}><p className="text-sm text-charcoal">There&apos;s no project on your account yet. Your project lead will add it.</p></Shell>;

  const pendingApprovals = v.updates.filter((u) => u.needsApproval && !u.approval).length;
  const subStatus = v.submission?.status ?? "draft";
  return (
    <Shell name={data.me.name}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-blueprint">Welcome, {data.me.name.split(" ")[0]}</p>
          <h1 className="mt-1 text-2xl font-semibold">{v.project.title}</h1>
        </div>
        {data.projects.length > 1 && (
          <select className="h-9 rounded-[var(--radius-sm)] border border-graphite/20 bg-white px-2 text-sm" value={v.project.id} onChange={(e) => setProject(e.target.value)} aria-label="Project">
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
      </div>
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "requirements", label: "Requirements", count: ["draft", "changes"].includes(subStatus) ? 1 : undefined },
          { value: "updates", label: "Updates & approvals", count: pendingApprovals || undefined },
          { value: "messages", label: "Messages" },
          { value: "payments", label: "Payments" },
        ]}
      />
      {tab === "overview" && <Overview v={v} go={setTab} />}
      {tab === "requirements" && <Requirements v={v} reload={load} />}
      {tab === "updates" && <Updates v={v} reload={load} />}
      {tab === "messages" && <Messages v={v} reload={load} />}
      {tab === "payments" && <Payments v={v} />}
    </Shell>
  );
}

/* ───────────────────────────── overview ───────────────────────────── */

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius)] border border-graphite/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Overview({ v, go }: { v: View; go: (t: Tab) => void }) {
  const p = v.project;
  const sub = v.submission?.status ?? "draft";
  const latest = v.updates[0];
  const waiting = v.updates.filter((u) => u.needsApproval && !u.approval);
  return (
    <div className="space-y-4">
      <section className="rounded-[var(--radius)] bg-graphite p-5 text-paper">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-paper/60">Project progress</p>
          {p.dueDate && <p className="text-xs text-paper/60">Target: {formatDate(p.dueDate)}</p>}
        </div>
        <p className="mt-2 text-3xl font-semibold">{p.progress}%</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-paper/15">
          <div className="h-full rounded-full bg-lime" style={{ width: `${p.progress}%` }} />
        </div>
        {p.onHold && <p className="mt-2 text-sm text-warn">This project is paused — your project lead will be in touch.</p>}
      </section>

      {(["draft", "changes"].includes(sub) || waiting.length > 0 || v.stillNeeded.length > 0) && (
        <Card title="Waiting for you">
          <ul className="space-y-2 text-sm">
            {sub === "draft" && (
              <li>
                <button className="underline" onClick={() => go("requirements")}>
                  Send your requirements and brand assets
                </button>{" "}
                — we start once they&apos;re in.
              </li>
            )}
            {sub === "changes" && (
              <li>
                <button className="underline" onClick={() => go("requirements")}>
                  Update your requirements
                </button>{" "}
                — we&apos;ve asked for a few changes.
              </li>
            )}
            {waiting.map((u) => (
              <li key={u.id}>
                <button className="underline" onClick={() => go("updates")}>
                  Review: {u.title}
                </button>
              </li>
            ))}
            {v.stillNeeded.length > 0 && <li>Still needed from you: {v.stillNeeded.join(", ")}</li>}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Timeline">
          <ol className="space-y-2.5">
            {p.timeline.map((t) => (
              <li key={t.key} className="flex items-center gap-2.5 text-sm">
                {t.state === "done" ? <CheckCircle2 className="size-4 text-ok" /> : t.state === "current" ? <Circle className="size-4 fill-lime text-graphite" /> : <Circle className="size-4 text-graphite/25" />}
                <span className={t.state === "upcoming" ? "text-blueprint" : t.state === "current" ? "font-semibold" : ""}>{t.label}</span>
                {t.state === "current" && <Badge tone="dark">Now</Badge>}
              </li>
            ))}
          </ol>
        </Card>
        <div className="space-y-4">
          <Card title="Latest update" action={v.updates.length > 1 ? <button className="text-xs underline" onClick={() => go("updates")}>All updates</button> : undefined}>
            {latest ? (
              <div className="text-sm">
                <p className="font-medium">{latest.title}</p>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-charcoal">{latest.body}</p>
                <p className="mt-1 text-xs text-blueprint">{formatDateTime(latest.createdAt)}</p>
              </div>
            ) : (
              <p className="text-sm text-blueprint">Updates from the team will appear here.</p>
            )}
          </Card>
          {(p.stagingUrl || p.liveUrl) && (
            <Card title="Links">
              <div className="flex flex-wrap gap-2">
                {p.stagingUrl && (
                  <Button size="sm" variant="secondary" href={p.stagingUrl} external>
                    Preview <ExternalLink className="size-3.5" />
                  </Button>
                )}
                {p.liveUrl && (
                  <Button size="sm" href={p.liveUrl} external>
                    Live site <ExternalLink className="size-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          )}
          <Card title="Your project">
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              {p.lead && (
                <>
                  <dt className="text-blueprint">Project lead</dt>
                  <dd>{p.lead}</dd>
                </>
              )}
              {p.startDate && (
                <>
                  <dt className="text-blueprint">Started</dt>
                  <dd>{formatDate(p.startDate)}</dd>
                </>
              )}
              <dt className="text-blueprint">Revision rounds</dt>
              <dd>
                {p.revisionsUsed} of {p.revisionsAllowed} used
              </dd>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── requirements ───────────────────────────── */

const EMPTY: Submission = { status: "draft", company: "", contactName: "", phone: "", email: "", website: "", about: "", audience: "", requirements: "", pages: "", colors: [], fonts: "", logo: "", references: [], referenceLinks: "", files: [], decisionNote: "", submittedAt: "" };

function Requirements({ v, reload }: { v: View; reload: () => Promise<unknown> }) {
  const [f, setF] = useState<Submission>(v.submission ?? EMPTY);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = ["submitted", "approved"].includes(f.status);
  const set = <K extends keyof Submission>(k: K, val: Submission[K]) => setF((x) => ({ ...x, [k]: val }));

  const save = async (submit: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await post<{ submission: Submission }>({ action: submit ? "submit" : "saveDraft", project: v.project.id, submission: f });
      setF(r.submission);
      setMsg({ tone: "ok", text: submit ? "Sent! The team will review it and get back to you." : "Draft saved." });
      await reload();
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {f.status === "submitted" && <Alert tone="info">Sent on {formatDateTime(f.submittedAt)} — the team is reviewing it.</Alert>}
      {f.status === "approved" && <Alert tone="ok">Approved — thank you. For any change now, send a message.</Alert>}
      {f.status === "changes" && <Alert tone="bad">Please update: {f.decisionNote}</Alert>}

      <Card title="1 · About your company">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company / organisation" required>
            <Input value={f.company} onChange={(e) => set("company", e.target.value)} disabled={locked} />
          </Field>
          <Field label="Your name">
            <Input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} disabled={locked} />
          </Field>
          <Field label="Phone">
            <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} disabled={locked} />
          </Field>
          <Field label="Email">
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} disabled={locked} />
          </Field>
          <Field label="Current website (if any)" className="sm:col-span-2">
            <Input value={f.website} onChange={(e) => set("website", e.target.value)} disabled={locked} placeholder="https://" />
          </Field>
          <Field label="What you do, in a few lines" className="sm:col-span-2">
            <Textarea rows={3} value={f.about} onChange={(e) => set("about", e.target.value)} disabled={locked} />
          </Field>
          <Field label="Who it's for (your audience)" className="sm:col-span-2">
            <Textarea rows={2} value={f.audience} onChange={(e) => set("audience", e.target.value)} disabled={locked} />
          </Field>
        </div>
      </Card>

      <Card title="2 · What you need">
        <div className="space-y-3">
          <Field label="Requirements" required help="Goals, features, must-haves — anything we should know.">
            <Textarea rows={6} value={f.requirements} onChange={(e) => set("requirements", e.target.value)} disabled={locked} />
          </Field>
          <Field label="Pages or sections you expect" help="e.g. Home, About, Programmes, Events, Gallery, Contact">
            <Textarea rows={3} value={f.pages} onChange={(e) => set("pages", e.target.value)} disabled={locked} />
          </Field>
        </div>
      </Card>

      <Card title="3 · Brand">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-charcoal">Logo (PNG or PDF)</p>
            {f.logo ? (
              <div className="flex items-center gap-3">
                {/\.(png|jpe?g|webp|gif)$/i.test(f.logo) ? <img src={fileUrl(f.logo)} alt="Your logo" className="h-16 w-16 rounded border border-graphite/10 object-contain" /> : <a className="text-sm underline" href={fileUrl(f.logo)}>{fileName(f.logo)}</a>}
                {!locked && (
                  <button className="text-xs text-bad underline" onClick={() => set("logo", "")}>
                    Remove
                  </button>
                )}
              </div>
            ) : (
              !locked && <Uploader project={v.project.id} accept=".png,.jpg,.jpeg,.webp,.pdf" label="Upload logo" onDone={(p) => set("logo", p[0])} />
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-charcoal">Brand colours</p>
            <div className="flex flex-wrap items-center gap-2">
              {f.colors.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded border border-graphite/15 bg-paper-50 py-1 pl-1 pr-1.5 text-xs">
                  <input type="color" value={c} disabled={locked} onChange={(e) => set("colors", f.colors.map((x, j) => (j === i ? e.target.value : x)))} className="size-6 cursor-pointer border-0 bg-transparent p-0" aria-label={`Colour ${i + 1}`} />
                  <span className="font-mono">{c}</span>
                  {!locked && (
                    <button onClick={() => set("colors", f.colors.filter((_, j) => j !== i))} aria-label="Remove colour">
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}
              {!locked && f.colors.length < 8 && (
                <Button size="sm" variant="ghost" onClick={() => set("colors", [...f.colors, "#7c3aed"])}>
                  + Add colour
                </Button>
              )}
            </div>
          </div>
          <Field label="Fonts you use (if any)" className="sm:col-span-2">
            <Input value={f.fonts} onChange={(e) => set("fonts", e.target.value)} disabled={locked} />
          </Field>
        </div>
      </Card>

      <Card title="4 · References & files">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-charcoal">Reference images (styles, photos you like)</p>
            <div className="flex flex-wrap gap-2">
              {f.references.map((r) => (
                <div key={r} className="relative">
                  <img src={fileUrl(r)} alt="" className="size-20 rounded border border-graphite/10 object-cover" />
                  {!locked && (
                    <button className="absolute -right-1.5 -top-1.5 rounded-full bg-graphite p-0.5 text-paper" onClick={() => set("references", f.references.filter((x) => x !== r))} aria-label="Remove image">
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
              {!locked && f.references.length < 20 && <Uploader project={v.project.id} accept=".png,.jpg,.jpeg,.webp" label="Add images" multiple onDone={(p) => set("references", [...f.references, ...p].slice(0, 20))} />}
            </div>
          </div>
          <Field label="Websites or links you like" help="One per line">
            <Textarea rows={3} value={f.referenceLinks} onChange={(e) => set("referenceLinks", e.target.value)} disabled={locked} />
          </Field>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-charcoal">Other files (content, documents, brand guide — up to 4 MB each)</p>
            <ul className="mb-2 space-y-1 text-sm">
              {f.files.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Paperclip className="size-3.5 text-blueprint" />
                  <a className="underline" href={fileUrl(p)}>
                    {fileName(p)}
                  </a>
                  {!locked && (
                    <button className="text-xs text-bad underline" onClick={() => set("files", f.files.filter((x) => x !== p))}>
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!locked && <Uploader project={v.project.id} label="Attach files" multiple onDone={(p) => set("files", [...f.files, ...p].slice(0, 20))} />}
          </div>
        </div>
      </Card>

      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      {!locked && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => void save(false)}>
            Save draft
          </Button>
          <Button disabled={busy} onClick={() => void save(true)}>
            <Send className="size-4" /> Submit to the team
          </Button>
        </div>
      )}
    </div>
  );
}

function Uploader({ project, onDone, label, accept, multiple }: { project: string; onDone: (paths: string[]) => void; label: string; accept?: string; multiple?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <input
        ref={ref}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          setErr("");
          const done: string[] = [];
          for (const file of files) {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("project", project);
            try {
              done.push((await call<{ path: string }>("/api/portal/upload", { method: "POST", body: fd })).path);
            } catch (x) {
              setErr(`${file.name}: ${x instanceof Error ? x.message : "upload failed"}`);
            }
          }
          if (done.length) onDone(done);
          setBusy(false);
        }}
      />
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => ref.current?.click()}>
        <Upload className="size-3.5" /> {busy ? "Uploading…" : label}
      </Button>
      {err && <p className="mt-1 text-xs text-bad">{err}</p>}
    </div>
  );
}

/* ───────────────────────────── updates & approvals ───────────────────────────── */

function Updates({ v, reload }: { v: View; reload: () => Promise<unknown> }) {
  const [comment, setComment] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  if (!v.updates.length) return <p className="text-sm text-blueprint">No updates yet. When the team shares progress or a preview, it appears here.</p>;
  const respond = async (id: string, decision: "approved" | "changes") => {
    setErr("");
    try {
      await post({ action: "respond", id, decision, comment: comment[id] ?? "" });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send.");
    }
  };
  return (
    <div className="space-y-3">
      {err && <Alert tone="bad">{err}</Alert>}
      {v.updates.map((u) => (
        <Card key={u.id} title={u.title} action={<span className="text-xs text-blueprint">{formatDateTime(u.createdAt)}</span>}>
          {u.body && <p className="whitespace-pre-line text-sm text-charcoal">{u.body}</p>}
          {u.previewUrl && (
            <Button size="sm" variant="secondary" href={u.previewUrl} external className="mt-3">
              View preview <ExternalLink className="size-3.5" />
            </Button>
          )}
          {u.needsApproval &&
            (u.approval ? (
              <p className="mt-3 text-sm">
                <Badge tone={u.approval.status === "approved" ? "ok" : "warn"}>{u.approval.status === "approved" ? "You approved this" : "You asked for changes"}</Badge>
                {u.approval.comment && <span className="ml-2 text-charcoal">“{u.approval.comment}”</span>}
              </p>
            ) : (
              <div className="mt-3 space-y-2 border-t border-graphite/10 pt-3">
                <Textarea rows={2} placeholder="Comments (needed if you'd like changes)" value={comment[u.id] ?? ""} onChange={(e) => setComment((c) => ({ ...c, [u.id]: e.target.value }))} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void respond(u.id, "approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void respond(u.id, "changes")}>
                    Ask for changes
                  </Button>
                </div>
              </div>
            ))}
        </Card>
      ))}
    </div>
  );
}

/* ───────────────────────────── messages ───────────────────────────── */

function Messages({ v, reload }: { v: View; reload: () => Promise<unknown> }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Messages with the team">
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {!v.messages.length && <p className="text-sm text-blueprint">No messages yet.</p>}
        {v.messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-[var(--radius-sm)] px-3 py-2 text-sm ${m.from === "client" ? "ml-auto bg-graphite text-paper" : "bg-paper-100"}`}>
            <p className="whitespace-pre-line">{m.text}</p>
            <p className={`mt-1 text-[11px] ${m.from === "client" ? "text-paper/60" : "text-blueprint"}`}>
              {m.author} · {formatDateTime(m.createdAt)}
            </p>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          try {
            await post({ action: "message", project: v.project.id, text });
            setText("");
            await reload();
          } catch (x) {
            setErr(x instanceof Error ? x.message : "Could not send.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" aria-label="Message" />
        <Button type="submit" disabled={busy || !text.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
      {err && <p className="mt-1 text-xs text-bad">{err}</p>}
    </Card>
  );
}

/* ───────────────────────────── payments ───────────────────────────── */

function Payments({ v }: { v: View }) {
  return (
    <div className="space-y-4">
      <Card title="Payment milestones">
        {!v.milestones.length ? (
          <p className="text-sm text-blueprint">Milestones will appear here once the project plan is set.</p>
        ) : (
          <ul className="divide-y divide-graphite/10 text-sm">
            {v.milestones.map((m, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 py-2">
                <span className="flex-1">{m.label}</span>
                {m.dueDate && <span className="text-xs text-blueprint">{formatDate(m.dueDate)}</span>}
                <span className="tabular font-medium">{formatINR(m.amount)}</span>
                <Badge tone={m.status === "paid" ? "ok" : m.status === "invoiced" ? "info" : "outline"}>{m.status === "paid" ? "Paid" : m.status === "invoiced" ? "Invoiced" : "Upcoming"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Invoices">
        {!v.invoices.length ? (
          <p className="text-sm text-blueprint">No invoices yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-blueprint">
              <tr>
                <th className="py-1 font-medium">Invoice</th>
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 text-right font-medium">Total</th>
                <th className="py-1 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {v.invoices.map((i) => (
                <tr key={i.number} className="border-t border-graphite/10">
                  <td className="py-1.5">{i.number}</td>
                  <td className="py-1.5">{formatDate(i.date)}</td>
                  <td className="tabular py-1.5 text-right">{formatINR(i.total)}</td>
                  <td className="tabular py-1.5 text-right">{i.balance > 0 ? formatINR(i.balance) : <Badge tone="ok">Paid</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

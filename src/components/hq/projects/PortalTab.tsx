"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { api } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Notice } from "@/components/hq/sales/bits";
import { formatDateTime } from "@/lib/utils";
import { str, type Rec } from "./logic";

interface Account {
  email: string;
  name: string;
  mustChange: boolean;
  disabled: boolean;
  createdAt: string;
  lastSignInAt: string;
}
interface PortalData {
  accounts: Account[];
  mailReady: boolean;
  portalUrl: string;
  client: { name: string; email: string } | null;
  submission: Rec | null;
  updates: Rec[];
  messages: Rec[];
}
interface Granted {
  email: string;
  password: string | null;
  emailed: boolean;
  mailError: string;
  portalUrl: string;
}

const raw = (path: string) => `/api/hq/docs/raw?path=${encodeURIComponent(path)}`;
const fileName = (path: string) => (path.split("/").pop() ?? "").replace(/^\d{4}-\d{2}-\d{2}_[a-z0-9]+_/, "");

/** A project's client portal from the studio's side: the login, what the client sent, updates, messages. */
export function PortalTab({ project, canWrite }: { project: Rec; canWrite: boolean }) {
  const [d, setD] = useState<PortalData | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [granted, setGranted] = useState<Granted | null>(null);

  const load = useCallback(() => api<PortalData>(`/api/hq/portal?project=${encodeURIComponent(project.id)}`).then(setD), [project.id]);
  useEffect(() => {
    void load();
  }, [load]);

  const run = async (body: Record<string, unknown>, ok: string) => {
    setMsg(null);
    try {
      const r = await api<Granted & { ok: boolean }>("/api/hq/portal", { method: "POST", body: JSON.stringify({ project: project.id, ...body }) });
      if (r.password !== undefined) setGranted(r);
      setMsg({ tone: "ok", text: ok });
      await load();
      return true;
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof Error ? e.message : "That did not work." });
      return false;
    }
  };

  // opening the tab marks the client's messages as read
  const unread = d?.messages.filter((m) => m.from === "client" && m.readByTeam !== true).length ?? 0;
  useEffect(() => {
    if (unread && canWrite) void api("/api/hq/portal", { method: "POST", body: JSON.stringify({ project: project.id, action: "read" }) }).catch(() => {});
  }, [unread, canWrite, project.id]);

  if (!d) return <p className="text-sm text-blueprint">Loading the client portal…</p>;
  return (
    <div className="space-y-5">
      {msg && <Notice tone={msg.tone === "ok" ? "ok" : "bad"}>{msg.text}</Notice>}
      <Login d={d} granted={granted} canWrite={canWrite} run={run} project={project} />
      <SubmissionPanel sub={d.submission} canWrite={canWrite} run={run} />
      <UpdatesPanel d={d} project={project} canWrite={canWrite} run={run} />
      <MessagesPanel d={d} canWrite={canWrite} run={run} />
    </div>
  );
}

type Run = (body: Record<string, unknown>, ok: string) => Promise<boolean>;

function Login({ d, granted, canWrite, run, project }: { d: PortalData; granted: Granted | null; canWrite: boolean; run: Run; project: Rec }) {
  const [email, setEmail] = useState(d.client?.email ?? "");
  const [name, setName] = useState(d.client?.name ?? "");
  const share = granted?.password ? `Your FrameMind client portal for ${str(project.title)} is ready.\n${granted.portalUrl}\nEmail: ${granted.email}\nOne-time password: ${granted.password}\n(You'll choose your own password when you sign in.)` : "";
  return (
    <Panel title="Client login" subtitle={d.mailReady ? "Logins are emailed to the client automatically." : "Email isn't set up yet — share the sign-in yourself (WhatsApp or copy)."}>
      {granted?.password && (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-lime bg-lime/15 p-3 text-sm">
          <p className="font-semibold">{granted.emailed ? `Emailed to ${granted.email}.` : "Share this with the client — it is shown only once:"}</p>
          {granted.mailError && <p className="text-bad">{granted.mailError}</p>}
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{share}</pre>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(share)}>
              <Copy className="size-3.5" /> Copy
            </Button>
            <Button size="sm" variant="secondary" href={`https://wa.me/?text=${encodeURIComponent(share)}`} external>
              <MessageCircle className="size-3.5" /> WhatsApp
            </Button>
          </div>
        </div>
      )}
      {d.accounts.length ? (
        <ul className="divide-y divide-graphite/10 text-sm">
          {d.accounts.map((a) => (
            <li key={a.email} className="flex flex-wrap items-center gap-2 py-2">
              <span className="flex-1">
                <strong>{a.name}</strong> <span className="text-blueprint">· {a.email}</span>
              </span>
              {a.disabled ? <Badge tone="bad">Paused</Badge> : a.mustChange ? <Badge tone="warn">Not signed in yet</Badge> : <Badge tone="ok">Active</Badge>}
              <span className="text-xs text-blueprint">{a.lastSignInAt ? `Last in ${formatDateTime(a.lastSignInAt)}` : ""}</span>
              {canWrite && (
                <span className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => void run({ action: "reset", email: a.email, name: a.name }, "New one-time password made.")}>
                    Reset password
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void run({ action: "pause", email: a.email, disabled: !a.disabled }, a.disabled ? "Login resumed." : "Login paused.")}>
                    {a.disabled ? "Resume" : "Pause"}
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : !project.clientId ? (
        <p className="text-sm text-blueprint">Link this project to a client first (Edit project).</p>
      ) : canWrite ? (
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Client's email (sign-in)" className="min-w-56 flex-1">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Name" className="min-w-40 flex-1">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Button disabled={!email.trim()} onClick={() => void run({ action: "grant", email, name }, "Portal login created.")}>
            Create portal login
          </Button>
        </div>
      ) : (
        <p className="text-sm text-blueprint">No portal login yet.</p>
      )}
      <p className="mt-3 text-xs text-blueprint">
        Portal address:{" "}
        <a className="underline" href={d.portalUrl} target="_blank" rel="noreferrer">
          {d.portalUrl}
        </a>
      </p>
    </Panel>
  );
}

const SUB_TONE: Record<string, "ok" | "warn" | "info" | "outline"> = { approved: "ok", submitted: "warn", changes: "info", draft: "outline" };
const SUB_LABEL: Record<string, string> = { approved: "Approved", submitted: "Waiting for your review", changes: "Sent back for changes", draft: "Client is still filling it in" };

function SubmissionPanel({ sub, canWrite, run }: { sub: Rec | null; canWrite: boolean; run: Run }) {
  const [note, setNote] = useState("");
  const [brief, setBrief] = useState("");
  const [build, setBuild] = useState(true);
  if (!sub) return <Panel title="Requirements from the client"><p className="text-sm text-blueprint">Nothing sent yet.</p></Panel>;
  const status = str(sub.status) || "draft";
  const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  const row = (k: string, v: unknown) => (str(v) ? (
    <div className="grid gap-1 border-t border-graphite/10 py-2 sm:grid-cols-[160px_1fr]">
      <dt className="text-xs font-semibold text-blueprint">{k}</dt>
      <dd className="whitespace-pre-line text-sm">{str(v)}</dd>
    </div>
  ) : null);
  return (
    <Panel title="Requirements from the client" action={<Badge tone={SUB_TONE[status] ?? "outline"}>{SUB_LABEL[status] ?? status}</Badge>}>
      <dl>
        {row("Company", sub.company)}
        {row("Contact", [str(sub.contactName), str(sub.phone), str(sub.email)].filter(Boolean).join(" · "))}
        {row("Website", sub.website)}
        {row("About", sub.about)}
        {row("Audience", sub.audience)}
        {row("Requirements", sub.requirements)}
        {row("Pages / sections", sub.pages)}
        {row("Fonts", sub.fonts)}
        {row("Reference links", sub.referenceLinks)}
      </dl>
      <div className="mt-3 flex flex-wrap gap-4">
        {str(sub.logo) && (
          <div>
            <p className="mb-1 text-xs font-semibold text-blueprint">Logo</p>
            <a href={raw(str(sub.logo))} target="_blank" rel="noreferrer">
              {/\.(png|jpe?g|webp|gif)$/i.test(str(sub.logo)) ? <img src={raw(str(sub.logo))} alt="Client logo" className="h-16 w-16 rounded border border-graphite/10 object-contain" /> : <span className="text-sm underline">{fileName(str(sub.logo))}</span>}
            </a>
          </div>
        )}
        {list(sub.colors).length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-blueprint">Brand colours</p>
            <div className="flex gap-1.5">
              {list(sub.colors).map((c) => (
                <span key={c} className="flex flex-col items-center text-[10px]">
                  <span className="size-8 rounded border border-graphite/10" style={{ background: c }} />
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {list(sub.references).length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-blueprint">Reference images</p>
          <div className="flex flex-wrap gap-2">
            {list(sub.references).map((r) => (
              <a key={r} href={raw(r)} target="_blank" rel="noreferrer">
                <img src={raw(r)} alt="" className="size-20 rounded border border-graphite/10 object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
      {list(sub.files).length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {list(sub.files).map((p) => (
            <li key={p}>
              <a className="underline" href={`${raw(p)}&download=1`}>
                {fileName(p)}
              </a>
            </li>
          ))}
        </ul>
      )}
      {status === "submitted" && canWrite && (
        <div className="mt-4 space-y-3 border-t border-graphite/10 pt-3">
          <Field label="What to build — your summary" help="Claude plans from this and the client's submission. Scope decisions, priorities, tech preferences, anything the client didn't say.">
            <Textarea rows={5} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="e.g. 8-page website in Next.js: Home, About, Programmes, Events (admin can add), Gallery, Donate (Razorpay link only), Contact. Kannada + English later, not now. Launch before 20 Nov." />
          </Field>
          <Checkbox label="Then set up GitHub and let Claude plan the project from this summary" checked={build} onChange={(e) => setBuild(e.target.checked)} />
          <Textarea rows={2} placeholder="Note to the client (needed to send it back)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void run({ action: "decide", decision: "approved", note, brief, build }, build ? "Approved. Claude is now planning on GitHub — review its plan in the Development tab." : "Approved — it's now the project brief, and the project moved to Design.")}>
              {build ? "Approve & build with Claude" : "Approve"}
            </Button>
            <Button size="sm" variant="secondary" disabled={!note.trim()} onClick={() => void run({ action: "decide", decision: "changes", note }, "Sent back to the client.")}>
              Request changes
            </Button>
          </div>
        </div>
      )}
      {str(sub.decisionNote) && <p className="mt-3 text-xs text-blueprint">Last note: {str(sub.decisionNote)}</p>}
    </Panel>
  );
}

function UpdatesPanel({ d, project, canWrite, run }: { d: PortalData; project: Rec; canWrite: boolean; run: Run }) {
  const [f, setF] = useState({ title: "", body: "", previewUrl: str(project.stagingUrl), needsApproval: false });
  return (
    <Panel title="Updates to the client" subtitle="What you publish here appears in the client's portal (and is emailed when email is set up).">
      {canWrite && (
        <div className="mb-4 space-y-2 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper-50 p-3">
          <Input placeholder="Title — e.g. Homepage design ready for review" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Textarea rows={3} placeholder="What's done, what's next" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <Input placeholder="Preview link (https://…)" value={f.previewUrl} onChange={(e) => setF({ ...f, previewUrl: e.target.value })} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Checkbox label="Ask the client to approve this" checked={f.needsApproval} onChange={(e) => setF({ ...f, needsApproval: e.target.checked })} />
            <Button
              size="sm"
              disabled={!f.title.trim()}
              onClick={async () => {
                if (await run({ action: "publish", ...f }, "Published to the client.")) setF({ title: "", body: "", previewUrl: str(project.stagingUrl), needsApproval: false });
              }}
            >
              Publish
            </Button>
          </div>
        </div>
      )}
      {!d.updates.length ? (
        <p className="text-sm text-blueprint">No updates published yet.</p>
      ) : (
        <ul className="divide-y divide-graphite/10 text-sm">
          {d.updates.map((u) => {
            const a = u.approval as { status?: string; comment?: string; by?: string } | undefined;
            return (
              <li key={u.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex-1 font-medium">{str(u.title)}</span>
                  {u.needsApproval === true && (a?.status ? <Badge tone={a.status === "approved" ? "ok" : "warn"}>{a.status === "approved" ? "Client approved" : "Client wants changes"}</Badge> : <Badge tone="outline">Awaiting client</Badge>)}
                  <span className="text-xs text-blueprint">{formatDateTime(str(u.createdAt))}</span>
                </div>
                {a?.comment && <p className="mt-1 text-charcoal">“{a.comment}” — {a.by}</p>}
                {str(u.previewUrl) && (
                  <a className="mt-1 inline-flex items-center gap-1 text-xs underline" href={str(u.previewUrl)} target="_blank" rel="noreferrer">
                    Preview <ExternalLink className="size-3" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function MessagesPanel({ d, canWrite, run }: { d: PortalData; canWrite: boolean; run: Run }) {
  const [text, setText] = useState("");
  return (
    <Panel title="Messages with the client">
      <div className="max-h-[40vh] space-y-2 overflow-y-auto">
        {!d.messages.length && <p className="text-sm text-blueprint">No messages yet.</p>}
        {d.messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-[var(--radius-sm)] px-3 py-2 text-sm ${m.from === "team" ? "ml-auto bg-graphite text-paper" : "bg-paper-100"}`}>
            <p className="whitespace-pre-line">{str(m.text)}</p>
            <p className={`mt-1 text-[11px] ${m.from === "team" ? "text-paper/60" : "text-blueprint"}`}>
              {str(m.author)} · {formatDateTime(str(m.createdAt))}
            </p>
          </div>
        ))}
      </div>
      {canWrite && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run({ action: "message", text }, "Sent.")) setText("");
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply to the client…" aria-label="Reply" />
          <Button type="submit" disabled={!text.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </Panel>
  );
}

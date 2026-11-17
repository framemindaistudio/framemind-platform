"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Copy, ExternalLink, FolderSearch, Loader2, Mail, Plus, Save, Trash2, Undo2, Upload } from "lucide-react";
import type { CoverStyle, ShopCatalog, ShopCoupon, ShopOrder, ShopProduct, ShopStatus } from "@/lib/shop/types";
import { COVER_STYLES } from "@/lib/shop/types";
import { STYLE_FOR_CATEGORY } from "@/site/components/shop/Covers";
import { catalogProblems, formatBytes, inr, isBuyable } from "@/lib/shop/logic";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { cn, formatDateTime } from "@/lib/utils";
import { api, useHq } from "@/components/hq/data";
import { EmptyState, Loading, PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Overlay";
import { Field, Input, Select, Textarea } from "@/components/ui/form";

type TabId = "products" | "orders" | "coupons" | "setup";

interface Loaded {
  catalog: ShopCatalog;
  sha?: string;
  saved: boolean;
  payMode: "live" | "test" | "mock" | "off";
  mail: boolean;
  testSender: boolean;
  storeMode: string;
}
type OrderRow = ShopOrder & { link: string };

const STATUS: { value: ShopStatus; label: string }[] = [
  { value: "live", label: "Live (on sale)" },
  { value: "soon", label: "Coming soon" },
  { value: "hidden", label: "Hidden" },
];
const statusTone = (s: ShopStatus) => (s === "live" ? "ok" : s === "soon" ? "warn" : "neutral");
const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export function StoreApp() {
  const { user } = useHq();
  const editor = can(user, LEADERSHIP);
  const [tab, setTab] = useState<TabId>("products");
  const [data, setData] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<ShopCatalog | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api<Loaded>("/api/hq/shop")
      .then((d) => {
        setData(d);
        setDraft(structuredClone(d.catalog));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (tab === "orders" && !orders) api<{ orders: OrderRow[] }>("/api/hq/shop/orders").then((r) => setOrders(r.orders)).catch((e) => setError(e.message));
  }, [tab, orders]);

  const dirty = useMemo(() => !!data && !!draft && JSON.stringify(data.catalog) !== JSON.stringify(draft), [data, draft]);
  const problems = useMemo(() => (draft ? catalogProblems(draft) : []), [draft]);

  if (error && !data) return <EmptyState icon="CircleAlert" title="Could not load the store" description={error} />;
  if (!data || !draft) return <Loading />;

  const update = (fn: (c: ShopCatalog) => void) =>
    setDraft((d) => {
      const next = structuredClone(d!);
      fn(next);
      return next;
    });

  async function save() {
    setSaving(true);
    setError("");
    try {
      const r = await api<{ catalog: ShopCatalog; sha?: string }>("/api/hq/shop", { method: "PUT", body: JSON.stringify({ catalog: draft, sha: data!.sha }) });
      setData({ ...data!, catalog: r.catalog, sha: r.sha, saved: true });
      setDraft(structuredClone(r.catalog));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  /** After a file was uploaded or removed on the server. */
  const applyServer = (r: { catalog: ShopCatalog; sha?: string }) => {
    setData({ ...data!, catalog: r.catalog, sha: r.sha, saved: true });
    setDraft(structuredClone(r.catalog));
  };

  const open = draft.products.find((p) => p.id === openId) ?? null;
  const live = draft.products.filter((p) => p.status === "live").length;
  const paid = (orders ?? []).filter((o) => o.status === "paid" && o.mode === "live");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coaching & Products"
        title="Digital Store"
        icon="ShoppingBag"
        description="Guides, presets and templates sold at /shop. Payments by Razorpay; files delivered by signed download links."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" href="/shop" external>
              <ExternalLink className="h-4 w-4" /> View store
            </Button>
            {editor && dirty && (
              <Button variant="ghost" size="sm" onClick={() => setDraft(structuredClone(data.catalog))}>
                <Undo2 className="h-4 w-4" /> Undo changes
              </Button>
            )}
            {editor && (
              <Button size="sm" onClick={save} disabled={!dirty || saving || problems.length > 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save & publish
              </Button>
            )}
          </div>
        }
      />

      {!data.saved && <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">This is the starting catalogue. Nothing is saved yet: saving it once makes it yours to change.</p>}
      {error && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {dirty && problems.length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p className="font-semibold">Fix these before saving:</p>
          <ul className="mt-1 list-disc pl-5">
            {problems.slice(0, 6).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Products" value={draft.products.length} sub={`${live} live`} />
        <StatCard label="Payments" value={{ live: "Live", test: "Test mode", mock: "Local test", off: "Not set up" }[data.payMode]} sub="Razorpay" />
        <StatCard label="Receipt emails" value={data.mail ? (data.testSender ? "Test sender" : "On") : "Off"} sub="Resend" />
        <StatCard label="Orders" value={orders ? paid.length : "—"} sub={orders ? `${inr(paid.reduce((n, o) => n + o.total, 0))} received` : "open the Orders tab"} tone="dark" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "products", label: "Products", count: draft.products.length },
          { value: "orders", label: "Orders", count: orders?.length },
          { value: "coupons", label: "Coupons", count: draft.coupons.length },
          { value: "setup", label: "Setup" },
        ]}
      />

      {tab === "products" && (
        <ProductsTab
          catalog={draft}
          editor={editor}
          onOpen={setOpenId}
          onAdd={() =>
            update((c) => {
              const id = `product-${c.products.length + 1}`;
              c.products.push({ id, slug: id, title: "New product", tagline: "", category: c.categories[0]?.id ?? "", price: 99, status: "soon", description: "", includes: [], formats: ["PDF"], files: [], accent: "#C8F135" });
              setOpenId(id);
            })
          }
        />
      )}
      {tab === "orders" && <OrdersTab orders={orders} editor={editor} />}
      {tab === "coupons" && <CouponsTab coupons={draft.coupons} editor={editor} onChange={(coupons) => update((c) => void (c.coupons = coupons))} />}
      {tab === "setup" && <SetupTab data={data} />}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.title ?? ""} subtitle={open ? `/shop/${open.slug}` : ""} width="max-w-3xl">
        {open && (
          <ProductEditor

            product={open}
            catalog={draft}
            savedProduct={data.catalog.products.find((p) => p.id === open.id)}
            editor={editor}
            dirty={dirty}
            onChange={(next) =>
              update((c) => {
                const i = c.products.findIndex((p) => p.id === open.id);
                c.products[i] = next;
                if (next.id !== open.id) setOpenId(next.id);
              })
            }
            onDelete={() => {
              update((c) => void (c.products = c.products.filter((p) => p.id !== open.id)));
              setOpenId(null);
            }}
            onServer={applyServer}
          />
        )}
      </Drawer>
    </div>
  );
}

function ProductsTab({ catalog, editor, onOpen, onAdd }: { catalog: ShopCatalog; editor: boolean; onOpen: (id: string) => void; onAdd: () => void }) {
  return (
    <Panel
      title="Products"
      subtitle="A product goes on sale when it is Live and has its files. Click a row to edit it."
      action={
        editor && (
          <Button size="sm" variant="secondary" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        )
      }
      bodyClassName="p-0"
    >
      <table className="w-full text-sm">
        <thead className="border-b border-graphite/10 text-left text-xs uppercase tracking-wider text-blueprint">
          <tr>
            <th className="px-4 py-2">Product</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2 text-right">Price</th>
            <th className="px-4 py-2">Files</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {catalog.products.map((p) => {
            const cat = catalog.categories.find((c) => c.id === p.category);
            const ready = isBuyable({ ...p, status: "live" }, catalog);
            return (
              <tr key={p.id} onClick={() => onOpen(p.id)} className="cursor-pointer border-b border-graphite/5 hover:bg-paper-100">
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2.5">
                    <span className="h-6 w-6 shrink-0 rounded-sm" style={{ background: p.accent || "#C8F135" }} />
                    <span>
                      <span className="font-medium">{p.title}</span>
                      {p.featured && <span className="ml-2 text-xs text-blueprint">★ featured</span>}
                      <span className="block text-xs text-blueprint">/shop/{p.slug}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-blueprint">{cat?.name ?? p.category}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{inr(p.price)}</td>
                <td className="px-4 py-2.5">
                  {p.bundleOf?.length ? (
                    <span className="text-blueprint">bundle of {p.bundleOf.length}</span>
                  ) : p.files.length ? (
                    <span>{p.files.length} file{p.files.length > 1 ? "s" : ""}</span>
                  ) : (
                    <span className="text-amber-700">none yet</span>
                  )}
                  {!ready && p.bundleOf?.length ? <span className="ml-1 text-amber-700">(not ready)</span> : null}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone(p.status)}>{STATUS.find((s) => s.value === p.status)?.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function ProductEditor({
  product,
  catalog,
  savedProduct,
  editor,
  dirty,
  onChange,
  onDelete,
  onServer,
}: {
  product: ShopProduct;
  catalog: ShopCatalog;
  savedProduct?: ShopProduct;
  editor: boolean;
  dirty: boolean;
  onChange: (p: ShopProduct) => void;
  onDelete: () => void;
  onServer: (r: { catalog: ShopCatalog; sha?: string }) => void;
}) {
  const [busy, setBusy] = useState("");
  const [fileError, setFileError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ShopProduct>(k: K, v: ShopProduct[K]) => onChange({ ...product, [k]: v });
  const isNew = !savedProduct;
  const filesBlocked = dirty ? "Save & publish your changes first, then add files." : "";

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setFileError("");
    for (const f of Array.from(files)) {
      setBusy(`Uploading ${f.name}…`);
      const form = new FormData();
      form.set("productId", product.id);
      form.set("file", f);
      const res = await fetch("/api/hq/shop/files", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFileError(json.error || `Upload failed (${res.status})`);
        break;
      }
      onServer(json);
    }
    setBusy("");
    if (input.current) input.current.value = "";
  }

  async function fileAction(body: Record<string, unknown>, method: "POST" | "DELETE", label: string) {
    setBusy(label);
    setFileError("");
    try {
      onServer(await api("/api/hq/shop/files", { method, body: JSON.stringify(body) }));
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  const dis = !editor;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          <Input value={product.title} disabled={dis} onChange={(e) => onChange({ ...product, title: e.target.value, ...(isNew ? { slug: slugify(e.target.value), id: slugify(e.target.value) || product.id } : {}) })} />
        </Field>
        <Field label="Status" help={product.status === "live" && !isBuyable(product, catalog) ? "Needs files before it can be live." : undefined}>
          <Select value={product.status} disabled={dis} onChange={(e) => set("status", e.target.value as ShopStatus)}>
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tagline (one line on the card)" className="sm:col-span-2">
          <Input value={product.tagline} disabled={dis} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <Field label="Category">
          <Select value={product.category} disabled={dis} onChange={(e) => set("category", e.target.value)}>
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Web address" help={isNew ? "Set from the title; can't change after the first save." : "Fixed once saved, so shared links keep working."}>
          <Input value={product.slug} disabled={dis || !isNew} onChange={(e) => set("slug", slugify(e.target.value))} />
        </Field>
        <Field label="Price (₹)" required>
          <Input type="number" min={0} step={1} value={product.price} disabled={dis} onChange={(e) => set("price", Math.round(Number(e.target.value)))} />
        </Field>
        <Field label="Struck-through price (₹, optional)">
          <Input type="number" min={0} step={1} value={product.mrp ?? ""} disabled={dis} onChange={(e) => set("mrp", e.target.value ? Math.round(Number(e.target.value)) : undefined)} />
        </Field>
        <Field label="Who it's for">
          <Input value={product.level ?? ""} disabled={dis} placeholder="Beginners" onChange={(e) => set("level", e.target.value || undefined)} />
        </Field>
        <Field label="Formats (comma separated)">
          <Input value={product.formats.join(", ")} disabled={dis} onChange={(e) => set("formats", e.target.value.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean))} />
        </Field>
        <Field label="Cover colour">
          <div className="flex gap-2">
            <input type="color" value={product.accent || "#C8F135"} disabled={dis} onChange={(e) => set("accent", e.target.value)} className="h-9 w-12 rounded border border-graphite/20" />
            <Input value={product.accent ?? ""} disabled={dis} onChange={(e) => set("accent", e.target.value || undefined)} />
          </div>
        </Field>
        <Field label="Cover design" help="Drawn covers in the 4:5 Instagram size. Default follows the category.">
          <Select value={product.coverStyle ?? ""} disabled={dis} onChange={(e) => set("coverStyle", (e.target.value || undefined) as CoverStyle | undefined)}>
            <option value="">Category default ({STYLE_FOR_CATEGORY[product.category] ?? "brutal"})</option>
            {COVER_STYLES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cover image (optional address)" help="Leave empty to draw the cover from the colour and title.">
          <Input value={product.cover ?? ""} disabled={dis} placeholder="/shop/covers/…png" onChange={(e) => set("cover", e.target.value || undefined)} />
        </Field>
        <Field label="Description (blank line between paragraphs)" className="sm:col-span-2">
          <Textarea rows={6} value={product.description} disabled={dis} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="What you get (one per line)" className="sm:col-span-2">
          <Textarea rows={5} value={product.includes.join("\n")} disabled={dis} onChange={(e) => set("includes", lines(e.target.value))} />
        </Field>
        <Field label="Small print (optional)" className="sm:col-span-2">
          <Input value={product.note ?? ""} disabled={dis} onChange={(e) => set("note", e.target.value || undefined)} />
        </Field>
        <Field label="Search tags (comma separated)">
          <Input value={(product.tags ?? []).join(", ")} disabled={dis} onChange={(e) => set("tags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
        </Field>
        <Field label="Featured">
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={!!product.featured} disabled={dis} onChange={(e) => set("featured", e.target.checked || undefined)} /> Show first in the store
          </label>
        </Field>
      </div>

      {product.bundleOf ? (
        <Panel title="Bundle contents" subtitle="Buyers get the files of every product ticked here.">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {catalog.products
              .filter((p) => p.id !== product.id && !p.bundleOf?.length)
              .map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={dis}
                    checked={product.bundleOf!.includes(p.id)}
                    onChange={(e) => set("bundleOf", e.target.checked ? [...product.bundleOf!, p.id] : product.bundleOf!.filter((x) => x !== p.id))}
                  />
                  {p.title} <span className="text-blueprint">({inr(p.price)}{p.files.length ? "" : ", no files yet"})</span>
                </label>
              ))}
          </div>
        </Panel>
      ) : (
        <Panel
          title="Files buyers download"
          subtitle={`Stored privately in the data repository: vault/shop/${product.id}/. Up to 4 MB per upload here.`}
          action={
            editor && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={!!busy || !!filesBlocked || isNew} onClick={() => fileAction({ productId: product.id, sync: true }, "POST", "Looking in the folder…")}>
                  <FolderSearch className="h-4 w-4" /> Find files in folder
                </Button>
                <Button size="sm" disabled={!!busy || !!filesBlocked || isNew} onClick={() => input.current?.click()}>
                  <Upload className="h-4 w-4" /> Upload
                </Button>
                <input ref={input} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
              </div>
            )
          }
        >
          {filesBlocked && editor && <p className="mb-2 text-sm text-amber-800">{filesBlocked}</p>}
          {busy && (
            <p className="mb-2 inline-flex items-center gap-2 text-sm text-blueprint">
              <Loader2 className="h-4 w-4 animate-spin" /> {busy}
            </p>
          )}
          {fileError && <p className="mb-2 text-sm text-red-700">{fileError}</p>}
          {product.files.length ? (
            <ul className="divide-y divide-graphite/10 text-sm">
              {product.files.map((f) => (
                <li key={f.path} className="flex items-center justify-between py-2">
                  <span>
                    {f.name} <span className="text-blueprint">· {formatBytes(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    className="ml-auto mr-3 text-xs font-semibold text-blueprint underline-offset-2 hover:text-graphite hover:underline disabled:opacity-40"
                    disabled={!!busy || !!filesBlocked}
                    onClick={async () => {
                      try {
                        const { url } = await api<{ url: string }>("/api/hq/shop/preview", { method: "POST", body: JSON.stringify({ productId: product.id, fileIndex: product.files.indexOf(f) }) });
                        window.location.href = url;
                      } catch (e) {
                        setFileError(e instanceof Error ? e.message : "Could not make a download link");
                      }
                    }}
                  >
                    Download to check
                  </button>
                  {editor && (
                    <button
                      type="button"
                      className="text-red-700 hover:underline disabled:opacity-40"
                      disabled={!!busy || !!filesBlocked}
                      onClick={() => window.confirm(`Delete ${f.name}? Buyers who already paid lose this file too.`) && fileAction({ productId: product.id, path: f.path }, "DELETE", "Removing…")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-blueprint">No files yet. {isNew ? "Save the product first." : ""}</p>
          )}
        </Panel>
      )}

      {editor && (
        <div className="flex justify-between border-t border-graphite/10 pt-4">
          <button type="button" className="inline-flex items-center gap-1.5 text-sm text-red-700 hover:underline" onClick={() => window.confirm(`Remove "${product.title}" from the store? (Files stay in the data repository.)`) && onDelete()}>
            <Trash2 className="h-4 w-4" /> Remove product
          </button>
          <p className="text-xs text-blueprint">Changes go live when you press Save & publish.</p>
        </div>
      )}
    </div>
  );
}

function OrdersTab({ orders, editor }: { orders: OrderRow[] | null; editor: boolean }) {
  const [note, setNote] = useState("");
  if (!orders) return <Loading label="Loading orders…" />;
  if (!orders.length) return <EmptyState icon="ShoppingBag" title="No orders yet" description="Paid orders appear here the moment Razorpay confirms them." />;
  async function resend(id: string) {
    setNote("");
    try {
      await api("/api/hq/shop/orders", { method: "POST", body: JSON.stringify({ orderId: id }) });
      setNote("Email sent.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    }
  }
  return (
    <Panel title="Orders" subtitle="Live orders are also booked in Finance → Other Income as “Digital products”." bodyClassName="p-0">
      {note && <p className="px-4 pt-3 text-sm text-blueprint">{note}</p>}
      <table className="w-full text-sm">
        <thead className="border-b border-graphite/10 text-left text-xs uppercase tracking-wider text-blueprint">
          <tr>
            <th className="px-4 py-2">When</th>
            <th className="px-4 py-2">Buyer</th>
            <th className="px-4 py-2">Product</th>
            <th className="px-4 py-2 text-right">Paid</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-graphite/5 align-top">
              <td className="whitespace-nowrap px-4 py-2.5">
                {formatDateTime(o.paidAt)}
                {o.mode !== "live" && (
                  <Badge tone="warn" className="ml-2">
                    {o.mode}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2.5">
                {o.name}
                <span className="block text-xs text-blueprint">
                  {o.email}
                  {o.phone ? ` · ${o.phone}` : ""}
                </span>
              </td>
              <td className="px-4 py-2.5">
                {o.items.map((i) => i.title).join(", ")}
                {o.coupon && <span className="block text-xs text-blueprint">coupon {o.coupon} (−{inr(o.discount)})</span>}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {inr(o.total)}
                <span className="block text-xs text-blueprint">{o.method}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">
                <button type="button" title="Copy the buyer's download link" className="p-1 text-blueprint hover:text-graphite" onClick={() => navigator.clipboard.writeText(o.link).then(() => setNote("Download link copied."))}>
                  <Copy className="h-4 w-4" />
                </button>
                {editor && (
                  <button type="button" title="Email the download link again" className="p-1 text-blueprint hover:text-graphite" onClick={() => resend(o.id)}>
                    <Mail className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function CouponsTab({ coupons, editor, onChange }: { coupons: ShopCoupon[]; editor: boolean; onChange: (c: ShopCoupon[]) => void }) {
  const edit = (i: number, patch: Partial<ShopCoupon>) => onChange(coupons.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <Panel
      title="Coupons"
      subtitle="Codes for Instagram (e.g. REEL20 = 20% off). They work on every product. Save & publish after changing."
      action={
        editor && (
          <Button size="sm" variant="secondary" onClick={() => onChange([...coupons, { code: "", kind: "percent", value: 10, active: true }])}>
            <Plus className="h-4 w-4" /> Add coupon
          </Button>
        )
      }
    >
      {!coupons.length ? (
        <p className="text-sm text-blueprint">No coupons yet.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((c, i) => (
            <div key={i} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[1.2fr_1fr_0.8fr_1fr_auto_auto]">
              <Input placeholder="CODE" value={c.code} disabled={!editor} onChange={(e) => edit(i, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} />
              <Select value={c.kind} disabled={!editor} onChange={(e) => edit(i, { kind: e.target.value as ShopCoupon["kind"] })}>
                <option value="percent">% off</option>
                <option value="flat">₹ off</option>
              </Select>
              <Input type="number" min={1} value={c.value} disabled={!editor} onChange={(e) => edit(i, { value: Number(e.target.value) })} />
              <Input type="date" value={c.expires ?? ""} disabled={!editor} title="Last day it works (optional)" onChange={(e) => edit(i, { expires: e.target.value || undefined })} />
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={c.active} disabled={!editor} onChange={(e) => edit(i, { active: e.target.checked })} /> On
              </label>
              {editor && (
                <button type="button" className="text-red-700" onClick={() => onChange(coupons.filter((_, j) => j !== i))} title="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />}
      <span className={cn(!ok && "text-graphite")}>{children}</span>
    </li>
  );
}

function SetupTab({ data }: { data: Loaded }) {
  const hook = typeof window !== "undefined" ? `${window.location.origin.replace("localhost:3011", "www.framemindaistudio.com").replace(/^http:/, "https:")}/api/shop/webhook` : "/api/shop/webhook";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Before the first real sale">
        <ul className="space-y-3 text-sm">
          <Check ok={data.payMode === "live" || data.payMode === "test"}>
            <b>Razorpay keys</b> in Vercel → Settings → Environment Variables: <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> (Razorpay Dashboard → Account & Settings → API keys). Use the
            test keys first, then the live ones. Now: <b>{data.payMode}</b>.
          </Check>
          <Check ok={false}>
            <b>Webhook</b> in Razorpay → Developers → Webhooks: URL <code className="break-all">{hook}</code>, events <code>payment.captured</code> and <code>order.paid</code>, and a secret you
            also save as <code>RAZORPAY_WEBHOOK_SECRET</code>. It delivers orders even when a buyer closes the tab after paying. (HQ can&apos;t see whether this is done.)
          </Check>
          <Check ok={data.mail && !data.testSender}>
            <b>Receipt emails</b>: <code>RESEND_API_KEY</code> with a verified framemindaistudio.com sender in <code>DIGEST_FROM</code>. {data.testSender ? "The test sender only reaches the Resend account's own address." : ""}
          </Check>
          <Check ok={data.storeMode === "github"}>
            <b>Data repository</b> connected, so orders and files are saved. Now: {data.storeMode}.
          </Check>
          <Check ok={false}>
            <b>Razorpay website check</b>: make sure framemindaistudio.com is the website on the Razorpay account, so its risk team expects payments from /shop. (HQ can&apos;t see this.)
          </Check>
        </ul>
      </Panel>
      <Panel title="How a sale works">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-graphite">
          <li>The buyer fills name and email on the product page and pays in Razorpay Checkout (UPI apps, cards, netbanking).</li>
          <li>The server checks the payment with Razorpay, then saves the order to data/shop/orders/.</li>
          <li>The buyer lands on their download page; the same link is emailed to them.</li>
          <li>Download buttons are signed and last 48 hours; the order page makes fresh ones each visit.</li>
          <li>Live orders are booked in Finance → Other Income.</li>
        </ol>
        <p className="mt-4 text-xs text-blueprint">
          Prices are always worked out on the server from this catalogue, so a buyer can&apos;t change what they pay. Abandoned checkouts save nothing.
        </p>
      </Panel>
    </div>
  );
}

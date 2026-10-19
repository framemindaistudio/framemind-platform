"use client";

import { useId, useMemo, useState } from "react";
import { Calculator, CheckCircle2, Loader2, ReceiptText, Save } from "lucide-react";
import { tripTotal } from "@/lib/hq/collections";
import { can, OPS } from "@/lib/hq/roles";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq, useSettings } from "@/components/hq/data";
import { Loading, PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { Notice } from "@/components/hq/sales/bits";
import { useToday } from "@/components/hq/sales/useToday";
import { formatINR, formatNumber, isoDate } from "@/lib/utils";
import { isIso, list, num, str, type Rec } from "@/components/hq/projects/logic";

/** Typical per-km figures — every one is editable in the estimator. */
const VEHICLES = [
  { value: "Own car", label: "Own car (fuel)", ratePerKm: null as number | null, line: "fuelCost", note: "Fuel only, from Settings → fuel cost per km" },
  { value: "Two-wheeler", label: "Two-wheeler", ratePerKm: 3, line: "fuelCost", note: "Fuel only — client meetings and light kit" },
  { value: "Rented car + driver", label: "Rented car + driver", ratePerKm: 14, line: "vehicleRent", note: "Sedan / SUV hire incl. fuel, typical ₹12–16 per km" },
  { value: "Cab", label: "Cab", ratePerKm: 16, line: "vehicleRent", note: "App / outstation cab, typical ₹14–18 per km" },
];

const tripCost = (t: Rec) => {
  const total = tripTotal(t);
  const km = num(t.distanceKm);
  return { total, km, perKm: km ? total / km : 0 };
};

const EXTRA: ExtraColumn<Rec>[] = [
  { key: "total", label: "Total cost", sortValue: (r) => tripCost(r).total, render: (r) => <span className="tabular font-mono text-xs font-semibold">{tripCost(r).total ? formatINR(tripCost(r).total) : "—"}</span> },
  { key: "billed", label: "Client pays", sortValue: (r) => (r.billedToClient ? 1 : 0), render: (r) => (r.billedToClient ? <Badge tone="info">Billable</Badge> : <span className="text-xs text-blueprint">—</span>) },
];

/** Travel: every trip — shoots, client meetings, offline coaching, Vritta installs — and what it cost. */
export function TravelHome() {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;
  const today = useToday();
  const { records: trips, loading, error, save: saveTrip } = useCollection("trips");
  const { save: saveExpense } = useCollection(can(user, OPS) ? "expenses" : "__none");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const stats = useMemo(() => {
    if (!today) return null;
    const live = trips.filter((t) => str(t.status) !== "cancelled");
    const month = live.filter((t) => str(t.date).startsWith(today.slice(0, 7)));
    return {
      count: month.length,
      km: month.reduce((s, t) => s + num(t.distanceKm), 0),
      spend: month.reduce((s, t) => s + tripCost(t).total, 0),
      billable: live.filter((t) => t.billedToClient && !t.rebilled).reduce((s, t) => s + tripCost(t).total, 0),
    };
  }, [trips, today]);

  async function logExpense(t: Rec) {
    const total = tripCost(t).total;
    if (!total) {
      setNotice({ tone: "bad", text: "Add the trip costs first — there is nothing to log yet." });
      return;
    }
    setBusyId(t.id);
    setNotice(null);
    try {
      const to = str(t.to) || "trip";
      const exp = await saveExpense({
        date: str(t.date).slice(0, 10) || isoDate(),
        category: "Travel & fuel",
        amount: total,
        description: `${str(t.purpose) || "Trip"} — ${to}${num(t.distanceKm) ? ` (${formatNumber(num(t.distanceKm))} km)` : ""}`,
        projectId: str(t.projectId) || undefined,
        paidBy: "Company account",
        billable: t.billedToClient === true,
        notes: `Logged from Travel — trip ${t.id}.`,
      });
      await saveTrip({ ...t, expenseId: exp.id });
      setNotice({ tone: "ok", text: `Logged ${formatINR(total)} as a “Travel & fuel” expense${t.billedToClient ? " (marked to re-bill to the client)" : ""}.` });
    } catch (e) {
      setNotice({ tone: "bad", text: e instanceof Error ? e.message : "Could not log the expense" });
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Delivery" title="Travel" icon="Car" description="Every trip — shoots, client meetings, offline coaching and Vritta installs — with an estimator to plan before you go. Outstation shoots are on the client: mark those trips billable." />
      {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
      {!today || loading ? (
        <Loading label="Loading trips…" />
      ) : (
        <div className="space-y-8">
          {stats && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Trips this month" value={stats.count} sub="Planned and done" />
              <StatCard label="Distance this month" value={`${formatNumber(Math.round(stats.km))} km`} sub="Round-trip totals" />
              <StatCard label="Spend this month" value={formatINR(stats.spend)} sub="Fuel, tickets, tolls, stay, food" tone="dark" />
              <StatCard label="To re-bill to clients" value={formatINR(stats.billable)} sub="Trips marked billable" />
            </div>
          )}
          <TripEstimator canWrite={canWrite} />
          <section>
            <h2 className="annot mb-4 text-blueprint">All trips</h2>
            {notice && <Notice tone={notice.tone} className="mb-4">{notice.text}</Notice>}
            <CollectionManager<Rec>
              name="trips"
              columns={["date", "purpose", "status", "to", "distanceKm", "vehicle"]}
              extraColumns={EXTRA}
              newLabel="New trip"
              emptyText="No trips yet. Use the estimator above and save it as a trip."
              rowActions={(t) =>
                t.expenseId ? (
                  <Badge tone="ok">
                    <CheckCircle2 className="size-3" /> Logged
                  </Badge>
                ) : canWrite ? (
                  <button type="button" onClick={() => logExpense(t)} disabled={busyId === t.id || str(t.status) === "cancelled"} className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-graphite/25 px-2.5 text-xs font-semibold hover:border-graphite hover:bg-lime disabled:pointer-events-none disabled:opacity-40">
                    {busyId === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <ReceiptText className="size-3.5" />} Log as expense
                  </button>
                ) : null
              }
            />
          </section>
        </div>
      )}
    </div>
  );
}

const toNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const amount = (v: number) => (v > 0 ? formatINR(v) : "—");

function TripEstimator({ canWrite }: { canWrite: boolean }) {
  const uid = useId();
  const { settings } = useSettings();
  const { save } = useCollection("trips");
  const { records: projects } = useCollection("projects");
  const { records: shoots } = useCollection("shoots");
  const [km, setKm] = useState("60");
  const [vehicle, setVehicle] = useState(VEHICLES[0].value);
  const [rateOverride, setRateOverride] = useState<string | null>(null);
  const [toll, setToll] = useState("0");
  const [nights, setNights] = useState("0");
  const [stayRate, setStayRate] = useState("2500");
  const [people, setPeople] = useState("2");
  const [food, setFood] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");
  const [purpose, setPurpose] = useState("Shoot");
  const [projectId, setProjectId] = useState("");
  const [shootId, setShootId] = useState("");
  const [billable, setBillable] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const preset = VEHICLES.find((p) => p.value === vehicle) ?? VEHICLES[0];
  const presetRate = preset.ratePerKm ?? num(settings.fuelCostPerKm);
  const rate = rateOverride !== null ? toNum(rateOverride) : presetRate;
  const calc = useMemo(() => {
    const distance = toNum(km);
    const vehicleCost = Math.round(distance * rate);
    const tolls = Math.round(toNum(toll));
    const stay = Math.round(toNum(nights) * toNum(stayRate));
    const foodTotal = Math.round(toNum(people) * toNum(food));
    const total = vehicleCost + tolls + stay + foodTotal;
    return { distance, vehicleCost, tolls, stay, foodTotal, total, perKm: distance ? total / distance : 0 };
  }, [km, rate, toll, nights, stayRate, people, food]);

  function pickShoot(id: string) {
    setShootId(id);
    const s = shoots.find((x) => x.id === id);
    if (!s) return;
    if (!date && isIso(s.date)) setDate(str(s.date).slice(0, 10));
    if (!to) setTo(str(s.location));
    if (s.projectId) setProjectId(str(s.projectId));
    setPurpose("Shoot");
    if (num(s.distanceKm)) setKm(String(num(s.distanceKm) * 2));
  }

  async function saveTrip() {
    if (!isIso(date) || !to.trim()) {
      setError("Add the date and destination.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const s = shoots.find((x) => x.id === shootId);
      await save({
        purpose,
        projectId: projectId || undefined,
        shootId: shootId || undefined,
        date,
        status: "planned",
        from: settings.baseLocation || "Base",
        to: to.trim(),
        distanceKm: calc.distance,
        vehicle: preset.value,
        billedToClient: billable,
        team: list(s?.crew),
        fuelCost: preset.line === "fuelCost" ? calc.vehicleCost : 0,
        vehicleRent: preset.line === "vehicleRent" ? calc.vehicleCost : 0,
        tollParking: calc.tolls,
        accommodation: calc.stay,
        food: calc.foodTotal,
        notes: `From the estimator: ${formatNumber(calc.distance)} km at ${formatINR(rate)} per km (${preset.label}), ${toNum(nights)} night(s), ${toNum(people)} people.`,
      });
      setOpen(false);
      setSaved(`Trip to ${to.trim()} saved — ${formatINR(calc.total)} estimated.`);
      setDate("");
      setTo("");
      setShootId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the trip");
    } finally {
      setSaving(false);
    }
  }

  const f = (n: string) => `${uid}-${n}`;
  return (
    <Panel title="Trip cost estimator" subtitle="Plan the cost before you commit — rates are typical figures; replace them with your actual quote" bodyClassName="p-0">
      <div className="grid lg:grid-cols-[1fr_21rem]">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Round-trip distance (km)" htmlFor={f("km")}>
            <Input id={f("km")} type="number" min={0} value={km} onChange={(e) => setKm(e.target.value)} />
          </Field>
          <Field label="Vehicle" htmlFor={f("v")} help={preset.note}>
            <Select id={f("v")} value={vehicle} onChange={(e) => { setVehicle(e.target.value); setRateOverride(null); }}>
              {VEHICLES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rate (₹ per km)" htmlFor={f("r")}>
            <Input id={f("r")} type="number" min={0} step="0.5" value={rateOverride ?? String(presetRate)} onChange={(e) => setRateOverride(e.target.value)} />
          </Field>
          <Field label="Tolls & parking (₹)" htmlFor={f("t")}>
            <Input id={f("t")} type="number" min={0} value={toll} onChange={(e) => setToll(e.target.value)} />
          </Field>
          <Field label="Stay (nights)" htmlFor={f("n")} help="0 for same-day trips">
            <Input id={f("n")} type="number" min={0} value={nights} onChange={(e) => setNights(e.target.value)} />
          </Field>
          <Field label="Stay per night (₹, whole crew)" htmlFor={f("s")}>
            <Input id={f("s")} type="number" min={0} value={stayRate} onChange={(e) => setStayRate(e.target.value)} />
          </Field>
          <Field label="People travelling" htmlFor={f("p")}>
            <Input id={f("p")} type="number" min={0} value={people} onChange={(e) => setPeople(e.target.value)} />
          </Field>
          <Field label="Food per person (₹)" htmlFor={f("fd")}>
            <Input id={f("fd")} type="number" min={0} placeholder="0" value={food} onChange={(e) => setFood(e.target.value)} />
          </Field>
        </div>
        <aside className="border-t border-graphite bg-graphite p-5 text-paper lg:border-l lg:border-t-0">
          <p className="annot flex items-center gap-2 text-lime">
            <Calculator className="size-3.5" /> Estimated trip cost
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              rate > 0 ? [`${preset.label} · ${formatNumber(calc.distance)} km × ${formatINR(rate)}`, amount(calc.vehicleCost)] : [`${preset.label} · rate per km not set`, "—"],
              ["Tolls & parking", amount(calc.tolls)],
              [`Stay · ${toNum(nights)} night${toNum(nights) === 1 ? "" : "s"}`, amount(calc.stay)],
              [`Food · ${toNum(people)} × ${formatINR(toNum(food))}`, amount(calc.foodTotal)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dashed border-paper/15 pb-2">
                <dt className="text-paper/70">{k}</dt>
                <dd className="tabular font-mono">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="tabular mt-4 font-mono text-3xl font-bold tracking-tight">{amount(calc.total)}</p>
          <p className="mt-1 text-xs text-paper/60">{calc.perKm ? `${formatINR(calc.perKm)} per km all-in` : "Enter a distance and the costs"}</p>
          <p className="mt-3 text-xs leading-relaxed text-paper/55">Travel within 25 km of base is included in shoot prices; outstation travel and stay are covered by the client.</p>
          {canWrite && (
            <Button variant="lime" className="mt-5 w-full" disabled={!calc.total} onClick={() => { setError(""); setOpen(true); }}>
              <Save className="size-4" /> Save as trip
            </Button>
          )}
        </aside>
      </div>
      {saved && (
        <div className="border-t border-graphite/10 p-4">
          <Notice tone="ok">{saved}</Notice>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Save as trip"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveTrip} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save trip
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Shoot (optional)" htmlFor={f("m-shoot")} help="Fills the date, destination and project">
            <Select id={f("m-shoot")} value={shootId} onChange={(e) => pickShoot(e.target.value)}>
              <option value="">Not a shoot</option>
              {[...shoots].sort((a, b) => str(b.date).localeCompare(str(a.date))).map((s) => (
                <option key={s.id} value={s.id}>
                  {str(s.date)} — {str(s.title)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Purpose" htmlFor={f("m-purpose")}>
            <Select id={f("m-purpose")} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {["Shoot", "Client meeting", "Offline coaching", "Vritta implementation", "Event", "Other"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Project (optional)" htmlFor={f("m-project")}>
            <Select id={f("m-project")} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {str(p.title)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trip date" htmlFor={f("m-date")} required>
            <Input id={f("m-date")} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Destination" htmlFor={f("m-to")} required>
            <Input id={f("m-to")} value={to} onChange={(e) => setTo(e.target.value)} placeholder="Client office, location or city" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="accent-[#0d0d0d]" /> The client pays for this trip (outstation)
          </label>
          {error && <Notice tone="bad">{error}</Notice>}
        </div>
      </Modal>
    </Panel>
  );
}

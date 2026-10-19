"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import SEO from "@/site/components/SEO";
import { submitLead } from "@/site/leads";
import { APPLY_ROLES, ENGAGEMENT, HEARD, LANGUAGES, SKILLS, WORK_MODE, appliedFor, linksRequired, type RoleId } from "@/lib/content/careers";

/*
 * /careers — applications go to HQ → Enquiries → Careers, with every answer kept on the enquiry.
 * Written in the website's own style (the Connect page's form, the Team page's dark strips).
 */

const PROMPTS: Record<RoleId, { links: string; linksHint: string; message: string; messageHint: string }> = {
  design: { links: "Portfolio link", linksHint: "Behance, Dribbble, a Figma file or a Drive folder — student and personal work counts.", message: "Which piece of your work are you proudest of, and why?", messageHint: "What the brief was and what you decided." },
  development: { links: "GitHub, portfolio or a live project", linksHint: "Anything you built yourself, even small.", message: "What have you built?", messageHint: "The project, the stack, and the part you wrote." },
  media: { links: "Showreel or portfolio link", linksHint: "YouTube, Instagram, Drive or Behance — student work counts.", message: "What do you shoot or edit, and with what?", messageHint: "The kind of work you make, your gear and your fastest turnaround." },
  social: { links: "Accounts or posts you have run (optional)", linksHint: "Your own page counts.", message: "Show us how you think about content", messageHint: "A post or campaign you made, and what happened." },
  business: { links: "LinkedIn (optional)", linksHint: "", message: "Why you, and why FrameMind?", messageHint: "Any sales, client or outreach experience, and the languages you speak with confidence." },
  other: { links: "Links (optional)", linksHint: "", message: "What would you do at FrameMind?", messageHint: "The role you have in mind and what you would bring to it." },
};

const label = "font-mono text-xs text-muted-foreground uppercase tracking-widest";
const field = "border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground";

function Chips({ title, options, value, onChange }: { title: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={`${label} mb-2`}>{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
              className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                on ? "border-[#0D0D0D] bg-[#0D0D0D] text-[#F5F4F0]" : "border-border text-foreground hover:border-foreground/40"
              }`}
            >
              {on && <Check size={12} className="text-[#C8F135]" />}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Careers() {
  const formTop = useRef<HTMLDivElement>(null);
  // /careers?role=development chooses the role
  const linked = useSearchParams().get("role");
  const [role, setRole] = useState<RoleId | "">(() => (APPLY_ROLES.some((x) => x.id === linked) ? (linked as RoleId) : ""));
  const [roleOther, setRoleOther] = useState("");
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "", current: "", experience: "", links: "", message: "", startFrom: "", heardFrom: "", workMode: "", website: "" });
  const [student, setStudent] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const choose = (id: RoleId) => {
    setRole(id);
    setSkills([]);
    setError("");
  };
  const applyFor = (id: RoleId) => {
    choose(id);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const prompts = role ? PROMPTS[role] : PROMPTS.other;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      setError("Choose the role you are applying for.");
      formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (role === "other" && !roleOther.trim()) return setError("Tell us the role you have in mind.");
    if (linksRequired(role) && !f.links.trim()) return setError(`Add your ${role === "media" ? "showreel" : "portfolio"} link — for this role it is the application.`);
    setLoading(true);
    setError("");
    const application = { role, roleOther, current: f.current, student, experience: f.experience, skills, engagement, workMode: f.workMode, languages, links: f.links, startFrom: f.startFrom, heardFrom: f.heardFrom };
    const result = await submitLead({
      kind: "careers",
      name: f.name,
      phone: f.phone,
      email: f.email,
      city: f.city,
      message: f.message,
      website: f.website,
      application,
    });
    setLoading(false);
    if (result.ok) {
      setDone(true);
      formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else setError(result.error);
  }

  return (
    <div>
      <SEO
        title="Careers — Work at FrameMind AI Studio"
        description="Join FrameMind AI Studio in Gadag, Karnataka: designers, developers, photographers and video editors, social media and business development. Full-time, internship and freelance."
        path="/careers"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Careers — FrameMind AI Studio",
          description: "Apply to work with FrameMind AI Studio.",
          url: "https://www.framemindaistudio.com/careers",
        }}
      />

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 block">Careers</span>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5 max-w-2xl">Build real work with us.</h1>
        <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
          FrameMind is a small, founder-led studio in Gadag building websites, brands, software and media for real clients. Full-time, internship and freelance.
        </p>
      </section>

      {/* Roles */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">Where we hire</span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">The work we do, and the people it needs.</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Not every role is open at every moment. Apply anyway — every application is read.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {APPLY_ROLES.map((r) => (
              <div key={r.id} className="bg-background p-6 flex flex-col">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{r.code === "R-00" ? "Open" : r.code}</span>
                <h3 className="font-semibold text-base mt-2 mb-1.5 tracking-tight">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{r.short}</p>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">{r.type}</p>
                <button
                  type="button"
                  onClick={() => applyFor(r.id)}
                  className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline underline-offset-4"
                >
                  Apply <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
          {[
            { n: "01", t: "You apply", b: "This form takes five minutes. For design and video, the portfolio is the application." },
            { n: "02", t: "We read it", b: "Every application is read by the founder, not filtered by software." },
            { n: "03", t: "We talk", b: "If your work fits what the studio needs, we get in touch for a conversation." },
          ].map((s) => (
            <div key={s.n} className="bg-[#0a0a0a] p-6 sm:p-8">
              <span className="font-mono text-3xl font-bold text-[#C8F135] block mb-4 leading-none">{s.n}</span>
              <h3 className="font-semibold text-[#F5F4F0] text-sm mb-2">{s.t}</h3>
              <p className="text-xs text-[#888] leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="border-t border-border" id="apply">
        <div ref={formTop} className="max-w-3xl mx-auto px-6 py-12 md:py-16 scroll-mt-20">
          {done ? (
            <div className="border border-border rounded-sm p-10 text-center flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 bg-[#C8F135] rounded-sm flex items-center justify-center mb-5">
                <Check size={18} className="text-[#0D0D0D]" />
              </div>
              <h2 className="font-semibold text-xl mb-2">Thank you, {f.name.trim().split(" ")[0]}. Your application is in.</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                You applied for <strong className="text-foreground">{role ? appliedFor({ role, roleOther }) : ""}</strong>. If your profile fits what the studio needs, we will get in touch.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-8" aria-label="Job application">
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">Apply</span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Tell us about you.</h2>
              </div>

              {/* honeypot: hidden from people, filled by bots */}
              <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

              {/* 1 · role */}
              <fieldset className="flex flex-col gap-3">
                <legend className={`${label} mb-3`}>
                  1 · The role you are applying for <span className="text-foreground">*</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {APPLY_ROLES.map((r) => {
                    const on = role === r.id;
                    return (
                      <label
                        key={r.id}
                        className={`flex cursor-pointer gap-3 rounded-sm border p-4 transition-colors ${on ? "border-[#0D0D0D] bg-[#0D0D0D] text-[#F5F4F0]" : "border-border hover:border-foreground/40"}`}
                      >
                        <input type="radio" name="role" value={r.id} checked={on} onChange={() => choose(r.id)} className="sr-only" />
                        <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${on ? "border-[#C8F135]" : "border-foreground/30"}`} aria-hidden>
                          {on && <span className="size-2 rounded-full bg-[#C8F135]" />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold leading-snug">{r.title}</span>
                          <span className={`block text-xs mt-0.5 ${on ? "text-[#aaa]" : "text-muted-foreground"}`}>{r.type}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {role === "other" && <input value={roleOther} onChange={(e) => setRoleOther(e.target.value)} maxLength={80} placeholder="Which role? e.g. 3D designer, operations intern" className={field} />}
              </fieldset>

              {/* 2 · you */}
              <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <legend className={`${label} mb-3 sm:col-span-2`}>2 · About you</legend>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-name">
                    Name <span className="text-foreground">*</span>
                  </label>
                  <input id="c-name" required value={f.name} onChange={set("name")} maxLength={120} autoComplete="name" placeholder="Your full name" className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-phone">
                    Phone / WhatsApp <span className="text-foreground">*</span>
                  </label>
                  <input id="c-phone" required type="tel" value={f.phone} onChange={set("phone")} maxLength={20} autoComplete="tel" placeholder="+91 98765 43210" className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-email">
                    Email
                  </label>
                  <input id="c-email" type="email" value={f.email} onChange={set("email")} maxLength={160} autoComplete="email" placeholder="you@example.com" className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-city">
                    City
                  </label>
                  <input id="c-city" value={f.city} onChange={set("city")} maxLength={80} autoComplete="address-level2" placeholder="e.g. Gadag, Hubballi, Bengaluru" className={field} />
                </div>
                <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={student} onChange={(e) => setStudent(e.target.checked)} className="size-4 accent-[#0D0D0D]" />
                  I am a student
                </label>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-current">
                    {student ? "College, course and year" : "What you do now"}
                  </label>
                  <input id="c-current" value={f.current} onChange={set("current")} maxLength={120} placeholder={student ? "e.g. B.Des, 3rd year" : "e.g. Freelance designer"} className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-exp">
                    Experience (years)
                  </label>
                  <input id="c-exp" type="number" inputMode="decimal" min={0} max={40} step={0.5} value={f.experience} onChange={set("experience")} placeholder="0" className={field} />
                </div>
              </fieldset>

              {/* 3 · how */}
              <fieldset className="flex flex-col gap-6">
                <legend className={`${label} mb-3`}>3 · Skills and how you want to work</legend>
                {role && SKILLS[role].length > 0 && <Chips title="What you can do (tick all that fit)" options={SKILLS[role]} value={skills} onChange={setSkills} />}
                <Chips title="How you want to work" options={ENGAGEMENT} value={engagement} onChange={setEngagement} />
                <Chips title="Languages you speak with confidence" options={LANGUAGES} value={languages} onChange={setLanguages} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className={label} htmlFor="c-mode">
                      Where
                    </label>
                    <select id="c-mode" value={f.workMode} onChange={set("workMode")} className={`${field} text-muted-foreground`}>
                      <option value="">Choose</option>
                      {WORK_MODE.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={label} htmlFor="c-start">
                      You could start from <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <input id="c-start" type="date" value={f.startFrom} onChange={set("startFrom")} className={field} />
                  </div>
                </div>
              </fieldset>

              {/* 4 · work */}
              <fieldset className="flex flex-col gap-5">
                <legend className={`${label} mb-3`}>4 · Your work</legend>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-links">
                    {prompts.links} {role && linksRequired(role) && <span className="text-foreground">*</span>}
                  </label>
                  <input id="c-links" value={f.links} onChange={set("links")} maxLength={600} placeholder="https://" className={field} />
                  {prompts.linksHint && <p className="text-xs text-muted-foreground">{prompts.linksHint}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="c-message">
                    {prompts.message}
                  </label>
                  <textarea id="c-message" value={f.message} onChange={set("message")} rows={5} maxLength={3000} className={`${field} resize-none`} />
                  <p className="text-xs text-muted-foreground">{prompts.messageHint}</p>
                </div>
                <div className="flex flex-col gap-1.5 sm:max-w-xs">
                  <label className={label} htmlFor="c-heard">
                    How did you hear about us? <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <select id="c-heard" value={f.heardFrom} onChange={set("heardFrom")} className={`${field} text-muted-foreground`}>
                    <option value="">Select one</option>
                    {HEARD.map((h) => (
                      <option key={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {error && (
                <p role="alert" className="border border-[#d4183d]/30 bg-[#d4183d]/5 text-[#d4183d] rounded-sm px-4 py-3 text-sm">
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border pt-6">
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">We use these details only to consider your application.</p>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0D0D0D] text-[#F5F4F0] px-6 py-3.5 text-sm font-medium rounded-sm hover:bg-[#222] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : <><span>Send application</span><ArrowRight size={13} /></>}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

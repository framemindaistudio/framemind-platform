"use client";

import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Linkedin } from "@/site/components/BrandIcons";
import SEO from "@/site/components/SEO";
import { SERVICE_IDS, submitLead } from "@/site/leads";
import { ImageWithFallback } from "@/site/components/ImageWithFallback";
const founderPhoto = "/site/chinmay-portrait.jpg";

const services = [
  "Website",
  "Brand Guidelines",
  "Software Solution",
  "Automations",
  "1:1 Personal AI & ML Coaching",
  "AI Books",
  "Not sure yet",
];

const budgetRanges = [
  "Under ₹50,000",
  "₹50,000 – ₹1,50,000",
  "₹1,50,000 – ₹5,00,000",
  "₹5,00,000+",
  "Let's figure it out",
];

const timelines = [
  "As soon as possible",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Just exploring for now",
];

const sources = [
  "LinkedIn",
  "Instagram",
  "Build For Real",
  "Word of mouth / referral",
  "Google search",
  "Other",
];

export default function Connect() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    budget: "",
    timeline: "",
    source: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [error, setError] = useState("");
  const [trap, setTrap] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const service = SERVICE_IDS[form.service];
    const result = await submitLead({
      kind: service === "coaching" ? "coaching" : form.service ? "project" : "contact",
      name: form.name,
      email: form.email,
      phone: form.phone,
      organisation: form.company,
      services: service ? [service] : [],
      budget: form.budget,
      timeline: form.timeline,
      message: [form.message, form.service && !service ? `Service: ${form.service}` : "", form.source ? `Heard about us: ${form.source}` : ""].filter(Boolean).join("\n\n"),
      website: trap,
    });
    setLoading(false);
    if (result.ok) setSubmitted(true);
    else setError(result.error);
  };

  return (
    <div>
      <SEO
        title="Contact Us — Start a Project"
        description="Tell us what you're building. FrameMind Studio offers a free 20-minute discovery call — no decks, no proposals. Just a direct conversation about your project."
        path="/connect"
        keywords="hire web designer India, contact design studio India, start a project web design, free discovery call, web development enquiry India, FrameMind contact"
        ogImageAlt="FrameMind AI Studio — Contact Us & Start a Project"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact FrameMind AI Studio",
          "description": "Start a project with FrameMind AI Studio. Free 20-minute discovery call — no decks, no proposals.",
          "url": "https://www.framemindaistudio.com/connect",
          "publisher": { "@type": "Organization", "name": "FrameMind AI Studio" },
        }}
      />
      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 block">
          Connect
        </span>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5 max-w-2xl">
          {"Let's talk."}
        </h1>
      </section>

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left — founder note + direct links */}
          <div>
            {/* Founder card — bold split layout */}
            <div className="bg-[#0D0D0D] text-[#F5F4F0] rounded-sm overflow-hidden mb-8">
              {/* Photo — full portrait, no cropping */}
              <div className="relative w-full bg-[#0D0D0D]">
                <ImageWithFallback
                  src={founderPhoto}
                  alt="Chinmay R M — Founder, FrameMind AI Studio"
                  className="w-full object-contain block"
                />
                {/* Gradient fade into card body */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0D0D0D] to-transparent" />
                {/* Electric Lime accent bar */}
                <div className="absolute top-0 left-0 w-1 h-full bg-[#C8F135]" />
              </div>

              {/* Quote + name */}
              <div className="px-5 sm:px-8 pt-2 pb-6 sm:pb-8">
                <p className="text-[11px] font-mono text-[#C8F135] uppercase tracking-widest mb-4">Founder's Note</p>
                <p className="text-base leading-relaxed text-[#E0E0E0] mb-6">
                  "Every project I take on starts the same way — a real conversation about what you're actually building, not a requirements form. Reach out directly and we'll figure out whether we're a fit."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-1 h-12 bg-[#C8F135] shrink-0" />
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-[#F5F4F0]">Chinmay R M</p>
                    <p className="font-mono text-xs text-[#888] mt-1">Founder, FrameMind AI Studio</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <a
                href="mailto:framemindaistudio@gmail.com"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-8 h-8 border border-border rounded-sm flex items-center justify-center group-hover:border-foreground/30 transition-colors">
                  <Mail size={14} />
                </div>
                framemindaistudio@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/chinmay-rm/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-8 h-8 border border-border rounded-sm flex items-center justify-center group-hover:border-foreground/30 transition-colors">
                  <Linkedin size={14} />
                </div>
                linkedin
              </a>
            </div>

            <p className="font-mono text-xs text-muted-foreground mt-8 border-t border-border pt-6">
              We typically respond within 1–2 business days.
            </p>
          </div>

          {/* Right — form */}
          <div>
            {submitted ? (
              <div className="border border-border rounded-sm p-10 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 bg-[#C8F135] rounded-sm flex items-center justify-center mb-5">
                  <ArrowRight size={18} className="text-[#0D0D0D]" />
                </div>
                <h2 className="font-semibold text-xl mb-2">Message received.</h2>
                <p className="text-sm text-muted-foreground">
                  We'll get back to you within 1–2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      Name <span className="text-foreground">*</span>
                    </label>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      Email <span className="text-foreground">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      Phone
                      <span className="text-muted-foreground ml-1">(optional)</span>
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      Company / Project
                      <span className="text-muted-foreground ml-1">(optional)</span>
                    </label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Where you're building from"
                    className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground"
                  />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                    Service interested in
                  </label>
                  <select
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 text-muted-foreground"
                  >
                    <option value="">Select a service</option>
                    {services.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                    Budget range
                    <span className="text-muted-foreground ml-1">(optional)</span>
                  </label>
                  <select
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 text-muted-foreground"
                  >
                    <option value="">Select a range</option>
                    {budgetRanges.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      Project timeline
                      <span className="text-muted-foreground ml-1">(optional)</span>
                    </label>
                    <select
                      name="timeline"
                      value={form.timeline}
                      onChange={handleChange}
                      className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 text-muted-foreground"
                    >
                      <option value="">When do you want to start?</option>
                      {timelines.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      How did you hear about us?
                      <span className="text-muted-foreground ml-1">(optional)</span>
                    </label>
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleChange}
                      className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 text-muted-foreground"
                    >
                      <option value="">Select one</option>
                      {sources.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                    Message <span className="text-foreground">*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us what you're building..."
                    className="border border-border rounded-sm px-4 py-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground resize-none"
                  />
                </div>

                {/* honeypot: hidden from people, filled by bots */}
                <input type="text" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                {error && (
                  <p role="alert" className="border border-[#d4183d]/30 bg-[#d4183d]/5 text-[#d4183d] rounded-sm px-4 py-3 text-sm">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0D0D0D] text-[#F5F4F0] px-6 py-3.5 text-sm font-medium rounded-sm hover:bg-[#222] transition-colors flex items-center justify-center gap-2 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : <><span>Send message</span><ArrowRight size={13} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

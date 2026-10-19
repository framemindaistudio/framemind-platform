/**
 * Website forms → HQ Enquiries. Posts to /api/public/submit (same deployment), which files the lead in the private
 * data repository as a "Website form" enquiry, ready to convert into a client in the CRM.
 */
export interface LeadInput {
  kind: "project" | "coaching" | "vritta" | "contact" | "careers" | "partner";
  name: string;
  email?: string;
  phone?: string;
  organisation?: string;
  city?: string;
  services?: string[];
  budget?: string;
  timeline?: string;
  message?: string;
  /** the careers form's answers (kind "careers"), checked by the server against src/lib/content/careers.ts */
  application?: Record<string, unknown>;
  /** the hidden honeypot field: people never fill it */
  website?: string;
}

export async function submitLead(lead: LeadInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/public/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, page: typeof window === "undefined" ? "" : window.location.pathname }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: j.error || "Something went wrong. Please try again, or write to framemindaistudio@gmail.com." };
  } catch {
    return { ok: false, error: "We couldn't reach the server. Check your connection and try again, or write to framemindaistudio@gmail.com." };
  }
}

/** The service names the website's forms use → HQ's service ids. */
export const SERVICE_IDS: Record<string, string> = {
  Website: "websites",
  "Brand Guidelines": "brand",
  "Software Solution": "software",
  Automations: "automations",
  "1:1 Personal AI & ML Coaching": "coaching",
  "AI Books": "other",
};

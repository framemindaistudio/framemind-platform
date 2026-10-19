import { NextResponse } from "next/server";
import { upsertRecord } from "@/lib/hq/records";
import { apiError, clientIp, rateLimit } from "@/lib/hq/api";
import { site } from "@/lib/site";
import { appliedFor, cleanApplication } from "@/lib/content/careers";
import { StoreReadOnlyError } from "@/lib/store";

/**
 * Website enquiry forms → HQ "Enquiries" (data/leads.json).
 * POST { kind, name, phone, email, organisation, role, city, services[], budget, timeline, ageTrack, message, page, application (careers form), website(honeypot) }
 *
 * The studio website lives on another address, so the browser asks first (OPTIONS): only the website's own origin
 * (NEXT_PUBLIC_WEBSITE_URL) and this portal may post.
 */
const KINDS = ["project", "coaching", "vritta", "contact", "careers", "partner"];
const SERVICES = ["websites", "brand", "software", "automations", "photography", "videography", "social", "coaching", "vritta", "other"];
const TRACKS = ["10-20", "21-35", "36-60"];

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = [site.website, site.url].map((u) => new URL(u).origin);
  return allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {};
}

export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}

export async function POST(req: Request) {
  const headers = cors(req);
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
  const ip = clientIp(req);
  if (!rateLimit(`submit:${ip}`, 8, 10 * 60 * 1000)) return reply({ error: "Too many submissions — please try again in a few minutes." }, 429);
  // overall ceiling per server instance, so a distributed burst cannot flood HQ with commits
  if (!rateLimit("submit:all", 40, 60 * 1000)) return reply({ error: "We are receiving a lot of requests right now — please try again in a minute." }, 429);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Invalid request" }, 400);
  }
  // honeypot: real people never fill the hidden "website" field
  if (body.website) return reply({ ok: true });

  const str = (k: string, max = 200) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const kind = KINDS.includes(str("kind")) ? str("kind") : "contact";
  const name = str("name", 120);
  const phone = str("phone", 30);
  const email = str("email", 160);
  if (!name) return reply({ error: "Please tell us your name." }, 400);
  if (!phone && !email) return reply({ error: "Please share a phone number or email so we can reach you." }, 400);
  if (phone && !/^[+\d][\d\s-]{7,15}$/.test(phone)) return reply({ error: "Please enter a valid phone number." }, 400);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return reply({ error: "Please enter a valid email." }, 400);

  // a job application: the careers form's answers, cleaned to the known choices
  const application = kind === "careers" ? cleanApplication(body.application) : undefined;
  if (kind === "careers" && !phone) return reply({ error: "We call every applicant, so please share a phone number." }, 400);

  const services = Array.isArray(body.services) ? (body.services as unknown[]).map(String).filter((s) => SERVICES.includes(s)) : [];

  try {
    await upsertRecord(
      "leads",
      {
        kind,
        status: "new",
        channel: "Website form",
        name,
        phone,
        email,
        organisation: str("organisation", 160),
        role: application ? appliedFor(application).slice(0, 80) : str("role", 80),
        city: str("city", 80),
        services,
        budget: str("budget", 60),
        timeline: str("timeline", 80),
        ageTrack: TRACKS.includes(str("ageTrack")) ? str("ageTrack") : undefined,
        message: str("message", 3000),
        page: str("page", 120),
        application,
      },
      "Website",
    );
    return reply({ ok: true });
  } catch (e) {
    // Visitors must never see internal setup messages (missing token, public data repo…).
    if (e instanceof StoreReadOnlyError) {
      console.error("[public form] store is not writable:", e.message);
      return reply({ error: "We can't take this online right now. Please try again a little later, or contact us directly." }, 503);
    }
    return apiError(e);
  }
}

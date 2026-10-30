import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { readSettings } from "@/lib/hq/records";
import { readInks } from "@/lib/hq/signatures";
import { ALL, OPS } from "@/lib/hq/roles";

/**
 * GET → { digital, inks } for the printed documents (invoices, receipts, quotes, POs, payslips, letters, certificates).
 *
 * `digital` is Settings → "Sign documents digitally". When it is on, founders, admins and Operations & Accounts (the
 * roles that issue these documents) also get the founders' saved signatures, to print above the signatory's name.
 * Everyone else gets no pictures, and their prints keep a blank space for signing by hand.
 */
export async function GET() {
  const { user, error } = await apiUser(ALL);
  if (error) return error;
  try {
    const { settings } = await readSettings();
    const digital = settings.signDigitally !== false;
    const inks = digital && OPS.includes(user.role) ? await readInks() : {};
    return NextResponse.json({ digital, inks }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return apiError(e);
  }
}

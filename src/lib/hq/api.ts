import "server-only";
import { NextResponse } from "next/server";
import { StoreConflictError, StorePathError, StoreReadOnlyError } from "@/lib/store";
import { ValidationError } from "./records";

/** Map known errors to clean JSON responses. */
export function apiError(e: unknown) {
  if (e instanceof ValidationError) return NextResponse.json({ error: e.message, issues: e.issues }, { status: 400 });
  if (e instanceof StoreReadOnlyError) return NextResponse.json({ error: e.message, readonly: true }, { status: 503 });
  if (e instanceof StoreConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
  if (e instanceof StorePathError) return NextResponse.json({ error: e.message }, { status: 400 });
  console.error("[HQ API]", e);
  return NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong" }, { status: 500 });
}

/** Tiny best-effort in-memory rate limiter (per serverless instance). */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= max;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

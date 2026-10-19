import { NextResponse } from "next/server";
import { apiUser, configuredUsers } from "@/lib/hq/auth";
import { LEADERSHIP } from "@/lib/hq/roles";
import { site } from "@/lib/site";

/**
 * GET → the HQ logins configured in the HQ_USERS env var (founder / admin only).
 * Passwords are NEVER returned — only whether each one is stored as a sha256 hash.
 * Also returns booleans describing which deployment env vars are set (no values),
 * so Settings → System status can say what is still missing.
 */
export async function GET() {
  const { error } = await apiUser(LEADERSHIP);
  if (error) return error;

  const users = configuredUsers().map((u) => ({
    username: u.username,
    name: u.name,
    role: u.role,
    passwordHashed: u.password.startsWith("sha256:"),
  }));

  const set = (v: string | undefined) => !!v && v.trim().length > 0;
  const env = {
    sessionSecret: (process.env.HQ_SESSION_SECRET ?? "").length >= 32,
    hqUsers: users.length > 0,
    githubToken: set(process.env.GITHUB_TOKEN),
    githubRepo: set(process.env.GITHUB_REPO),
    // true once the public address is a real domain (the env var, or the built-in production default)
    siteUrl: !/localhost|127\.0\.0\.1/.test(site.url),
    contactEmail: set(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    contactPhone: set(process.env.NEXT_PUBLIC_CONTACT_PHONE),
    whatsapp: set(process.env.NEXT_PUBLIC_WHATSAPP),
    deployHook: set(process.env.VERCEL_DEPLOY_HOOK_URL),
  };

  return NextResponse.json({ users, env });
}

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/hq/session";
import { EDITORS, VIEW_ONLY_MESSAGE } from "@/lib/hq/roles";
import { liveUser } from "@/lib/hq/users";

/**
 * Two websites, one deployment:
 *   • public site  → everything except /hq
 *   • FrameMind HQ      → /hq/*  (and hq.<your-domain> if you add that domain in Vercel)
 * Every HQ page and API call requires a valid signed session cookie for an account that still exists.
 * Only editors (founders) may call an HQ API with anything but a read; everyone else can view and print.
 * (Pages and APIs re-check both server-side as well.)
 */
const PUBLIC_HQ_PATHS = ["/hq/login", "/api/hq/auth/login", "/api/hq/auth/logout"];
/** Everyone may change their own password, view-only accounts included. */
const OWN_PASSWORD_API = "/api/hq/account/password";
/** Everyone may register their own leads and answer their own reviews (the route checks the rest). */
const OWN_INCENTIVES_API = "/api/hq/incentives/me";
/** All a login with a one-time password may reach until it chooses its own. */
const FIRST_SIGN_IN_PATHS = ["/hq/account", OWN_PASSWORD_API, "/api/hq/me"];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") || "";

  // hq.<domain> → serve the portal at its root
  if (host.startsWith("hq.") && !pathname.startsWith("/hq") && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && !/\.[a-z0-9]+$/i.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/hq${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const isHq = pathname === "/hq" || pathname.startsWith("/hq/");
  const isHqApi = pathname.startsWith("/api/hq/");
  if (!isHq && !isHqApi) return NextResponse.next();
  if (PUBLIC_HQ_PATHS.some((p) => pathname === p)) return NextResponse.next();

  const user = await liveUser(await verifySession(req.cookies.get(SESSION_COOKIE)?.value));
  if (user) {
    if (user.mustChange && !FIRST_SIGN_IN_PATHS.includes(pathname)) {
      if (isHqApi) return NextResponse.json({ error: "Choose your own password first (My account).", mustChange: true }, { status: 403 });
      const url = req.nextUrl.clone();
      url.pathname = "/hq/account";
      url.search = "?first=1";
      return NextResponse.redirect(url);
    }
    if (isHqApi && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !EDITORS.includes(user.role) && pathname !== OWN_PASSWORD_API && pathname !== OWN_INCENTIVES_API) {
      return NextResponse.json({ error: VIEW_ONLY_MESSAGE, viewOnly: true }, { status: 403 });
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  if (isHqApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/hq/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|brand/|videos/|icon|apple-icon|opengraph-image).*)"],
};

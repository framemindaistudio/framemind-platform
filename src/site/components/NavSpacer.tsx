"use client";

import { usePathname } from "next/navigation";

/**
 * The navbar floats over the page. Pages that open with a graphite hero run underneath it; the few that open
 * straight into content (a store product, an industry app, policies, order pages) get room under it.
 */
const NEEDS_ROOM = [/^\/shop\/(?!$)/, /^\/industries\/.+/, /^\/privacy/, /^\/verify/];

export default function NavSpacer() {
  const path = usePathname() ?? "/";
  if (!NEEDS_ROOM.some((r) => r.test(path))) return null;
  return <div aria-hidden="true" className="h-[76px] sm:h-[84px]" />;
}

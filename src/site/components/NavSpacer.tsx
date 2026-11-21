"use client";

import { usePathname } from "next/navigation";

/**
 * The navbar floats over the page. Every page now opens with a graphite hero that runs underneath it, except an
 * industry app's own page, which opens in its app's colours and needs room under the bar.
 */
const NEEDS_ROOM = [/^\/industries\/(?!terms)[^/]+/, /^\/verify/];

export default function NavSpacer() {
  const path = usePathname() ?? "/";
  if (!NEEDS_ROOM.some((r) => r.test(path))) return null;
  return <div aria-hidden="true" className="h-[76px] sm:h-[84px]" />;
}

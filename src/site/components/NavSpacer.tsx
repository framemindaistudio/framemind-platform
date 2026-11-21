"use client";

import { usePathname } from "next/navigation";

/** The navbar floats over the page; inner pages get room under it, the home hero runs underneath it. */
export default function NavSpacer() {
  const path = usePathname();
  if (path === "/") return null;
  return <div aria-hidden="true" className="h-[76px] sm:h-[84px]" />;
}

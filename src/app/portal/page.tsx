import type { Metadata } from "next";
import { getPortalUser } from "@/lib/portal/auth";
import { PortalApp, PortalFirstPassword, PortalLogin } from "@/components/portal/PortalApp";

export const metadata: Metadata = { title: "Client portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** /portal — the client's own window into their project: sign in, requirements, progress, previews, messages. */
export default async function PortalPage() {
  const user = await getPortalUser();
  if (!user) return <PortalLogin />;
  if (user.mustChange) return <PortalFirstPassword name={user.name} />;
  return <PortalApp />;
}

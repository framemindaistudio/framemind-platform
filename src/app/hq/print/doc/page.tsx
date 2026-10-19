import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { PrintDocs } from "@/components/hq/docs/PrintDocs";

export const metadata: Metadata = { title: "Print document" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) =>
  one(v)
    .split(",")
    .map((s) => s.trim().split("\\").join("/").replace(/^\/+|\/+$/g, ""))
    .filter((s) => (s === "OPERATIONS" || s.startsWith("OPERATIONS/")) && !s.split("/").some((seg) => seg === ".." || seg === "." || seg === ""));

/**
 * /hq/print/doc?path=OPERATIONS/x.md
 *               ?paths=a.md,b.md
 *               ?folder=OPERATIONS/03_SOP   (all .md inside, README first)
 *               ?folders=a,b                (several folders as one pack)
 *   optional: title=…  back=/hq/…
 */
export default async function PrintDocPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser(ALL);
  const sp = await searchParams;
  const back = one(sp.back);
  return (
    <PrintDocs
      paths={[...list(sp.path), ...list(sp.paths)]}
      folders={[...list(sp.folder), ...list(sp.folders)]}
      title={one(sp.title).slice(0, 120) || undefined}
      back={back.startsWith("/hq/") ? back : undefined}
    />
  );
}

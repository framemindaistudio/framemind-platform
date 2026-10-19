"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { useCollection } from "@/components/hq/data";
import { PageHeader } from "@/components/hq/ui";
import { BrandKit } from "./BrandKit";
import { Captions } from "./Captions";
import { Create } from "./create/Create";
import { Founders } from "./Founders";
import { Plan } from "./Plan";

type Tab = "create" | "plan" | "captions" | "founders" | "brand";
const TABS: Tab[] = ["create", "plan", "captions", "founders", "brand"];
const asTab = (v: string | null): Tab => (TABS.includes(v as Tab) ? (v as Tab) : "create");

/** Changes the address without loading anything: the tab survives a reload, and a link to the same design works twice. */
function setAddress(url: string) {
  try {
    window.history.replaceState(null, "", url);
  } catch {
    /* the address is a convenience only */
  }
}

/**
 * Social Studio: FrameMind's own social media in one place. Designs to download, the content plan, captions,
 * the founders' personal-brand plan and the brand kit. Social media run for a client (a retainer) is client work
 * and stays in Projects and Production.
 *
 * The address holds the tab (?tab=), and a link from the plan or the Founders tab adds a design (?d=) and the
 * planned post it belongs to (?post=).
 */
export function SocialStudio() {
  const params = useSearchParams();
  const query = params.toString();

  const [tab, setTab] = useState<Tab>(() => asTab(params.get("tab")));
  // Create and Captions stay alive once opened, so a photo, a size or a half-written caption survives a look at the plan
  const [seen, setSeen] = useState<Tab[]>(() => [asTab(params.get("tab"))]);
  // the design a link asked for, the planned post Create saves to, and a count that starts Create again
  const [link, setLink] = useState(() => ({ d: params.get("d") ?? "", post: params.get("post") ?? "", n: 0 }));

  const [synced, setSynced] = useState(query);
  if (synced !== query) {
    // the address changed: a link inside HQ, or the browser's back and forward
    setSynced(query);
    const next = asTab(params.get("tab"));
    setTab(next);
    setSeen((s) => (s.includes(next) ? s : [...s, next]));
    const d = params.get("d") ?? "";
    const post = params.get("post") ?? "";
    // the same design, still open, is left as the person has it; anything else opens fresh
    if (d || post) setLink((l) => ({ d, post, n: d && d === l.d ? l.n : l.n + 1 }));
  }

  const { records: posts } = useCollection("contentCalendar");
  const open = posts.filter((p) => String(p.status ?? "idea") !== "published").length;

  function go(next: Tab) {
    setTab(next);
    setSeen((s) => (s.includes(next) ? s : [...s, next]));
    setAddress(next === "create" ? "/hq/social" : `/hq/social?tab=${next}`);
  }

  return (
    <div>
      <PageHeader
        icon="Megaphone"
        eyebrow="The studio's own channels"
        title="Social Studio"
        description="Ready-made designs you fill in and download, the content plan for FrameMind and for each founder, captions and the brand kit. Client social work lives in Projects and Production."
      />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={go}
        tabs={[
          { value: "create", label: "Create" },
          { value: "plan", label: "Plan", count: open },
          { value: "captions", label: "Captions" },
          { value: "founders", label: "Founders" },
          { value: "brand", label: "Brand kit" },
        ]}
      />
      {seen.includes("create") && (
        <div hidden={tab !== "create"}>
          <Create
            key={link.n}
            draft={link.d}
            postId={link.post}
            onOpenPlan={() => go("plan")}
            onLeaveDesign={() => {
              // back at the gallery: the same link must open its design again next time
              setLink((l) => ({ ...l, d: "" }));
              setAddress("/hq/social");
            }}
            onUnlinkPost={() => setLink((l) => ({ ...l, post: "" }))}
          />
        </div>
      )}
      {tab === "plan" && <Plan />}
      {seen.includes("captions") && (
        <div hidden={tab !== "captions"}>
          <Captions />
        </div>
      )}
      {tab === "founders" && <Founders onOpenPlan={() => go("plan")} />}
      {tab === "brand" && <BrandKit />}
    </div>
  );
}

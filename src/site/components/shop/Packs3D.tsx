"use client";

import { useState } from "react";
import { ArrowRight, Maximize2, Play } from "lucide-react";
import { Link } from "@/site/router";

/** The PSD Mockups product page: the seven sample brands in 3D (public/packaging-3d), loaded only when asked for. */
export default function Packs3D() {
  const [live, setLive] = useState(false);
  const src = "/packaging-3d/index.html";
  return (
    <section className="relative overflow-hidden bg-[#1b1916] text-[#ede6da]">
      <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#c9a46a]">Included · Brand stories in 3D</p>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.6rem)] font-normal leading-[1.02] tracking-[-0.045em]">Every pack, folded up and turning in 3D.</h2>
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#a99f90]">Seven sample brands, each on its own cinematic set, with every size of every pouch, can, jar and box. The same file ships in the download and works offline.</p>
          </div>
          <a href={src} target="_blank" rel="noopener" className="inline-flex items-center gap-2 self-start rounded-full border border-[#3a342d] px-5 py-3 text-[14px] font-semibold hover:bg-white/5 lg:self-end">
            <Maximize2 className="h-4 w-4" /> Open full screen
          </a>
        </div>
        <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-[22px] border border-[#3a342d] bg-[#11100e] md:aspect-[16/9]">
          {live ? (
            <iframe src={src} title="Sample packaging in 3D" className="absolute inset-0 h-full w-full" allow="fullscreen" />
          ) : (
            <button onClick={() => setLive(true)} className="group absolute inset-0 h-full w-full" aria-label="Load the 3D preview">
              <img src="/packaging/story-mithaas.webp" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0bcc] to-transparent" />
              <span className="absolute bottom-7 left-7 inline-flex items-center gap-2 rounded-full bg-[#c9a46a] px-6 py-3.5 text-[15px] font-semibold text-[#1b1916]"><Play className="h-4 w-4" /> Start the 3D preview</span>
            </button>
          )}
        </div>
        <Link to="/packaging" className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[#e0c08a] hover:underline">
          Want packaging like this for your own brand? See our packaging design service <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

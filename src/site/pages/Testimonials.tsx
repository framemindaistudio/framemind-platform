"use client";

import { ArrowUpRight } from "lucide-react";
import { CtaPanel, PageHero } from "@/site/components/ui/page-bits";
import { Rise } from "@/site/components/ui/motion-bits";
import SEO from "@/site/components/SEO";
const founderPhoto = "/site/testimonial-founder.jpg";
const jagkalyanMissionLogo = "/site/jagkalyan-logo.jpg";
const smartDealFounder = "/site/smartdeal-founder.jpg";

const testimonials: {
  quote: string; name: string; role: string; company: string;
  url: string; initial: string; photo?: string; logo?: string; tag?: string;
}[] = [
  {
    quote: "Our mission spans self, society, nation, and all of humanity — rooted in the Sanskrit ideal of सर्वे भवन्तु सुखिनः. To carry that onto a screen without diluting it required someone who understood that this was not a website project — it was a purpose project. FrameMind built us a digital presence that honours the depth of JagKalyan Holistic Mission, from the Academy's nine shalas to the vision of a 500-acre Wisdom City. It feels like the work we are here to do.",
    name: "JagKalyan Holistic Mission",
    role: "Core Team",
    company: "JagKalyan Trust · One Humanity · One Planet",
    url: "https://www.jagkalyan.com",
    initial: "J",
    logo: jagkalyanMissionLogo,
    tag: "॥ सर्वे भवन्तु सुखिनः ॥",
  },
  {
    quote: "FrameMind built us a website that truly represents our business — clean, professional, and exactly what our clients expect from a trusted timber merchant. We started receiving enquiries through the site almost immediately after it went live.",
    name: "Shivaprasad Reddy S S",
    role: "Proprietor",
    company: "Trinetra Timber Traders, Ilkal, Karnataka",
    url: "https://trinetra-timber-traders.vercel.app",
    initial: "S",
    photo: founderPhoto,
  },
  {
    quote: "We needed a platform that could handle a wide range of deals and listings without feeling cluttered or overwhelming. FrameMind delivered something sharp and easy to navigate — exactly what a deals marketplace needs to convert browsers into buyers.",
    name: "SmartDeal A2Z",
    role: "Founding Team",
    company: "smartdeala2z.com",
    url: "https://smartdeala2z.com",
    initial: "S",
    photo: smartDealFounder,
  },
];

export default function Testimonials() {
  return (
    <div className="bg-[var(--fm-stone)]">
      <SEO
        title="Client Testimonials — Real Results from Real Businesses"
        description="What our clients say about working with FrameMind Studio — real feedback from Indian businesses we've helped build their digital presence, brand, and tools."
        path="/testimonials"
        keywords="FrameMind reviews, design studio testimonials India, client feedback web design, FrameMind AI Studio reviews, web development reviews India"
        ogImageAlt="FrameMind AI Studio — Client Testimonials & Reviews"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Client Testimonials — FrameMind AI Studio",
          "description": "Real feedback from Indian businesses helped by FrameMind AI Studio.",
          "url": "https://www.framemindaistudio.com/testimonials",
          "publisher": { "@type": "Organization", "name": "FrameMind AI Studio" },
        }}
      />
      <PageHero
        kicker="Testimonials"
        lines={["What people", <span key="b" className="text-[#9a9890]">say about us.</span>]}
        lede="Real feedback from the businesses and missions we built for. Each one links to the work itself."
      />

      <section className="rounded-t-[36px] bg-[var(--fm-stone)] md:-mt-10 md:rounded-t-[56px] relative">
        <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Rise key={t.name} delay={i * 0.07}>
                <blockquote className={`flex h-full flex-col justify-between rounded-[28px] p-7 sm:p-9 ${i === 0 ? "bg-[#171716] text-[#eceae4]" : "bg-[#f3f2ee]"}`}>
                  <div>
                    <span className={`block text-[4rem] leading-[0.6] ${i === 0 ? "text-[var(--fm-lime)]" : "text-[#1b1b19]/25"}`}>&ldquo;</span>
                    {t.tag && <p className="mt-4 inline-block rounded-full bg-[var(--fm-lime)] px-3 py-1 text-[12px] text-[#171716]">{t.tag}</p>}
                    <p className={`mt-5 text-[16px] leading-relaxed ${i === 0 ? "text-[#d6d4cd]" : "text-[#3f3e3a]"}`}>{t.quote}</p>
                  </div>
                  <footer className={`mt-10 flex items-center gap-4 border-t pt-6 ${i === 0 ? "border-white/10" : "border-[#1b1b19]/10"}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--fm-lime)]">
                      {t.logo ? (
                        <img src={t.logo} alt={t.name} className="h-full w-full bg-[#f3f2ee] object-contain" />
                      ) : t.photo ? (
                        <img src={t.photo} alt={t.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-mono text-sm font-bold text-[#171716]">{t.initial}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium leading-tight">{t.name}</p>
                      <p className={`mt-1 text-[13px] leading-snug ${i === 0 ? "text-[#9a9890]" : "text-[#64635d]"}`}>
                        {t.role} · {t.company}
                      </p>
                    </div>
                    <a href={t.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${t.name}`} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${i === 0 ? "border-white/15 hover:bg-white/10" : "border-[#1b1b19]/15 hover:bg-[#1b1b19] hover:text-[#eceae4]"}`}>
                      <ArrowUpRight size={16} />
                    </a>
                  </footer>
                </blockquote>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      <CtaPanel lines={["Ready to be", "next?"]} lede="Tell us what you're building." />
    </div>
  );
}

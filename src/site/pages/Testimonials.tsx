"use client";

import { Link } from "@/site/router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
    <div>
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
      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 block">
          Testimonials
        </span>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5 max-w-2xl">
          What people say.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
          From founders who shipped with us to students who competed on what we built.
        </p>
      </section>

      {/* Testimonials grid — all equal size */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="bg-background p-6 sm:p-8 flex flex-col justify-between min-h-[340px]">
                <div>
                  {t.tag && (
                    <p className="font-mono text-[10px] text-[#C8F135] bg-[#0D0D0D] inline-block px-2.5 py-1 rounded-sm uppercase tracking-widest mb-4">{t.tag}</p>
                  )}
                  <p className="text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>
                </div>
                <footer className="flex items-start gap-3 border-t border-border pt-5 mt-8">
                  <div className="w-9 h-9 rounded-sm overflow-hidden shrink-0 bg-[#C8F135] flex items-center justify-center">
                    {t.logo
                      ? <img src={t.logo} alt={t.name} className="w-full h-full object-contain bg-white" />
                      : t.photo
                        ? <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                        : <span className="font-mono text-sm font-bold text-[#0D0D0D]">{t.initial}</span>
                    }
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {t.role} · {t.company}
                    </p>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground mt-1.5 hover:underline transition-colors"
                    >
                      Visit site <ArrowUpRight size={10} />
                    </a>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border bg-secondary">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-1">Ready to be next?</h2>
            <p className="text-sm text-muted-foreground">Tell us what you're building.</p>
          </div>
          <Link
            to="/connect"
            className="bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-semibold rounded-sm hover:bg-[#b8e020] transition-colors flex items-center gap-2"
          >
            Connect with us <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}

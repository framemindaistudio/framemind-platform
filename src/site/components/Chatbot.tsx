"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, MessageCircle, ArrowUpRight, RotateCcw, Send } from "lucide-react";
import { useNavigate } from "@/site/router";

type Message = { from: "bot" | "user"; text: string };
type Option = { label: string; next?: string; to?: string };
type FlowNode = { reply: string; options: Option[] };

// ─── Conversation tree ─────────────────────────────────────────────────────

const flows: Record<string, FlowNode> = {
  start: {
    reply: "Hi! I'm the FrameMind assistant. What can I help you with today?",
    options: [
      { label: "Services you offer", next: "services" },
      { label: "Pricing & quotes", next: "pricing" },
      { label: "Vritta — software for institutions", next: "vritta" },
      { label: "JOVE — school robotics workshops", next: "jove" },
      { label: "360VUE — 360° virtual tours", next: "vue360" },
      { label: "AI Coaching", next: "coaching" },
      { label: "See our work", next: "work" },
      { label: "Get started with a project", next: "getstarted" },
    ],
  },
  services: {
    reply: "We work across seven disciplines — all in-house, no hand-offs.",
    options: [
      { label: "Websites & custom software", next: "websites" },
      { label: "Brand identity & design", next: "brand" },
      { label: "Photography & videography", next: "photo_video" },
      { label: "Social media & AI automation", next: "social_ai" },
      { label: "View pricing", to: "/pricing" },
      { label: "← Back", next: "start" },
    ],
  },
  websites: {
    reply: "We design and build websites, web apps, dashboards, and custom software — responsive, fast, and production-ready. Fixed scope, fixed price.",
    options: [
      { label: "Get a quote", to: "/pricing" },
      { label: "See examples", to: "/testimonials" },
      { label: "Talk to us", to: "/connect" },
      { label: "← Back", next: "services" },
    ],
  },
  brand: {
    reply: "Brand identity covers logo, typography, colour system, and brand guidelines — everything that makes you look the part from first glance.",
    options: [
      { label: "Get a quote", to: "/pricing" },
      { label: "See brand work", to: "/testimonials" },
      { label: "Talk to us", to: "/connect" },
      { label: "← Back", next: "services" },
    ],
  },
  photo_video: {
    reply: "Product photography, event coverage, brand films, reels, and short-form video — all shot and edited in-house.",
    options: [
      { label: "Get a quote", to: "/pricing" },
      { label: "Talk to us", to: "/connect" },
      { label: "← Back", next: "services" },
    ],
  },
  social_ai: {
    reply: "We manage Instagram, LinkedIn, and Facebook content — and build AI automations: lead capture, WhatsApp bots, workflow tools, and dashboards.",
    options: [
      { label: "Get a quote", to: "/pricing" },
      { label: "Talk to us", to: "/connect" },
      { label: "← Back", next: "services" },
    ],
  },
  pricing: {
    reply: "Pricing is built on a module system — pick exactly what you need and get an instant quote. No vague retainers, no surprise invoices.",
    options: [
      { label: "Open pricing configurator", to: "/pricing" },
      { label: "Talk to us instead", to: "/connect" },
      { label: "← Back", next: "start" },
    ],
  },
  vritta: {
    reply: "Vritta is our software for schools and colleges — a departmental activity record that produces the institution's newsletter as a by-product. Currently live at an engineering college in Karnataka.",
    options: [
      { label: "Pricing for schools", next: "vritta_schools" },
      { label: "Pricing for colleges", next: "vritta_colleges" },
      { label: "See the full rate card", to: "/vritta" },
      { label: "Book a call about Vritta", to: "/connect" },
      { label: "← Back", next: "start" },
    ],
  },
  vritta_schools: {
    reply: "School editions: Essential ₹65,000/yr · Professional ₹1,15,000/yr. Perpetual licences available at 4× the annual fee. Implementation from ₹35,000 one-time.",
    options: [
      { label: "See full rate card", to: "/vritta" },
      { label: "Book a call", to: "/connect" },
      { label: "← Back", next: "vritta" },
    ],
  },
  vritta_colleges: {
    reply: "College editions: Essential ₹1,25,000/yr · Professional ₹1,95,000/yr · Institutional ₹3,45,000/yr. Perpetual licences available. Implementation from ₹75,000.",
    options: [
      { label: "See full rate card", to: "/vritta" },
      { label: "Book a call", to: "/connect" },
      { label: "← Back", next: "vritta" },
    ],
  },
  vue360: {
    reply: "360VUE is a FrameMind AI Studio company. It makes 360° virtual tours, SkyVUE drone 360° aerial views and Google Maps listings for restaurants, hotels, showrooms, hospitals, colleges and real estate across South India. Prices are on 360vue.website's calculator.",
    options: [
      { label: "About 360VUE", to: "/360vue" },
      { label: "Talk to us", to: "/connect" },
      { label: "← Back", next: "start" },
    ],
  },
  jove: {
    reply: "JOVE (Journey of Visionation & Excellence) brings full-day robotics, AI & ML workshops to school campuses across India — Grades 1–10. Co-founded by the FrameMind team. Every event includes professional filming by FrameMind at no extra cost.",
    options: [
      { label: "See all programs", to: "/jove" },
      { label: "Book a workshop", to: "/connect" },
      { label: "Visit jove.website", to: "/jove" },
      { label: "← Back", next: "start" },
    ],
  },
  coaching: {
    reply: "1-on-1 AI coaching for ages 10–60, online or in-person across India. 90 days, structured sessions, real skills — no prior tech knowledge needed.",
    options: [
      { label: "Learn more", to: "/personal-coaching" },
      { label: "Book a session", to: "/connect" },
      { label: "← Back", next: "start" },
    ],
  },
  shop: {
    reply: "The shop carries digital products — website templates, Notion systems, and automation blueprints. More added regularly.",
    options: [
      { label: "Browse the shop", to: "/shop" },
      { label: "← Back", next: "start" },
    ],
  },
  work: {
    reply: "We've built for JagKalyan Holistic Mission, SmartDeal A2Z, Trinetra Timber Traders, and more.",
    options: [
      { label: "View projects", to: "/testimonials" },
      { label: "Read testimonials", to: "/testimonials" },
      { label: "Talk to us", to: "/connect" },
      { label: "← Back", next: "start" },
    ],
  },
  team: {
    reply: "FrameMind is led by Chinmay R M, with a core team covering design, development, business development, and social media — all based in Karnataka.",
    options: [
      { label: "Meet the team", to: "/team" },
      { label: "Talk to us", to: "/connect" },
      { label: "← Back", next: "start" },
    ],
  },
  getstarted: {
    reply: "The quickest path: fill out the Connect form and we'll get back within 24 hours. Or build a quote first — takes about 3 minutes.",
    options: [
      { label: "Go to Connect", to: "/connect" },
      { label: "Build a quote first", to: "/pricing" },
      { label: "← Back", next: "start" },
    ],
  },
  fallback: {
    reply: "I'm not sure about that — here are some things I can help with:",
    options: [],
  },
};
flows.fallback.options = flows.start.options;

// ─── Keyword → flow node ───────────────────────────────────────────────────

const KEYWORD_MAP: [RegExp, string][] = [
  [/\b(website|web\s*site|web\s*app|develop|software|app|code|platform|portal|dashboard)\b/i, "websites"],
  [/\b(brand|logo|identity|branding|graphic|visual|design)\b/i, "brand"],
  [/\b(photo|photograph|camera|shoot|shoot|product\s*photo)\b/i, "photo_video"],
  [/\b(video|reel|film|motion|cinemat)\b/i, "photo_video"],
  [/\b(social|instagram|facebook|linkedin|media|post|content\s*creat)\b/i, "social_ai"],
  [/\b(automat|ai\s*tool|workflow|whatsapp\s*bot|chatbot|integrate)\b/i, "social_ai"],
  [/\b(price|cost|quote|rate|budget|how\s*much|pricing|fee|charge|rupee|inr)\b/i, "pricing"],
  [/(\b360\b|360vue|virtual\s*tour|skyvue|google\s*maps|walk-?through|digital\s*twin)/i, "vue360"],
  [/\b(jove|robotics|robot|stem|machine\s*learning|ml\s*workshop|ai\s*workshop|school\s*workshop|grade|inventor|innovator)\b/i, "jove"],
  [/\b(vritta|newsletter|college|institution|iqac|naac|nba|accredit|department|campus)\b/i, "vritta"],
  [/\b(coach|coaching|learn\s*ai|artificial\s*intelligence|training|tutor|ai\s*course|ai\s*skill)\b/i, "coaching"],
  [/\b(shop|template|buy|purchase|digital\s*product|notion|download)\b/i, "shop"],
  [/\b(project|portfolio|work|example|built|past\s*work|previous|case\s*stud)\b/i, "work"],
  [/\b(testimonial|review|client|feedback|what\s*people\s*say)\b/i, "work"],
  [/\b(team|who\s*(are|is)|founder|chinmay|about\s*us|people|staff)\b/i, "team"],
  [/\b(service|offer|capabilit|what\s*do\s*you\s*do|what\s*you\s*do)\b/i, "services"],
  [/\b(start|begin|contact|get\s*start|how\s*to\s*start|next\s*step)\b/i, "getstarted"],
  [/\b(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)\b/i, "start"],
];

function matchKeyword(text: string): string | null {
  for (const [pattern, node] of KEYWORD_MAP) {
    if (pattern.test(text)) return node;
  }
  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  { from: "bot", text: flows.start.reply },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [options, setOptions] = useState<Option[]>(flows.start.options);
  const [unread, setUnread] = useState(true);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  function deliverBotReply(nodeKey: string) {
    const node = flows[nodeKey] ?? flows.fallback;
    setTyping(true);
    setOptions([]);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text: node.reply }]);
      setOptions(node.options);
    }, 750);
  }

  function handleOption(opt: Option) {
    const label = opt.label.replace(/^←\s*/, "");
    setMessages((m) => [...m, { from: "user", text: label }]);

    if (opt.to) {
      setOptions([]);
      setTimeout(() => {
        navigate(opt.to!);
        setOpen(false);
        reset();
      }, 300);
      return;
    }

    deliverBotReply(opt.next ?? "start");
  }

  function handleSend() {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text }]);
    const matched = matchKeyword(text);
    deliverBotReply(matched ?? "fallback");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  function reset() {
    setMessages(INITIAL_MESSAGES);
    setOptions(flows.start.options);
    setTyping(false);
    setInput("");
  }

  function handleOpen() {
    setOpen(true);
    setUnread(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

      {/* ── Chat window ── */}
      {open && (
        <div
          className="w-[340px] bg-[#111] border border-[#1e1e1e] rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
          style={{ maxHeight: "min(580px, calc(100svh - 90px))" }}
        >

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0D0D0D] border-b border-[#1e1e1e] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C8F135] flex items-center justify-center shrink-0">
                <span className="text-[#0D0D0D] text-[9px] font-black tracking-tight">FM</span>
              </div>
              <div>
                <p className="text-[#F5F4F0] text-xs font-semibold leading-tight">FrameMind Assistant</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] text-[#555]">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={reset}
                title="Restart conversation"
                className="p-2 text-[#444] hover:text-[#888] transition-colors rounded-lg"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-[#444] hover:text-[#F5F4F0] transition-colors rounded-lg"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-3 px-4 py-4 overflow-y-auto flex-1 scrollbar-none" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.from === "bot" && (
                  <div className="w-5 h-5 rounded-full bg-[#C8F135] flex items-center justify-center shrink-0 mb-0.5">
                    <span className="text-[#0D0D0D] text-[7px] font-black">FM</span>
                  </div>
                )}
                <div
                  className={`text-xs leading-relaxed px-3 py-2.5 max-w-[78%] ${
                    msg.from === "bot"
                      ? "bg-[#1a1a1a] text-[#ccc] rounded-2xl rounded-bl-sm"
                      : "bg-[#C8F135] text-[#0D0D0D] font-medium rounded-2xl rounded-br-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex items-end gap-2">
                <div className="w-5 h-5 rounded-full bg-[#C8F135] flex items-center justify-center shrink-0">
                  <span className="text-[#0D0D0D] text-[7px] font-black">FM</span>
                </div>
                <div className="bg-[#1a1a1a] px-3.5 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "160ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "320ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick reply options */}
          {options.length > 0 && !typing && (
            <div className="px-4 pb-3 flex flex-col gap-1.5 shrink-0">
              {options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleOption(opt)}
                  className="text-left text-xs px-3 py-2 rounded-xl border border-[#242424] text-[#bbb] hover:border-[#C8F135]/50 hover:text-[#C8F135] hover:bg-[#C8F135]/5 transition-all flex items-center justify-between gap-2 group"
                >
                  <span>{opt.label}</span>
                  {opt.to && (
                    <ArrowUpRight
                      size={11}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[#C8F135]"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Text input */}
          <div className="px-4 pt-2 pb-4 border-t border-[#1e1e1e] shrink-0">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 focus-within:border-[#3a3a3a] transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="flex-1 bg-transparent text-xs text-[#ccc] placeholder-[#3a3a3a] outline-none min-w-0"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || typing}
                className="text-[#444] hover:text-[#C8F135] disabled:opacity-25 transition-colors shrink-0 disabled:cursor-not-allowed"
              >
                <Send size={13} />
              </button>
            </div>
            <p className="text-[9px] text-[#2e2e2e] text-center mt-2.5">
              Or email{" "}
              <a
                href="mailto:framemindaistudio@gmail.com"
                className="text-[#3e3e3e] hover:text-[#C8F135] transition-colors"
              >
                framemindaistudio@gmail.com
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ── Toggle button ── */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="relative w-12 h-12 rounded-full bg-[#C8F135] text-[#0D0D0D] flex items-center justify-center shadow-lg hover:bg-[#b8e020] transition-colors"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        {!open && unread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
}

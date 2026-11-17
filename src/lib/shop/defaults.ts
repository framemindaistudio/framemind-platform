import type { ShopCatalog } from "./types";

/**
 * The store's starting catalogue, used until a catalogue is saved in HQ → Digital Store (data/shop/catalog.json).
 * Every product starts as "soon": it goes live in HQ once its files are uploaded. Prices are the launch prices
 * approved with the plan on 17 Nov 2026; HQ can change them.
 */
export const DEFAULT_CATALOG: ShopCatalog = {
  categories: [
    { id: "ai", name: "AI & Vibe Coding", blurb: "Build apps and websites with AI, from zero.", icon: "Sparkles" },
    { id: "camera", name: "Camera & Shooting", blurb: "Shoot better photos and video on any camera or phone.", icon: "Camera" },
    { id: "presets", name: "Presets & LUTs", blurb: "One-tap colour grades for Lightroom and video.", icon: "SlidersHorizontal" },
    { id: "templates", name: "Design Templates", blurb: "Carousels, posts and mockups, ready to edit.", icon: "LayoutTemplate" },
    { id: "colour", name: "Colour & Brand Kits", blurb: "Palettes and type pairings that look expensive.", icon: "Palette" },
    { id: "business", name: "Creator Business", blurb: "Quotes, invoices and contracts for freelancers.", icon: "Briefcase" },
    { id: "bundles", name: "Bundles", blurb: "More products, one lower price.", icon: "Package" },
  ],
  products: [
    {
      id: "claude-code-beginners",
      slug: "claude-code-for-beginners",
      title: "Claude Code for Beginners",
      tagline: "Install it, talk to it, ship your first project. No coding background needed.",
      category: "ai",
      price: 149,
      mrp: 299,
      status: "soon",
      description:
        "A plain-English guide to Claude Code, the AI coding assistant that works in your terminal. Written for designers, students and founders who have never set up a developer tool before.\n\nYou go from installing it on Windows or Mac to building and publishing a small website, with the exact prompts we use at the studio and the mistakes to avoid.",
      includes: ["Step-by-step setup for Windows, Mac and Linux", "How to write prompts that get working code", "Build and publish a one-page website", "30 copy-paste prompts", "Common errors and how to fix them", "Guide as PDF + web version with an animated demo"],
      formats: ["PDF"],
      level: "Beginners",
      accent: "#D97757",
      files: [],
      featured: true,
      note: "An independent guide by FrameMind AI Studio. Not affiliated with or endorsed by Anthropic. Claude is a trademark of Anthropic.",
      tags: ["claude", "ai coding", "beginners"],
    },
    {
      id: "vibe-coding-101",
      slug: "vibe-coding-101",
      title: "Vibe Coding 101",
      tagline: "Turn an idea into a working app by describing it to AI.",
      category: "ai",
      price: 149,
      mrp: 299,
      status: "soon",
      description:
        "Vibe coding means building software by describing what you want and letting AI write the code. This guide shows how to do it properly: planning the idea, picking the right tool, prompting in small steps and checking what the AI built.\n\nIt ends with three small projects you can finish in an evening each.",
      includes: ["What vibe coding is, and where it breaks", "Choosing a tool for your project", "The plan → build → check loop", "3 evening projects with step-by-step prompts", "A safety checklist before you share your app", "Guide as PDF + web version with a prompt builder"],
      formats: ["PDF"],
      level: "Beginners",
      accent: "#9B7BFF",
      files: [],
      featured: true,
      tags: ["vibe coding", "ai", "no-code"],
    },
    {
      id: "ai-prompts-creators",
      slug: "100-ai-prompts-for-creators",
      title: "100 AI Prompts for Creators",
      tagline: "Captions, hooks, scripts and ideas. Copy, paste, post.",
      category: "ai",
      price: 99,
      mrp: 199,
      status: "soon",
      description:
        "One hundred tested prompts for Instagram and YouTube creators, grouped by job: finding ideas, writing hooks, scripting Reels, writing captions, repurposing content and replying to comments.\n\nWorks with ChatGPT, Claude, Gemini or any AI chat.",
      includes: ["100 prompts in 6 groups", "Fill-in-the-blank: type your niche once and every prompt updates (web version)", "Weak vs strong output examples", "A weekly content system", "Notion import file (CSV), Markdown and PDF"],
      formats: ["PDF", "Notion"],
      level: "All levels",
      accent: "#3DF5C8",
      files: [],
      tags: ["prompts", "instagram", "content"],
    },
    {
      id: "camera-basics",
      slug: "camera-basics-cheat-sheet",
      title: "Camera Basics Cheat Sheet",
      tagline: "ISO, shutter and aperture finally make sense.",
      category: "camera",
      price: 99,
      mrp: 199,
      status: "soon",
      description:
        "The exposure triangle explained with pictures instead of jargon, plus the settings to start from in the situations you actually shoot: portraits, products, events, low light and video.\n\nPrint it or keep it on your phone in the camera bag.",
      includes: ["The exposure triangle, illustrated", "Live exposure simulator (web version)", "Starting settings for 10 common situations", "Focus, modes and light", "Video settings for India (25 fps, 50 Hz)", "Printable PDF + phone-friendly web version"],
      formats: ["PDF"],
      level: "Beginners",
      accent: "#E2572B",
      files: [],
      featured: true,
      tags: ["photography", "camera", "beginners"],
    },
    {
      id: "phone-cinematography",
      slug: "phone-cinematography-shot-list",
      title: "Phone Cinematography Shot List",
      tagline: "40 shots that make phone videos look like films.",
      category: "camera",
      price: 99,
      mrp: 199,
      status: "soon",
      description:
        "A shot list for Reels and short films shot on a phone: what each shot is, how to move, and where it fits in an edit. Each one has a diagram and a one-line tip.\n\nIncludes ready-made sequences for a product reel, a café reel and a travel reel.",
      includes: ["40 shots with diagrams", "Phone settings for India (25 fps, 50 Hz)", "3 ready Reel sequences with timings", "Interactive Reel builder (web version)", "A printable blank shot-list sheet"],
      formats: ["PDF"],
      level: "All levels",
      accent: "#D7263D",
      files: [],
      tags: ["reels", "video", "phone"],
    },
    {
      id: "lightroom-presets",
      slug: "lightroom-preset-pack",
      title: "Lightroom Preset Pack",
      tagline: "12 looks for portraits, travel and food. Mobile and desktop.",
      category: "presets",
      price: 199,
      mrp: 499,
      status: "soon",
      description:
        "Twelve presets graded for Indian skin tones and light: warm golden-hour looks, clean moody looks and bright food looks.\n\nWorks in Lightroom mobile (including the free app), Lightroom desktop, Lightroom Classic and Photoshop Camera Raw. Every photo is different, so treat a preset as a starting point and adjust exposure and white balance to taste.",
      includes: ["12 presets for Lightroom mobile, desktop, Classic and Camera Raw (.xmp)", "Install guide for phone and computer", "Tone-curve and colour-grade breakdown of every preset", "Guide as PDF + interactive web version"],
      formats: ["XMP", "PDF"],
      level: "All levels",
      accent: "#F2A65A",
      files: [],
      featured: true,
      tags: ["lightroom", "presets", "photo editing"],
    },
    {
      id: "cinematic-luts",
      slug: "cinematic-luts",
      title: "Cinematic LUT Pack",
      tagline: "10 film looks for Premiere, DaVinci, CapCut and Final Cut.",
      category: "presets",
      price: 249,
      mrp: 599,
      status: "soon",
      description:
        "Ten colour grades as .cube LUTs: teal-orange, soft film, moody green, warm vintage and more. Drop one on a clip, then lower its strength until it sits right.\n\nWorks in any editor that loads .cube files.",
      includes: ["10 LUTs (.cube, 33-point)", "How to apply them in Premiere, Resolve, Final Cut and CapCut", "Before-and-after frames for every look", "Log footage workflow", "Guide as PDF + interactive web version with a before/after slider"],
      formats: ["CUBE"],
      level: "All levels",
      accent: "#12A4A6",
      files: [],
      tags: ["luts", "colour grading", "video"],
    },
    {
      id: "carousel-templates",
      slug: "instagram-carousel-templates",
      title: "Instagram Carousel Templates",
      tagline: "20 editable carousel layouts that make people swipe.",
      category: "templates",
      price: 149,
      mrp: 399,
      status: "soon",
      description:
        "Twenty carousel slides in four ready styles (tips, before-and-after, top-5 list and story), sized 1080×1350. Every slide is a layered PSD you can edit in Photoshop or free in Photopea.\n\nText stays editable, colours change with a double-click, and photo spots are smart objects: paste your photo and it drops into place.",
      includes: ["20 layered PSD slides in 4 styles", "Editable text, recolourable shapes, smart-object photo spots", "PNG previews of every slide", "Step-by-step guide (PDF + web with a swipe preview)"],
      formats: ["PSD", "PDF"],
      level: "All levels",
      accent: "#FF5FA2",
      files: [],
      tags: ["instagram", "carousel", "canva", "psd"],
    },
    {
      id: "psd-mockups",
      slug: "psd-mockup-pack",
      title: "PSD Mockup Pack",
      tagline: "Show your designs on phones, posters and cards.",
      category: "templates",
      price: 199,
      mrp: 499,
      status: "soon",
      description:
        "Six clean, modern mockup scenes with smart objects: put your design in, save, and it appears on the phone, poster, card or laptop at the right size and angle.\n\nUse them for portfolios, client presentations and product posts. No Photoshop? The guide's web version has a Mockup Studio that puts your design into every scene right in your browser.",
      includes: ["6 PSD scenes at 3000×2250: phones, framed poster, business cards, Instagram post, laptop", "Full-resolution smart objects", "Background colours you can change", "Browser Mockup Studio (no Photoshop needed)", "Step-by-step guide (PDF + web)"],
      formats: ["PSD"],
      level: "All levels",
      accent: "#4D7CFE",
      files: [],
      tags: ["mockups", "psd", "photoshop"],
    },
    {
      id: "colour-palettes",
      slug: "trending-colour-palettes",
      title: "50 Trending Colour Palettes",
      tagline: "Hand-built palettes with tested contrast, print CMYK and every file you need.",
      category: "colour",
      price: 49,
      mrp: 149,
      status: "soon",
      description:
        "Fifty five-colour palettes, each with a fixed job for every colour (text, primary, secondary, surface and background) and measured contrast, so they work the moment you use them. Grouped by mood: earthy, bold, pastel, luxury, tech (with dark-mode sets) and festive Indian.\n\nEvery palette has its own page in a 62-page book with HEX, RGB, HSL and print CMYK (FOGRA39), six contrast scores, a nine-step interface scale and examples on a business card, an Instagram post and a website. Import straight into Photoshop, Illustrator, InDesign, Procreate, GIMP, Figma or your code.",
      includes: ["50 palettes with fixed colour roles and measured contrast", "62-page book (PDF): values, contrast scores, UI scale and 3 brand examples per palette", "Interactive version: copy any value, try a palette on your own brand name", "Adobe .ase (all, per mood, per palette) and Photoshop .aco", "50 Procreate .swatches and GIMP/Krita .gpl files", "CSS, Tailwind v4, Figma design tokens, JSON and CSV", "50 palette cards at 1080×1350"],
      formats: ["PDF", "ASE", "ACO", "SWATCHES", "CSS"],
      level: "All levels",
      accent: "#C4532D",
      files: [],
      featured: true,
      tags: ["colour palette", "branding", "design"],
      compare: {
        "columns": [
          "FrameMind, ₹49",
          "Premium packs we checked, $10–30",
          "Etsy Procreate packs, $2–13",
          "Free palette generators"
        ],
        "rows": [
          {
            "label": "Palettes",
            "values": [
              "50 hand-built, 5 colours each",
              "50 per volume, 4–6 colours",
              "Hundreds to thousands of swatches",
              "Unlimited, generated"
            ]
          },
          {
            "label": "A fixed job for every colour",
            "values": [
              "Yes",
              "In some",
              "No",
              "No"
            ]
          },
          {
            "label": "Contrast measured and printed",
            "values": [
              "Yes, 6 pairs per palette",
              "Mentioned, no scores",
              "No",
              "Checker for pairs you pick"
            ]
          },
          {
            "label": "Print CMYK values",
            "values": [
              "Yes, FOGRA39",
              "In some",
              "No",
              "Basic conversion"
            ]
          },
          {
            "label": "Photoshop, Illustrator, InDesign",
            "values": [
              "Yes",
              "Yes",
              "In some",
              "Export available"
            ]
          },
          {
            "label": "Procreate",
            "values": [
              "Yes",
              "No",
              "Yes",
              "Varies"
            ]
          },
          {
            "label": "Figma and code",
            "values": [
              "Tokens, CSS, Tailwind",
              "Figma file and CSS",
              "No",
              "CSS export"
            ]
          },
          {
            "label": "Shown on real designs",
            "values": [
              "Card, post and website for all 50",
              "UI examples in some",
              "Few",
              "Template previews"
            ]
          },
          {
            "label": "Indian and festive palettes",
            "values": [
              "Yes",
              "Rarely",
              "Rarely",
              "No"
            ]
          }
        ],
        "note": "Based on palette packs listed on Gumroad and Etsy and on free online palette tools, checked by FrameMind in November 2026. Other products change, so check any listing before you buy."
      },
    },
    {
      id: "font-pairings",
      coverStyle: "specimen",
      slug: "font-pairing-guide",
      title: "Font Pairing Guide",
      tagline: "30 free Google Font pairs that always look right.",
      category: "colour",
      price: 99,
      mrp: 199,
      status: "soon",
      description:
        "Thirty heading-and-body font pairs, all free on Google Fonts, shown on a real poster, a website and an Instagram post so you can see them in use.\n\nIncludes Devanagari and Kannada-friendly pairs for Indian brands.",
      includes: ["30 free Google Font pairs, each shown on a poster, website and Instagram post", "Sizes and spacing that work", "5 Hindi and Kannada pairs", "Copy-paste CSS for every pair", "Live font playground (web version)"],
      formats: ["PDF"],
      level: "All levels",
      accent: "#4A1D3F",
      files: [],
      tags: ["fonts", "typography", "branding"],
    },
    {
      id: "freelancer-kit",
      slug: "freelancer-business-kit",
      title: "Freelancer Business Kit",
      tagline: "Quotation, invoice, rate card and contract templates.",
      category: "business",
      price: 199,
      mrp: 499,
      status: "soon",
      description:
        "The paperwork every Indian freelancer and creator needs, as editable Word, Excel and Google templates: a quotation, an invoice that totals itself, a rate card and a simple project agreement.\n\nThe agreement is a starting point, not legal advice; have it read by a lawyer for large projects.",
      includes: ["Quotation template (Word)", "Invoice with automatic totals and GST split (Excel)", "Rate card + rate calculator (Excel)", "Project agreement template (Word)", "10 payment reminder messages", "Guide as PDF + web version with a live rate calculator"],
      formats: ["DOCX", "XLSX", "Google"],
      level: "Freelancers",
      accent: "#1F8A5B",
      files: [],
      tags: ["freelance", "invoice", "contract"],
    },
    {
      id: "creator-starter-bundle",
      slug: "creator-starter-bundle",
      title: "Creator Starter Bundle",
      tagline: "Camera basics, presets, carousels, palettes and prompts.",
      category: "bundles",
      price: 499,
      mrp: 595,
      status: "soon",
      description: "Five of our best-sellers for new creators, together for less than buying them one by one.",
      includes: ["Camera Basics Cheat Sheet", "Lightroom Preset Pack", "Instagram Carousel Templates", "50 Trending Colour Palettes", "100 AI Prompts for Creators"],
      formats: ["PDF", "XMP", "PSD", "ASE"],
      level: "All levels",
      accent: "#C8F135",
      files: [],
      bundleOf: ["camera-basics", "lightroom-presets", "carousel-templates", "colour-palettes", "ai-prompts-creators"],
      featured: true,
      tags: ["bundle"],
    },
    {
      id: "ai-builder-bundle",
      slug: "ai-builder-bundle",
      title: "AI Builder Bundle",
      tagline: "Claude Code, vibe coding and 100 prompts together.",
      category: "bundles",
      price: 299,
      mrp: 397,
      status: "soon",
      description: "Everything in our AI & Vibe Coding shelf, together for less.",
      includes: ["Claude Code for Beginners", "Vibe Coding 101", "100 AI Prompts for Creators"],
      formats: ["PDF", "Notion"],
      level: "Beginners",
      accent: "#9B7BFF",
      files: [],
      bundleOf: ["claude-code-beginners", "vibe-coding-101", "ai-prompts-creators"],
      tags: ["bundle", "ai"],
    },
  ],
  coupons: [],
};

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
      tagline: "Install it, stay in control, and build five real projects. No coding background needed.",
      category: "ai",
      price: 149,
      mrp: 299,
      status: "soon",
      description:
        "A plain-English guide to Claude Code for designers, students, shop owners and founders. Start with the desktop app (no commands to type) or the terminal on Windows or Mac, learn the three keys that keep you in control, and how to ask so you get what you meant.\n\nThen build five real projects, each with a starter folder, step-by-step prompts, checks after every step and a finished version to compare with: a portfolio you publish free, a café menu that takes orders on WhatsApp, a trip splitter with UPI links, a photo organiser that never deletes anything, and a sales report from a messy spreadsheet. Includes an offline Coach for your phone, a one-page cheat sheet and a beginner-safe CLAUDE.md. Checked against Anthropic's documentation in November 2026.",
      includes: ["31-page illustrated guide: setup, control, asking, CLAUDE.md, limits, fixes", "5 projects with starter files, prompts, checks and a finished version", "Desktop app and terminal setup for Windows and Mac", "Coach: project checklists, prompt builder, error finder (offline)", "One-page cheat sheet and a phone wallpaper", "Beginner-safe CLAUDE.md template"],
      formats: ["PDF", "HTML", "Project files"],
      level: "Beginners",
      accent: "#D97757",
      files: [],
      featured: true,
      note: "An independent guide by FrameMind AI Studio. Not affiliated with or endorsed by Anthropic. Claude is a trademark of Anthropic.",
      compare: {
        "columns": [
          "FrameMind, ₹149",
          "Free official courses",
          "Video courses",
          "Ebooks"
        ],
        "rows": [
          {
            "label": "Written for people who don't code",
            "values": [
              "Yes",
              "Mostly for developers",
              "Some",
              "Some"
            ]
          },
          {
            "label": "Windows and desktop app setup",
            "values": [
              "Step by step",
              "Covered",
              "Varies",
              "Often terminal only"
            ]
          },
          {
            "label": "Projects with starter files",
            "values": [
              "5, with finished versions",
              "Exercises",
              "Follow-along",
              "Rarely"
            ]
          },
          {
            "label": "Checks after every step",
            "values": [
              "Yes",
              "Quizzes",
              "No",
              "No"
            ]
          },
          {
            "label": "Indian examples (WhatsApp, UPI, ₹)",
            "values": [
              "Yes",
              "No",
              "Rarely",
              "Rarely"
            ]
          },
          {
            "label": "Works offline on your phone",
            "values": [
              "Coach and cheat card",
              "No",
              "App download",
              "PDF"
            ]
          },
          {
            "label": "Price",
            "values": [
              "₹149, keep forever",
              "Free",
              "Varies with sales",
              "About $8 to $15"
            ]
          }
        ],
        "note": "Checked in November 2026: Anthropic's free courses, Udemy listings, and ebooks on Gumroad and online bookstores. Their prices and contents change. We recommend the free official courses as a next step."
      },
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
      tagline: "Prompts that know your niche, your city and your voice.",
      category: "ai",
      price: 99,
      mrp: 199,
      status: "soon",
      description:
        "Most prompt packs hand you a list, and the answers come back generic because the AI knows nothing about you. This one starts with a 10-question brief: your niche, audience, city, second language, offer and voice. Fill it once and every prompt is about you.\n\n100 prompts for ideas, hooks, Reel and Shorts scripts, captions, repurposing, comments, DMs and sales. Each one shows what a good answer looks like and the follow-up question to ask next. Made for India: mixed-language hooks, festival planning, WhatsApp broadcasts, rupee pricing. Includes Prompt Studio, an offline app for your phone where all 100 prompts fill in from your brief, a weekly system, and a checker that highlights words that make captions sound AI-written. Example outputs were written by AI from a fictional example brief.",
      includes: ["100 prompts in 6 groups, each with an example output and a follow-up", "Creator brief: fill once, every prompt is about you", "Prompt Studio: offline, works on a phone, copy with one tap", "Clean-up prompt and AI-sound checker", "Weekly system: one chat, seven prompts, a week of content", "How to save your brief in ChatGPT, Claude and Gemini", "31-page PDF, Notion CSV, Markdown and plain-text brief"],
      formats: ["PDF", "HTML", "Notion", "Markdown"],
      level: "All levels",
      accent: "#3DF5C8",
      files: [],
      compare: {
        "columns": [
          "FrameMind, ₹99",
          "Free prompt lists",
          "Gumroad and Etsy packs",
          "“1000+ prompts” bundles"
        ],
        "rows": [
          {
            "label": "Prompts know your niche and audience",
            "values": [
              "Yes, from a 10-question brief",
              "No, you edit each one",
              "Usually fill-in blanks",
              "No"
            ]
          },
          {
            "label": "Example of a good answer",
            "values": [
              "For all 100",
              "Rarely",
              "Some",
              "Rarely"
            ]
          },
          {
            "label": "Follow-up prompt for the second draft",
            "values": [
              "For all 100",
              "No",
              "Rarely",
              "No"
            ]
          },
          {
            "label": "Removes the AI-written sound",
            "values": [
              "Clean-up prompt and checker",
              "No",
              "Rarely",
              "No"
            ]
          },
          {
            "label": "Made for Indian creators",
            "values": [
              "Mixed-language, festivals, WhatsApp, ₹",
              "Rarely",
              "Rarely",
              "Some"
            ]
          },
          {
            "label": "Works on your phone",
            "values": [
              "Offline app, one-tap copy",
              "Web pages",
              "PDF or Notion",
              "PDF"
            ]
          },
          {
            "label": "Price",
            "values": [
              "₹99, keep forever",
              "Free",
              "About $2 to $20",
              "Often ₹99 to ₹199"
            ]
          }
        ],
        "note": "Checked in November 2026 on free lists (Later, Buffer, Sprout Social), Gumroad, Etsy and Indian creator storefronts. Their prices and contents change."
      },
      tags: ["prompts", "instagram", "content"],
    },
    {
      id: "camera-basics",
      slug: "camera-basics-cheat-sheet",
      title: "Camera Basics: Visual Settings Guide",
      tagline: "See what every camera setting does, then shoot with it.",
      category: "camera",
      price: 129,
      mrp: 199,
      status: "soon",
      description:
        "Aperture, shutter speed, ISO, lenses and white balance, each shown side by side on the same scene so you see the difference instead of reading about it. Then the settings to start from in ten situations you actually shoot in India: golden-hour portraits, products, indoor weddings, streets, landscapes, city nights, food, kids and sport, diyas and stage performances.\n\nIncludes a Settings Simulator that works offline on your phone (move f-number, shutter and ISO and watch blur, brightness, shake and grain change), a table of what Sony, Canon, Nikon, Fujifilm and phone Pro modes call each setting, video settings for 50 Hz light, a practice weekend, and a pocket cheat card to print or keep as a wallpaper. Example photos are AI-generated illustrations; the exposure, white balance and ISO comparisons are computed from them.",
      includes: ["15-page illustrated guide: exposure, aperture, shutter, ISO, lenses, white balance", "Same-scene comparisons for every setting (21 example photos)", "10 situation recipes: mode, aperture, shutter, ISO, white balance and focus", "Settings Simulator: offline, works on a phone", "Setting names for Sony, Canon, Nikon, Fujifilm and phone Pro mode", "Video settings for India (25/50 fps, 50 Hz, ND filters)", "Pocket cheat card (A6 and 4-up A4) and a phone wallpaper"],
      formats: ["PDF", "HTML", "PNG", "JPG"],
      level: "Beginners",
      accent: "#E2572B",
      files: [],
      featured: true,
      compare: {
        "columns": [
          "FrameMind, ₹129",
          "Free cheat sheets",
          "Etsy and Gumroad guides",
          "Beginner video courses"
        ],
        "rows": [
          {
            "label": "Each setting shown on the same scene",
            "values": [
              "Yes, all of them",
              "Diagrams, some photos",
              "Some",
              "In video demos"
            ]
          },
          {
            "label": "Situation recipes with full settings",
            "values": [
              "10, with focus and white balance",
              "A few",
              "Some",
              "Some lessons"
            ]
          },
          {
            "label": "Interactive simulator",
            "values": [
              "Offline, on your phone",
              "Some sites, online only",
              "No",
              "No"
            ]
          },
          {
            "label": "Names for your camera brand",
            "values": [
              "Sony, Canon, Nikon, Fujifilm, phone",
              "Usually one brand or none",
              "Varies",
              "Usually one brand"
            ]
          },
          {
            "label": "Video settings for Indian 50 Hz light",
            "values": [
              "Yes",
              "Rarely",
              "Rarely",
              "Rarely"
            ]
          },
          {
            "label": "Printable pocket card",
            "values": [
              "A6, A4 sheet and wallpaper",
              "Yes",
              "Often",
              "No"
            ]
          },
          {
            "label": "Price",
            "values": [
              "₹129, keep forever",
              "Free",
              "About $2 to $40",
              "Often ₹400 and up"
            ]
          }
        ],
        "note": "Checked in November 2026 on free cheat-sheet sites (Photoworkout, Expert Photography), Etsy, Gumroad and Udemy. Their prices and contents change."
      },
      tags: ["photography", "camera", "beginners"],
    },
    {
      id: "phone-cinematography",
      slug: "phone-cinematography-shot-list",
      title: "Phone Cinematography Shot List",
      tagline: "40 shots that make phone video look filmed.",
      category: "camera",
      price: 149,
      mrp: 199,
      status: "soon",
      description:
        "A shot-by-shot field guide for Reels and short films on any phone. Every one of the 40 shots has an example frame, a camera diagram, how to move, where it goes in the edit, and the lens, frame rate and hold time to use.\n\nSet up for India: 25 and 50 fps to avoid flicker under 50 Hz lights, editing apps that are legal here (Edits, VN, InShot), and three Reel recipes for a café, a product drop and a weekend in Hampi. Includes an offline Shot Explorer that builds and prints your shot list, and a sample Reel. Example frames and the sample Reel are AI-generated illustrations of each shot.",
      includes: ["40 shots, each with an example frame, camera diagram, edit use and settings", "Phone settings for India: 25/50 fps, 50 Hz flicker, exposure and lens choice", "3 Reel recipes with shot order and timings", "Offline Shot Explorer: build your Reel, print the shot list", "Sample Reel showing four shots in motion", "40 reference frames and a printable shot-list sheet"],
      formats: ["PDF", "HTML", "MP4", "JPG"],
      level: "All levels",
      accent: "#D7263D",
      files: [],
      compare: {
        "columns": [
          "FrameMind, ₹149",
          "Free checklists and blogs",
          "Online classes",
          "Offline workshops in India"
        ],
        "rows": [
          {
            "label": "Shots covered",
            "values": [
              "40, each with an example frame",
              "Around 10 to 15",
              "Varies by class",
              "Varies"
            ]
          },
          {
            "label": "Settings for Indian light (25/50 fps, 50 Hz)",
            "values": [
              "Yes",
              "Rarely",
              "Rarely",
              "Sometimes"
            ]
          },
          {
            "label": "Where each shot goes in the edit",
            "values": [
              "Yes, for all 40",
              "No",
              "In some lessons",
              "In class"
            ]
          },
          {
            "label": "Ready Reel recipes",
            "values": [
              "3, with timings",
              "No",
              "Some",
              "Class projects"
            ]
          },
          {
            "label": "Shot-list builder",
            "values": [
              "Offline, printable",
              "Notion templates",
              "No",
              "No"
            ]
          },
          {
            "label": "Editing apps legal in India",
            "values": [
              "Yes",
              "Varies",
              "Varies",
              "Varies"
            ]
          },
          {
            "label": "Price",
            "values": [
              "₹149, keep forever",
              "Free",
              "Subscription",
              "About ₹5,000 for 4 days"
            ]
          }
        ],
        "note": "Checked in November 2026 on Gumroad, Notion checklists, Skillshare and workshop pages (Visualite Academy, SAC Pocket Studio). Their prices and contents change."
      },
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
      tagline: "46 carousel slides in 8 formats. Edit in Photoshop, Canva, PowerPoint or our offline studio.",
      category: "templates",
      price: 299,
      mrp: 599,
      status: "soon",
      description:
        "Eight carousel formats that cover what creators and small brands actually post: a step-by-step guide, myth vs fact, before and after, a top list, a text thread, a seamless panorama, a product offer with ₹ prices and a festive sale in Hindi and English.\n\nEvery slide comes in 4:5 and the new 3:4 grid size, three ways: layered PSDs for Photoshop or free Photopea, PowerPoint files that also import into Canva, and Carousel Studio, an offline editor where you set your colours, fonts and handle once and download every slide as PNG.",
      includes: ["46 slides in 8 formats, each in 4:5 (1080×1350) and 3:4 (1080×1440)", "94 layered PSDs: live text, recolourable shapes, photo smart objects", "16 PowerPoint files that open in Canva, Google Slides and Keynote", "Carousel Studio: offline editor, set your brand once, export PNGs", "Hindi + English festive set and ₹ price slides", "7 free font families and a guide with hooks and a posting checklist"],
      formats: ["PSD", "PPTX", "PNG", "HTML"],
      level: "All levels",
      accent: "#FF5FA2",
      files: [],
      compare: {
        "columns": [
          "FrameMind, ₹299",
          "Canva packs on Etsy and Gumroad, $3–40",
          "Multi-app packs (Envato and others)",
          "Free Canva templates"
        ],
        "rows": [
          {
            "label": "Edit in",
            "values": [
              "Photoshop, Photopea, Canva, PowerPoint, offline studio",
              "Canva only",
              "Canva, Figma, Photoshop",
              "Canva only"
            ]
          },
          {
            "label": "Sizes",
            "values": [
              "4:5 and the new 3:4 grid size",
              "Mostly 4:5 or square",
              "Mostly 4:5",
              "Mostly 4:5 or square"
            ]
          },
          {
            "label": "Formats in one pack",
            "values": [
              "8, from guides to offers",
              "Usually 1 style",
              "1 style",
              "Pick one at a time"
            ]
          },
          {
            "label": "Change brand colours once for every slide",
            "values": [
              "Yes, in Carousel Studio",
              "Brand Kit, with Canva Pro",
              "No",
              "Brand Kit, with Canva Pro"
            ]
          },
          {
            "label": "Hindi and Indian festive set",
            "values": [
              "Yes",
              "Rarely",
              "No",
              "Some"
            ]
          },
          {
            "label": "Fonts included",
            "values": [
              "Yes, 7 free families",
              "Canva fonts",
              "Links",
              "Canva fonts"
            ]
          },
          {
            "label": "Needs an account",
            "values": [
              "No",
              "Canva",
              "Varies",
              "Canva"
            ]
          }
        ],
        "note": "Checked in November 2026 on Etsy, Gumroad, Creative Market and Envato Elements listings. Their prices and contents change."
      },
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
      tagline: "40 free font pairs for Indian brands, measured, set in real layouts, with every font included.",
      category: "colour",
      price: 199,
      mrp: 399,
      status: "soon",
      description:
        "Forty font pairs chosen by a designer and checked with measurements from the font files: 24 pairs in six moods, from editorial to loud, and 16 bilingual pairs for Hindi, Marathi, Kannada, Tamil, Telugu, Bengali, Gujarati, Malayalam and Punjabi.\n\nEvery pair is set on a website, a social post and a business card, with its x-heights, a ready type scale and CSS. We also checked every font for the rupee sign (many popular fonts don't have it). All 80 font families are free for commercial use and included in the pack, so there is nothing else to download.",
      includes: ["40 pairs: 24 in six moods and 16 bilingual pairs across nine Indian scripts", "93-page specimen book: measured x-heights, ₹ support and a type scale for every pair", "All 80 font families included, free for commercial use (SIL Open Font License)", "CSS per pair with no-layout-shift fallbacks, plus Tailwind v4 and Figma tokens", "Offline explorer: type your brand name and see it in every pair", "40 specimen cards at 1080×1350"],
      formats: ["PDF", "TTF", "CSS", "HTML"],
      level: "All levels",
      accent: "#4A1D3F",
      files: [],
      compare: {
        "columns": [
          "FrameMind, ₹199",
          "Typewolf lookbooks, $39 each",
          "Big pairing books, about $25",
          "Free pairing sites"
        ],
        "rows": [
          {
            "label": "Pairs",
            "values": [
              "40, each in real layouts",
              "12 per lookbook",
              "Hundreds of specimens",
              "Thousands"
            ]
          },
          {
            "label": "Indian scripts",
            "values": [
              "16 bilingual pairs, 9 scripts",
              "No",
              "No",
              "Few"
            ]
          },
          {
            "label": "₹ support checked",
            "values": [
              "Yes, every font",
              "No",
              "No",
              "No"
            ]
          },
          {
            "label": "Font files included",
            "values": [
              "Yes, 80 families",
              "No",
              "No",
              "Download each"
            ]
          },
          {
            "label": "Measured x-heights",
            "values": [
              "Yes",
              "No",
              "No",
              "No"
            ]
          },
          {
            "label": "Type scale and CSS per pair",
            "values": [
              "Yes, with fallbacks",
              "No",
              "No",
              "Some CSS"
            ]
          },
          {
            "label": "Try your own words",
            "values": [
              "Offline explorer",
              "No",
              "No",
              "Online"
            ]
          }
        ],
        "note": "Checked in November 2026 on the sellers' Gumroad pages and on fontpair.co. Their prices and contents change."
      },
      tags: ["fonts", "typography", "branding"],
    },
    {
      id: "freelancer-kit",
      slug: "freelancer-business-kit",
      title: "Freelancer Business Kit",
      tagline: "Eleven templates from first enquiry to final payment, built for Indian freelancers.",
      category: "business",
      price: 299,
      mrp: 499,
      status: "soon",
      description:
        "Everything between “can you do this?” and money in your account: a client brief, proposal, quotation, project agreement, change request, handover note and copyright assignment deed in Word, plus an invoice, a business tracker and a rate calculator in Excel.\n\nIt is built for India. The invoice switches between GST, non-GST and export (LUT) invoices and picks CGST + SGST or IGST from the two States. The agreement follows the Copyright Act and the MSMED Act, with a note explaining every clause. The tracker follows TDS and the April to March year. Every document comes filled in as an example, and the offline tools draw a UPI QR with the amount on each invoice.\n\nPractical guidance, not legal or tax advice; for large contracts and tax filing, ask a lawyer or CA.",
      includes: ["11 templates: brief, proposal, quotation, agreement, change request, handover, copyright deed, invoice, tracker, rate calculator, 23 client messages", "Invoice for GST, non-GST and export (LUT) work, with amount in words in lakh and crore", "Agreement written for Indian law, with a margin note on every clause", "Business tracker: invoices, TDS, expenses and an April to March dashboard", "Offline tools: invoice maker with UPI QR, rate and late-payment calculators", "17-page handbook: pricing, proposals, copyright, GST, TDS and getting paid", "Every document filled in as an example, plus the free Geist fonts"],
      formats: ["DOCX", "XLSX", "PDF", "Google"],
      level: "Freelancers",
      accent: "#1F8A5B",
      files: [],
      compare: {
        "columns": [
          "FrameMind, ₹299",
          "Design-led kits we checked, ₹1,700–9,000",
          "Word and Canva kits, $5–20",
          "Free invoice apps"
        ],
        "rows": [
          {
            "label": "Documents",
            "values": [
              "11, from brief to copyright deed",
              "4 to 5: proposal, contract, invoice",
              "3 to 5",
              "Invoices and quotes"
            ]
          },
          {
            "label": "Edit in",
            "values": [
              "Word, Excel, Google, LibreOffice",
              "Illustrator, InDesign or Figma",
              "Word or Canva",
              "Their app only"
            ]
          },
          {
            "label": "GST invoice that picks CGST + SGST or IGST",
            "values": [
              "Yes",
              "No",
              "No",
              "Yes"
            ]
          },
          {
            "label": "Export invoice under LUT",
            "values": [
              "Yes",
              "No",
              "No",
              "In some"
            ]
          },
          {
            "label": "Agreement written for Indian law",
            "values": [
              "Yes, every clause explained",
              "Generic",
              "Generic",
              "No"
            ]
          },
          {
            "label": "Copyright assignment deed",
            "values": [
              "Yes",
              "No",
              "No",
              "No"
            ]
          },
          {
            "label": "Tracker with TDS and April to March year",
            "values": [
              "Yes",
              "No",
              "Rarely",
              "On paid plans"
            ]
          },
          {
            "label": "Filled-in example of every document",
            "values": [
              "Yes",
              "Some",
              "Some",
              "No"
            ]
          },
          {
            "label": "Limits",
            "values": [
              "None, works offline",
              "None",
              "None",
              "Free tier limits"
            ]
          }
        ],
        "note": "Checked in November 2026 against freelancer kits on Gumroad, Etsy and Payhip and against free Indian invoicing apps. Their prices and contents change."
      },
      tags: ["freelance", "invoice", "contract"],
    },
    {
      id: "creator-starter-bundle",
      slug: "creator-starter-bundle",
      title: "Creator Starter Bundle",
      tagline: "Camera basics, presets, carousels, palettes and prompts.",
      category: "bundles",
      price: 499,
      mrp: 775,
      status: "soon",
      description: "Five of our best-sellers for new creators, together for less than buying them one by one.",
      includes: ["Camera Basics: Visual Settings Guide", "Lightroom Preset Pack", "Instagram Carousel Templates", "50 Trending Colour Palettes", "100 AI Prompts for Creators"],
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

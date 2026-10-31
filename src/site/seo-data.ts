/**
 * Each public page's title, description and keywords, as the Figma site had them (rendered by Next.js metadata).
 */
export interface PageSeo {
  title: string;
  description: string;
  keywords?: string;
  ogImageAlt?: string;
}

export const PAGE_SEO: Record<string, PageSeo> = {
  "/careers": {
    "title": "Careers — Work at FrameMind AI Studio",
    "description": "Join FrameMind AI Studio in Gadag, Karnataka: designers, developers, photographers and video editors, social media and business development. Full-time, internship and freelance.",
    "keywords": "design jobs Karnataka, web developer jobs Gadag, design internship India, video editor jobs Karnataka, FrameMind careers",
    "ogImageAlt": "Careers at FrameMind AI Studio"
  },
  "/": {
    "title": "Web Design, Development & AI Solutions",
    "description": "FrameMind Studio is an MSME-registered design and development studio in India. We build websites, brand systems, custom software, and AI-powered tools — delivered on time, at transparent INR pricing.",
    "keywords": "web design India, website development India, brand identity India, AI studio India, MSME design studio Karnataka, custom software India, design agency Gadag, FrameMind AI Studio",
    "ogImageAlt": "FrameMind AI Studio — Web Design, Development & AI Solutions"
  },
  "/pricing": {
    "title": "Services & Pricing — Build Your Custom Quote",
    "description": "Configure exactly what you need and get an instant price. Download a personalised PDF quote for websites, brand, software, automations, photography, videography, or social media.",
    "keywords": "web design pricing India, website cost India, brand identity price, custom software quote India, digital services pricing, photography videography pricing India, FrameMind services",
    "ogImageAlt": "FrameMind AI Studio — Services & Pricing Configurator"
  },
  "/vritta": {
    "title": "Vritta — Activity Records & Newsletter Platform for Schools & Colleges",
    "description": "Vritta by FrameMind AI Studio is a departmental activity record platform for schools and colleges that produces the institution's newsletter as a by-product. NAAC evidence, auto-composed newsletters, 4-week go-live.",
    "keywords": "institutional newsletter software India, NAAC evidence software, activity record schools colleges India, department newsletter platform, education software India, IQAC software, accreditation evidence India, college newsletter automation",
    "ogImageAlt": "Vritta — Departmental Activity Record & Newsletter Platform by FrameMind AI Studio"
  },
  "/360vue": {
    "title": "360VUE — 360° Virtual Tours, SkyVUE Aerial 360° & Google Maps",
    "description": "360VUE makes 360° virtual tours, SkyVUE drone 360° aerial views and Google Maps listings for restaurants, hotels, showrooms, hospitals, colleges and real estate across South India. A FrameMind AI Studio company.",
    "keywords": "360 virtual tour India, virtual tour Bengaluru, Google Maps 360 tour, drone 360 aerial view, SkyVUE, real estate virtual tour, hotel virtual tour, 360VUE, FrameMind 360VUE",
    "ogImageAlt": "360VUE — 360° Virtual Tours, a FrameMind AI Studio company"
  },
  "/jove": {
    "title": "JOVE — School Robotics & AI Workshops Across India",
    "description": "JOVE brings full-day robotics, AI, and machine learning workshops to school campuses across India for Grades 1–10. Co-founded by the team behind FrameMind AI Studio.",
    "keywords": "school robotics workshop India, AI workshop schools India, STEM education India, NEP 2020 robotics, machine learning school program, JOVE workshop, FrameMind JOVE",
    "ogImageAlt": "JOVE — School Robotics & AI Workshops by FrameMind AI Studio"
  },
  "/shop": {
    "title": "Shop — Digital Products & Templates",
    "description": "FrameMind Studio's digital shop: website templates, Notion systems, automation blueprints, and workflow tools. Studio-quality resources for founders and builders.",
    "keywords": "digital products India, website templates India, Notion templates, workflow automation tools, digital resources for founders, design templates India, FrameMind shop",
    "ogImageAlt": "FrameMind AI Studio — Digital Products & Templates Shop"
  },
  "/personal-coaching": {
    "title": "1-on-1 AI Personal Coaching — Learn AI in 90 Days",
    "description": "FrameMind Studio's AI personal coaching — tailored for ages 10 to 60. Build real AI skills through structured, one-on-one sessions. Available online and offline across India.",
    "keywords": "AI coaching India, learn artificial intelligence India, AI training for beginners, one on one AI tutor India, AI course students India, AI for professionals India, FrameMind coaching",
    "ogImageAlt": "FrameMind AI Studio — 1:1 AI Personal Coaching, Learn AI in 90 Days"
  },
  "/testimonials": {
    "title": "Client Testimonials — Real Results from Real Businesses",
    "description": "What our clients say about working with FrameMind Studio — real feedback from Indian businesses we've helped build their digital presence, brand, and tools.",
    "keywords": "FrameMind reviews, design studio testimonials India, client feedback web design, FrameMind AI Studio reviews, web development reviews India",
    "ogImageAlt": "FrameMind AI Studio — Client Testimonials & Reviews"
  },
  "/team": {
    "title": "Our Team — Designers, Developers & Strategists",
    "description": "Meet the people behind FrameMind Studio — a small, senior team of designers, developers, and strategists who handle every project from brief to launch.",
    "keywords": "FrameMind team, design studio team Karnataka, web developers India, UI UX designers India, FrameMind AI Studio founders",
    "ogImageAlt": "FrameMind AI Studio — Meet the Team"
  },
  "/connect": {
    "title": "Contact Us — Start a Project",
    "description": "Tell us what you're building. FrameMind Studio offers a free 20-minute discovery call — no decks, no proposals. Just a direct conversation about your project.",
    "keywords": "hire web designer India, contact design studio India, start a project web design, free discovery call, web development enquiry India, FrameMind contact",
    "ogImageAlt": "FrameMind AI Studio — Contact Us & Start a Project"
  }
};

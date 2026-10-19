# FrameMind AI Studio — website and HQ

One codebase, **two websites**, one deployment (the same set-up as JOVE):

| | What | Where |
|---|---|---|
| 🌐 **Public website** | The studio site from the Figma export: home, services & pricing configurator (downloadable PDF quotes), Vritta, 1:1 AI coaching, JOVE, testimonials, team, shop, contact. Every form files its enquiry straight into HQ. | `/` on www.framemindaistudio.com |
| 🛠 **FrameMind HQ** | The studio's internal operations portal | `/hq` (optionally `hq.framemindaistudio.com`) |

The public site's code is in `src/site` (pages, components, the router shim that lets the exported pages run on Next.js) and `src/app/(site)` (one route per page). Its images are web-sized copies in `public/site`.

**Leads:** the Contact form and the pricing configurator's "Download quote" (when a phone or email is given) post to `/api/public/submit`, which files them in HQ → Enquiries as "Website form" leads.

HQ uses the same architecture as JOVE HQ, but **it is a separate company with separate data**. The team is shared; nothing else is. FrameMind HQ has its own session cookie (`framemind_hq`), its own private data repository, and a guard that refuses to read or write if `GITHUB_REPO` points at a JOVE repository (`src/lib/store/index.ts → pointsAtOtherCompany`).

| Area | Modules |
|---|---|
| Overview | Command Center, Tasks, Activity Log |
| Sales | Enquiries, Clients CRM, Quotes (priced from the Rate Card) |
| Delivery | Projects (milestones, checklists, handover), Production, Shoots (call sheets), Travel, Feedback & Testimonials |
| Coaching & products | AI Coaching (90-day plans), Vritta licences, Certificates (public `/verify`) |
| Brand & social | Social Studio (designs, plan, captions, founders, brand kit) |
| Money | Finance (invoices per milestone, expenses, GST, CA pack), Rate Card, Team & Payroll, Business Planner |
| Legal | Documents to Sign (offer letters, NDAs, SOWs, releases, client agreements) |
| Studio | Gear & Assets, Tools & Vendors |
| Knowledge | Presentations, Operations Library, Printables, File Vault |

## Two repositories: code and data

| Repository | Visibility | Holds |
|---|---|---|
| **`framemind-platform`** (this one) | **Public** | Only the website and HQ **code**. Vercel deploys from it. No passwords, no company data. |
| `framemind-hq-data` | **private** | HQ's database: `data/*.json` (clients, quotes, projects, invoices, payroll…), `data/ratecard.json`, `OPERATIONS/` (SOPs, playbooks, legal, finance) and `vault/` (receipts, signed papers). |

There is no database server. HQ reads and writes the private data repo through the GitHub API, so every save is a commit with full history. In development, without `GITHUB_*` variables, it reads and writes the local `data/`, `OPERATIONS/`, `vault/` and `secure/` folders (all gitignored).

## Run it locally

```bash
npm install
npm run dev
```

The website opens on http://localhost:3011 and HQ on http://localhost:3011/hq. Logins come from `HQ_USERS` in `.env.local` (see `.env.example`); create them with `node scripts/make-hq-env.mjs --local`.

## Deploy on Vercel

1. Create the **private** repo `framemind-hq-data` (empty is fine).
2. Create a fine-grained GitHub token with access to that repo only: **Contents: Read and write**.
3. Run `node scripts/make-hq-env.mjs` on your own computer. It writes `.env.vercel` with the session secret and the logins (password hashes only).
4. Vercel → Project → Settings → Environment Variables → Import `.env.vercel` (Production and Preview). Paste the token after `GITHUB_TOKEN=`. Set `NEXT_PUBLIC_SITE_URL=https://www.framemindaistudio.com` (it is also the default): canonical links, the sitemap, certificate QR codes and links in papers to sign use it.
5. Add the domain in Vercel → Project → Domains: `framemindaistudio.com` (redirect to `www`) and `www.framemindaistudio.com`; optionally `hq.framemindaistudio.com`, which opens HQ directly.
6. Deploy, sign in at `/hq`, and fill **Settings** (legal name, address, GSTIN, Udyam, bank and UPI for invoices, numbering) and **Rate Card**.

Add or remove one login later with `node scripts/hq-user.mjs`.

## Where things are

- `src/lib/hq/collections.ts` — every record type and its fields; the generic record screens are driven from it.
- `src/lib/content/catalog.ts` — the published rate card (the starting prices before the founders save their own).
- `src/lib/sign/templates/` — every document the studio sends to sign.
- `src/lib/site.ts` — the company profile printed on documents.
- `src/lib/hq/roles.ts` — roles: founder, admin, ops, studio, media, viewer. Only founders and admins save.

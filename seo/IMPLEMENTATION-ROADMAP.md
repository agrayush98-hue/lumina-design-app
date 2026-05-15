# Lumina Design — SEO Implementation Roadmap

---

## Phase 1: Foundation (Weeks 1–2) — ~6 hours total
*Fix everything that's actively blocking Google right now.*

### Week 1 — Technical Fixes (2–3 hours)
- [ ] Add `robots.txt` to static site (`User-agent: *`, `Allow: /`, `Sitemap:` URL)
- [ ] Add `sitemap.xml` covering all 5 pages with correct `<lastmod>` dates
- [ ] Add `<link rel="canonical">` to every page (no `.html` suffix)
- [ ] Fix footer dead links — either remove or point to real pages
- [ ] Fix nav links: `/index.html` → `/`
- [ ] Add redirects: `/pricing` → `/pricing.html` (and same for /features /contact)
- [ ] Submit sitemap to Google Search Console (free, takes 5 minutes)

### Week 2 — On-Page Basics (3 hours)
- [ ] Write meta descriptions for all 5 pages (150–160 chars each)
- [ ] Add Open Graph tags to all pages (title, description, image, URL)
- [ ] Create a 1200×630px OG image for social sharing
- [ ] Add `SoftwareApplication` JSON-LD schema to homepage
- [ ] Add `Organization` JSON-LD schema to homepage
- [ ] Add `llms.txt` to root domain
- [ ] Optimise title tags (remove "SaaS", add target keywords)

---

## Phase 2: Content Foundation (Weeks 3–8) — ~20 hours total
*Build the pages Google needs to understand what Lumina Design does.*

### Individual Feature Pages (8 hours)
Create a dedicated page for each core feature — these are your highest-converting SEO pages:
- `/features/lux-calculation` — target: "lux calculation software online"
- `/features/dali-planning` — target: "DALI 2.0 design software"
- `/features/heat-map` — target: "lighting heat map visualization"
- `/features/floor-plan-upload` — target: "floor plan lighting design tool"
- `/features/pdf-excel-export` — target: "lighting BOQ Excel export"

Each page: 600–800 words, H1/H2/H3 structure, 1 screenshot, schema markup, CTA.

### Free Lux Calculator Tool (4 hours)
Build a free web-based lux calculator at `/tools/lux-calculator`.
- Inputs: room dimensions, ceiling height, reflectance values, fixture lumens
- Output: average lux, uniformity ratio, pass/fail per EN 12464-1
- This single page will rank for dozens of "lux calculator" keywords
- Acts as a top-of-funnel lead magnet → free trial CTA

### First 3 Blog Posts (6 hours)
- `How to Calculate Lux for Office Lighting (with Formula + Free Calculator)`
- `EN 12464-1 Lux Requirements: Complete Table for All Room Types`
- `DALI 2.0 Explained: Addressing, Bus Load, and Driver Scheduling`

### Comparison Pages (2 hours)
- `/compare/dialux-alternative` — target: "DIALux alternative" (high intent)
- Keep fair and factual: feature table, pricing comparison, use case fit

---

## Phase 3: Authority Building (Weeks 9–20) — ongoing
*Build the domain authority that makes everything else rank faster.*

### Content Cadence
- 2 blog posts per month (focus on technical SEO keywords)
- 1 glossary term per week (low effort, compounds over time)
- 1 case study per quarter (real customer, real project, real lux numbers)

### Priority Blog Topics (first 6 months)
1. `Lux Requirements for Warehouses in India (NBC 2016 Standards)`
2. `IES Lumen Method vs Point-by-Point: Which to Use?`
3. `How to Design Classroom Lighting for Indian Schools`
4. `DALI vs 0-10V Dimming: Complete Comparison`
5. `Lighting Design Checklist for MEP Engineers`
6. `How to Read an IES File`
7. `Lumens vs Lux vs Candela — The Definitive Guide`
8. `Hospital Lighting Design: Requirements and Best Practices`
9. `Lighting BOQ Template: What to Include (Free Download)`
10. `Energy Savings Calculator: LED Retrofit ROI`

### E-E-A-T Signals
- List on G2, Capterra, Software Suggest (free, 2 hours total)
- Get 5 real customer reviews on each platform
- Write 2 guest posts for Indian architecture/MEP publications
- Add founder bio with real credentials to About page

### Backlink Targets
- IndiaMART software listing (free)
- NatHab / IGBC India references
- IES India community
- Architecture + design forums (Archinect India, etc.)

---

## Phase 4: Scale (Months 6–12)
*Compound what's working.*

### Solutions Pages by Industry
Once blog posts start ranking, build dedicated solution pages:
- `/solutions/offices` — "office lighting design software"
- `/solutions/warehouses` — "warehouse lighting calculation"
- `/solutions/hospitals` — "hospital lighting design tool"
- `/solutions/retail` — "retail store lighting design"
- `/solutions/classrooms` — "school lighting calculation India"

### Programmatic SEO Opportunity
`/lux-calculator/[room-type]` pages:
- `/lux-calculator/office`
- `/lux-calculator/warehouse`
- `/lux-calculator/classroom`
- `/lux-calculator/hospital`

20+ pages, minimal effort, each targeting a specific long-tail keyword cluster.

### International Expansion
Once Indian market has traction:
- Add `hreflang` tags for English (global)
- Target Middle East market (UAE, Saudi — high construction activity, same electrical standards)

---

## Quick Wins Summary (Do These First)

| Task | Time | Impact |
|---|---|---|
| robots.txt + sitemap | 15 min | 🔴 Critical — indexation |
| Submit to Search Console | 10 min | 🔴 Critical — indexation |
| Canonical tags | 20 min | 🔴 Critical — duplicate content |
| Meta descriptions | 20 min | 🟠 High — CTR |
| OG tags | 20 min | 🟠 High — social traffic |
| JSON-LD schema | 15 min | 🟠 High — rich results |
| llms.txt | 10 min | 🟠 High — AI search |
| Fix footer dead links | 10 min | 🟠 High — crawl graph |
| Free lux calculator page | 4 hrs | 🌟 Highest ROI content asset |
| DIALux alternative page | 1 hr | 🌟 Highest converting page |

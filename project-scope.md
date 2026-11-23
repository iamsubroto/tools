# Project Scope Document

## 1. Project Overview & Strategic Positioning
- **Project Type:** Focused Personal Finance, Property, Tax & Daily Utility Web Platform for **Bangladesh & Non-Resident Bangladeshis (NRBs)**
- **Primary Stack:** Next.js (App Router), TypeScript, Tailwind CSS
- **Monetization Model:** Multi-layered ethical monetization — **High-RPM Google AdSense** (finance, real estate, B2B & Tier-1 NRB traffic) + **Transparent Financial/Remittance Affiliates** + **Post-Traction Local Sponsorships**
- **Development Workflow:** Agentic coding CLIs (Claude Code, Codex CLI, Antigravity CLI)
- **Core Mission:** Deliver fast, accurate, zero-signup, 100% free tools that **save everyday Bangladeshis and NRBs real money, prevent costly administrative/financial mistakes, and eliminate calculation confusion**—while building strong SEO topical authority and sustainable revenue.
- **Core Principles:**
  - **Dead-Simple UX:** Zero unnecessary complexity; anyone on a budget mobile phone can get an accurate answer in under 10 seconds.
  - **People-First Utility:** Every financial tool explains *why* the result happened and surfaces plain-language **Smart Money Insights** (e.g., how submitting PSR saves 5% tax, or how crossing 50 electricity units changes the tariff slab).
  - **SEO & Trust Built-In:** Official government/regulatory citations, bilingual English + Bangla (`EN / BN`) readiness from Day 1, and deep helpful guides to outperform thin generic calculators.

---

## 2. Revenue & Social Impact Strategy

Relying solely on domestic Bangladesh AdSense traffic with generic global utilities (like percentage calculators or code beautifiers) caps revenue at very low RPM ($0.20–$0.80) and hurts Google Search rankings. This scope is engineered to **multiply revenue 5x–15x while genuinely helping more people**:

### Revenue Pillars
1. **High-RPM Niche Concentration (Finance, Tax, Real Estate, SME):** Banking, loans, income tax, land registration, and business VAT/margin tools command significantly higher advertiser CPC than generic math/developer tools—and have much lower ad-blocker usage than developer utilities.
2. **Tier-1 NRB Traffic Capture:** Dedicated tools for Non-Resident Bangladeshis in the US, UK, Canada, Australia, EU, and Middle East (Remittance + 2.5% Incentive, Sanchayapatra/NRB savings, Land Measurement/Registration, Zakat, Gold) generate **Tier-1 AdSense RPM** alongside domestic volume.
3. **High-Intent Ethical Affiliates (Contextual & Disclosed):** Only on tools where users genuinely need a service next—such as Wise, Remitly, TapTap Send, and Payoneer on the **Remittance & Freelancer USD-to-BDT Calculator** (CPA payouts of $10–$50+ per referral, always clearly marked with an Affiliate Disclosure).
4. **Post-Traction Local B2B Sponsorships (Phase 4):** Clearly labeled *"Featured Partner"* rate cards for BD banks, NBFIs, real estate platforms, or BCS/EdTech providers once traffic scales past 50k+ monthly visits.
5. **Programmatic Growth Without Spam:** Clean shareable result URLs (`?amount=500000&scheme=paribar`) + dedicated reference guide hubs (*"BD Income Tax Slabs FY 2025-26/2026-27"*, *"Current Sanchayapatra Rates"*, *"BERC Electricity Tariff Table"*) that rank for informational queries and funnel users directly into the calculators.

### People-First Impact Pillars
1. **100% Free Core Tools Forever:** No login walls, no paywalled basic calculations, no data harvesting.
2. **Actionable "Smart Insights" Box:** Every calculator highlights practical savings or trap warnings (e.g., PSR 10% vs 15% TDS gap on FDR/DPS, bank excise duty threshold at ৳4 Lakh, 50-unit electricity lifeline cliff, ৳7.5 Lakh Sanchayapatra slab shift, loan prepayment savings).
3. **Privacy by Architecture:** Sensitive salary, tax, Zakat, and job-application photos **never leave the user's device**—100% client-side computation and Canvas image processing.
4. **Verified Transparency:** Every regulated calculator displays its **`Last Updated` date** and links to official sources (NBR, National Savings Directorate, BERC, BAJUS, Bangladesh Bank, Teletalk).
5. **Bilingual Accessibility (`EN / BN`):** Built-in English & Bangla interface labels and Bangla search-intent headings/FAQs so everyday citizens—not just English-fluent users—benefit fully, while capturing high-volume, lower-competition Bangla search queries.

---

## 3. Core Platform Features

### User Experience & UI
- **Dedicated SEO Routes:** Every tool lives on a clean, descriptive URL (e.g., `/sanchayapatra-calculator`, `/bd-income-tax-calculator`, `/electricity-bill-calculator-bd`).
- **Mobile-First & Above-the-Fold Inputs:** Interactive inputs and live results appear immediately on mobile screens without clutter; optimized for low-end Android devices and slower 4G connections.
- **Instant Real-Time Calculations:** Live updates as values change, clean inline validation, preset quick-fill chips (e.g., `৳1 Lakh`, `৳5 Lakh`, `৳10 Lakh`), and a one-click **Reset** button.
- **Localized South Asian Formatting:** Automatic BDT (`৳`) currency formatting using Lakh/Crore grouping (`1,00,000`), optional multi-currency toggle (`BDT / USD / GBP / EUR / SAR / AED`) where relevant, plus **"In Words"** display (English & Bangla) for financial amounts.
- **Shareable State, WhatsApp Copy & Print/PDF:**
  - **Share Link:** Encodes inputs in URL query parameters so families/colleagues can open the exact live calculation.
  - **One-Click "Copy Summary":** Cleanly formatted text ready for WhatsApp/Messenger.
  - **Print / Save PDF:** Clean print stylesheet for tax summaries, loan amortization schedules, and land/gold estimates (subtle footer site attribution acts as organic word-of-mouth).
- **Global Search & Focused Categories:** Fast homepage search (matching English, Bangla, and Banglish terms like `"biddut bill"`, `"jomi"`, `"sanchaypatra"`) across 5 focused categories: **Finance & Banking**, **Tax & Salary**, **Property & Gold**, **Daily Utilities**, and **Career & Student**.
- **Bilingual (`EN / BN`) & Theme Support:** English default with Bangla (`বাংলা`) toggle using crisp typography (`Plus Jakarta Sans` + `Hind Siliguri`), plus Light Mode (default) and Dark Mode toggle.

### SEO, E-E-A-T & Google AdSense Readiness
- **Rich, Helpful Below-the-Fold Content:** Every tool page includes:
  1. Quick plain-language overview ("How this helps you")
  2. Official rate/slab summary table (dynamically hydrated from `src/data/rates.json`)
  3. Formula & step-by-step worked Bangladesh example
  4. 4–6 targeted FAQs (addressing both English & Bangla user questions)
  5. Related internal tools cross-link cards (increases pages/session and dwell time)
- **Technical SEO:** Unique metadata (`title`, `description`, canonical URL, Open Graph tags), structured data (`WebApplication`, `FAQPage`, `BreadcrumbList` JSON-LD), dynamic `sitemap.xml`, and `robots.txt`.
- **Ad-Safe, CLS-Zero Layout:** Fixed-dimension reserved ad containers (`min-h`) placed with clear whitespace away from interactive buttons/inputs to prevent Cumulative Layout Shift (CLS < 0.05) and accidental clicks.
- **Mandatory Trust & Transparency Pages:** Home, About Us, Calculation Methodology & Official Sources, Contact, Privacy Policy, Terms of Use, Financial/Legal Disclaimer, and Affiliate Disclosure.

---

## 4. Master Tool List (18 Tools Across 3 Strategic Phases)

Tools are phased strictly by **Revenue Potential (AdSense RPM + Affiliate CPA)**, **Bangladesh + NRB Search Demand**, **SEO Winnability**, and **Real-World Impact**.

### Phase 1 — Core High-RPM Finance, Tax & NRB Launch (6 Tools)
*Objective: Establish topical authority in Bangladesh personal finance, attract Tier-1 NRB & freelancer traffic, pass Google AdSense review cleanly, and activate high-value revenue early.*

| # | Tool Name | Route Slug | Target Audience | Revenue Driver | How It Helps People |
|---|---|---|---|---|---|
| 1 | **Sanchayapatra Profit & Tax Calculator** | `/sanchayapatra-calculator` | Retirees, families, savers, NRBs | High BD/NRB Finance RPM | Calculates Paribar, Pensioner, 3-Month & 5-Year net profit using official 2-slab rates (`≤৳7.5L` vs `>৳7.5L`), source tax exemptions, and premature encashment penalties. |
| 2 | **BD Income Tax Calculator** | `/bd-income-tax-calculator` | Salaried staff, professionals, freelancers | Peak seasonal + High Finance/Tax RPM | Implements FY 2025-26/2026-27 NBR slabs (`৳4L`/`৳4.5L`/`৳5.25L`/`৳5.5L`), investment rebate optimizer, and area-based minimum tax so citizens file accurately and avoid overpaying. |
| 3 | **BD Salary, Take-Home & Gratuity Calculator** | `/bd-salary-calculator` | Job seekers, corporate employees, HR | High Finance/Career RPM | Converts Gross/CTC to real monthly take-home (Basic/HR/Medical/Conveyance, PF, monthly TDS, festival bonus, gratuity) so workers evaluate job offers with clarity. |
| 4 | **EMI & Bank Loan Calculator (BD)** | `/emi-loan-calculator` | Home, car & personal loan borrowers | Top Finance/Banking CPC | Unifies EMI + Loan calculation in Lakh/Crore with full amortization schedule and an **extra prepayment savings simulator** showing how to cut years of interest. |
| 5 | **DPS & FDR Maturity Calculator (BD)** | `/dps-fdr-calculator` | Bank savers, middle-class families | High Banking RPM | Reveals the *real* maturity payout after **10% PSR vs 15% non-PSR TDS** and **BD Bank Excise Duty slabs**—showing users exactly how much they save by submitting PSR. |
| 6 | **Remittance (2.5% Incentive) & Freelancer USD-to-BDT Calculator** | `/remittance-freelancer-calculator` | **Tier-1 NRBs (US/UK/CA/AU/EU)** & BD Freelancers | **Top Revenue Driver:** Tier-1 RPM + Wise/Remitly/Payoneer Affiliates | Compares net BDT received across bank wire, Wise, Remitly & Payoneer including fees and the 2.5% govt remittance incentive—saving senders thousands per transfer. |

### Phase 2 — High-Traffic Daily Utilities, Property & Commerce (6 Tools)
*Objective: Build a recurring monthly traffic engine, capture high-CPC real estate & B2B searches, and empower Bangladeshi households and small online sellers.*

| # | Tool Name | Route Slug | Target Audience | Revenue Driver | How It Helps People |
|---|---|---|---|---|---|
| 7 | **BD Electricity Bill Calculator (DESCO, DPDC, NESCO, BPDB, Palli Bidyut)** | `/electricity-bill-calculator-bd` | Every urban & rural household | Massive recurring monthly sessions + repeat bookmarks | Computes exact BERC residential LT-A slab bills, 50-unit lifeline cliff, demand charge (`৳42/kW`), prepaid meter rent/rebate, and 5% VAT so families can audit bills and manage AC/appliance costs. |
| 8 | **BD Land Measurement & Registration Cost Calculator** | `/land-measurement-calculator-bd` | Land buyers, NRBs, farmers, agents | Very High Real Estate CPC (BD + NRB) | Converts Shotok/Decimal, Katha, Bigha, Acre, Sq Ft, Sq Meter, Gonda/Kora/Kranti AND estimates Deed Registration fees (Stamp Duty, Registration Fee, Local Tax, Gain Tax). |
| 9 | **Gold Price (Vori / Ana / Rotti) & Jewelry Cost Calculator** | `/gold-vori-calculator-bd` | Families, wedding shoppers, NRBs | High Retail/Luxury CPC | Converts Vori, Ana, Rotti, Point & Grams using BAJUS 22K/21K/18K/Traditional rates + 5% VAT + making charge + old-gold exchange deduction to prevent jewelry shop overcharging. |
| 10 | **bKash, Nagad & Rocket Charge Calculator** | `/mfs-charge-calculator-bd` | Everyday MFS users, shopkeepers | Huge daily search volume + mobile shares | Compares App vs USSD, Agent vs ATM & Priyo Agent charges, plus a **Reverse Calculator** ("How much to send so the receiver gets exact ৳X after cash-out"). |
| 11 | **BD VAT, VDS & AIT Calculator** | `/vat-ait-calculator-bd` | SMEs, procurement, contractors, agencies | High B2B/Accounting CPC | Instant inclusive/exclusive BD VAT (`15%`, `10%`, `7.5%`, `5%`) plus VDS & AIT breakdowns for invoices, tenders, and client billing. |
| 12 | **SME & F-Commerce Profit Margin, COD & Discount Calculator** | `/profit-margin-discount-calculator` | Facebook/F-commerce sellers, small shops | High E-Commerce/B2B CPC + Hosting/SaaS Affiliates | Calculates real net profit per order after sourcing cost, courier delivery & COD %, ad spend, and campaign discounts—helping small entrepreneurs avoid hidden losses. |

### Phase 3 — Viral Seasonal, Civic, Student & Productivity Hub (6 Tools)
*Objective: Capture massive seasonal traffic surges (Ramadan, SSC/HSC results, BCS circulars), earn natural backlinks, and maximize social goodwill.*

| # | Tool Name | Route Slug | Target Audience | Revenue Driver | How It Helps People |
|---|---|---|---|---|---|
| 13 | **Zakat Calculator (Bangladesh & NRB)** | `/zakat-calculator-bd` | Muslims in BD & global NRBs | Massive Ramadan global/Tier-1 traffic spike | Computes Gold (`7.5 Vori`) & Silver (`52.5 Vori`) Nisab in BDT/USD/GBP across cash, bank/FDR, Sanchayapatra, gold, investments & liabilities accurately. |
| 14 | **BD Govt Job, BCS & Passport Photo/Signature Resizer** | `/bd-job-photo-signature-resizer` | BCS/Govt job seekers, students, citizens | Massive organic volume + backlinks (zero server cost) | 100% browser-side Canvas crop & KB compressor with exact Teletalk/BCS presets (`300×300px <100KB` photo, `300×80px <60KB` signature), NID & Passport—saves money and prevents rejections. |
| 15 | **Age & BD Govt Job / BCS Eligibility Calculator** | `/age-govt-job-calculator-bd` | Job seekers, students, parents | High evergreen search intent | Calculates exact Years/Months/Days age on any circular cutoff date and checks eligibility against Bangladesh's **32-year BCS/Govt job age limit** (plus custom circular limits). |
| 16 | **SSC, HSC & University GPA / CGPA Calculator (BD)** | `/gpa-cgpa-calculator-bd` | SSC/HSC, National, Public & Private Uni students | Viral result-season surges + WhatsApp shares | Handles BD 5.00 scale (including 4th/optional subject rule) and 4.00 credit-weighted CGPA with a "Target CGPA Needed" semester planner. |
| 17 | **SIP, Compound Interest & Inflation Goal Calculator** | `/sip-investment-calculator` | Young professionals, NRBs, investors | High Global/NRB Finance RPM | Projects mutual fund/SIP compounding in BDT/USD with step-up contributions and **inflation-adjusted purchasing power** so savers set realistic goals. |
| 18 | **Bijoy ⇄ Unicode Converter & Bangla Text Toolkit** | `/bijoy-to-unicode-converter` | Journalists, govt offices, students, writers | High daily evergreen volume + repeat bookmarks | Bidirectional Bijoy ANSI ⇄ Avro/Unicode converter with broken-conjunct cleanup plus an integrated Bangla/English Word, Character & SMS counter. |

---

## 5. Technical & Agentic CLI Guardrails

To keep the codebase clean, fast, and safe when building features across multiple coding agents:
- **Static-First Architecture:** All 18 tools run **100% client-side in the browser** on statically generated (`SSG`) Next.js App Router pages—zero backend database, near-zero hosting cost, maximum uptime during traffic spikes.
- **Centralized, Schema-Validated Rates Config:** Every statutory/regulatory rate (NBR income tax slabs, Sanchayapatra 2-slab rates, BERC electricity tariffs, Bank Excise Duty, MFS fees, BAJUS gold reference presets, govt job age limits) MUST live in `src/data/rates.json`, validated at build time via **Zod**, with `lastUpdated`, `effectiveFrom`, `reviewCadence`, and `officialSourceUrl` metadata—never hardcoded inside React components.
- **Separated Pure Calculation Engine:** All formulas live in `src/lib/calculators/<tool>.ts` as pure, side-effect-free TypeScript functions decoupled from React UI. Each calculator also returns a `smartInsights: Insight[]` array for people-first financial tips.
- **Shared Tool Registry:** All 18 tools are declared in a single source of truth (`src/config/tools.ts`) driving navigation, homepage search, category filters, breadcrumbs, related tools, and `sitemap.xml`.
- **Automated Verification Before Deployment:**
  - Every calculator in `src/lib/calculators/` MUST have unit tests (Vitest) covering nominal cases, zero/empty values, exact slab boundary edge cases (e.g., 50 vs 51 electricity units, ৳7,50,000 vs ৳7,50,001 Sanchayapatra, ৳4,00,000 vs ৳4,00,001 tax/excise threshold), and invalid/negative input clamping.
  - Build gate requires `typecheck`, `lint`, `test`, and `next build` to pass with zero errors.
- **Strict Performance & Ad-Safety Targets:**
  - Lighthouse scores **95+ Performance, 95+ Accessibility, 95+ Best Practices, 100 SEO** on mobile emulation.
  - Cumulative Layout Shift (**CLS < 0.05**), Total Blocking Time minimal, zero external heavy scripts before hydration.

---

## 6. Out of Scope (v1)

To protect domain reputation, Google AdSense approval, E-E-A-T trust, and zero-backend simplicity, the following are **explicitly excluded from v1**:
- **URL Shortener / Redirect Services:** Excluded to prevent spam, phishing abuse, Google Safe Browsing flags, AdSense bans, and database/redirect infrastructure overhead.
- **Off-Niche Developer Utilities (HTML/JS Beautifiers, JSON Formatters, etc.):** Excluded to preserve tight topical authority (Finance & BD Civic Utilities) and avoid high ad-blocker audiences with poor RPM.
- **Medical / Health YMYL Calculators (e.g., BMI, Calorie/Dosage):** Excluded to avoid Google's strict medical E-E-A-T scrutiny diluting a finance & daily utility domain.
- **Generic Zero-Click Global Converters (e.g., kg-to-lb, basic percentage math):** Excluded because Google answers these directly on the search results page, generating near-zero organic clicks and thin-content risk.
- **User Accounts, Authentication & Server-Side Storage:** No login, database, or server-side file uploads in v1; photo/signature resizing and PDF generation run strictly in the user's browser for total privacy.
- **Live Paid Exchange-Rate / Gold APIs (v1):** Use editable default reference presets in `rates.json` (with one-click user override) rather than paid API dependencies that add cost or failure points; optional free/cached sync may be considered in v2.

---

## 7. Summary of Strategic Scope Refinements

For clarity against the initial draft:
- **Removed contradictions & bloat:** Cut `Short URL Generator` (conflicted with Out of Scope & Static-First), `Unit Converter` (conflicted with Out of Scope), `HTML Beautifier`, `JavaScript Beautifier`, `BMI Calculator`, and standalone `Percentage Calculator`.
- **Eliminated keyword cannibalization:** Merged `EMI Calculator` + `Loan Calculator` into one authoritative BD Loan & EMI tool; integrated `Word & Character Counter` into the `Bijoy ⇄ Unicode & Bangla Text Toolkit`.
- **Upgraded generic tools into BD/NRB high-intent winners:** Transformed `Age Calculator` → **BD Govt Job / BCS 32-Year Eligibility Calculator**, `DPS` → **DPS & FDR (with PSR TDS & Excise Duty)**, `VAT` → **BD VAT/VDS/AIT**, `Discount` → **SME/F-Commerce Margin & COD Calculator**, and `Land Measurement` → **Land + Registration Cost Estimator**.
- **Added high-revenue & high-impact flagships:** Added **Remittance (2.5% Incentive) & Freelancer USD-to-BDT** (Tier-1 NRB + Affiliate powerhouse), **BD Electricity Bill (BERC)**, **Gold Vori/Ana/Rotti**, **bKash/Nagad/Rocket Charge**, **Zakat (BD & NRB)**, **BCS/Govt Job Photo & Signature Resizer**, and **SSC/HSC/Uni GPA & CGPA**.
- **Fixed numbering & phasing:** Standardized into **18 cohesive tools across 3 clear phases (6 tools per phase)** with bilingual (`EN / BN`) support prioritized early.

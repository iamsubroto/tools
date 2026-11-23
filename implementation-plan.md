# Implementation Plan

This document is the step-by-step engineering, SEO, monetization, and launch blueprint for executing [`project-scope.md`](./project-scope.md). It is structured specifically for **agentic CLI workflows** (Claude Code, Codex CLI, Antigravity CLI) so every sprint and tool can be implemented, tested, and shipped cleanly without architectural drift.

---

## 1. Tech Stack & Architecture Decisions

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 15+ (App Router, Static-First SSG) | Zero-latency HTML for SEO & AdSense crawlers; zero backend server cost. |
| **Language** | TypeScript (`strict: true`) | Prevents calculation & currency precision bugs across agent sessions. |
| **Styling** | Tailwind CSS + CSS Variables (Light/Dark) | Tiny CSS bundle, fast mobile rendering, consistent design tokens. |
| **Typography** | `Plus Jakarta Sans` (EN) + `Hind Siliguri` (BN) via `next/font/google` | Crisp Bangla rendering with zero layout shift (`display: "swap"`). |
| **Validation** | `zod` | Build-time validation of `src/data/rates.json` and safe URL query-param parsing. |
| **Testing** | Vitest (unit tests) + Playwright (critical E2E smoke tests) | Automated verification of every slab boundary, formula, and mobile viewport. |
| **Client-Side PDF / Image** | Native CSS `@media print` + HTML5 Canvas API (zero heavy PDF libs in Phase 1) | Keeps JS bundle tiny (<90KB gzipped) while giving clean print-to-PDF and instant private image resizing. |
| **Analytics** | Google Analytics 4 + Google Search Console (loaded `afterInteractive`) | Track tool engagement, affiliate clicks, and search query rankings without hurting LCP. |
| **Hosting** | Vercel or Cloudflare Pages (Free/Pro tier) | Global CDN edge caching for both Bangladesh and Tier-1 NRB visitors (US/UK/CA/AU/EU). |

---

## 2. Target Repository Structure

```text
D:\tools\
├── project-scope.md
├── implementation-plan.md
├── public/
│   ├── og/                         # Open Graph social preview images
│   ├── icons/                      # PWA / favicon assets
│   └── ads.txt                     # Added upon Google AdSense approval
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, theme, header, footer, analytics)
│   │   ├── page.tsx                # Homepage (instant search, category filter, featured tools)
│   │   ├── sitemap.ts              # Dynamic sitemap from tools.ts + guides
│   │   ├── robots.ts               # robots.txt rules
│   │   ├── (trust)/                # Mandatory AdSense E-E-A-T pages
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── privacy-policy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   ├── disclaimer/page.tsx
│   │   │   └── methodology/page.tsx
│   │   ├── guides/                 # High-intent reference hubs (Tax Slabs, Sanchayapatra, BERC)
│   │   │   └── [slug]/page.tsx
│   │   └── (tools)/                # 18 dedicated static SEO routes
│   │       ├── sanchayapatra-calculator/page.tsx
│   │       ├── bd-income-tax-calculator/page.tsx
│   │       ├── bd-salary-calculator/page.tsx
│   │       ├── emi-loan-calculator/page.tsx
│   │       ├── dps-fdr-calculator/page.tsx
│   │       ├── remittance-freelancer-calculator/page.tsx
│   │       └── ... (Phase 2 & 3 routes)
│   ├── config/
│   │   ├── site.ts                 # Site name, domain, social links, affiliate disclosure text
│   │   └── tools.ts                # Single Source of Truth registry for all 18 tools
│   ├── data/
│   │   ├── rates.json              # Centralized BD government/bank/utility rates & sources
│   │   └── rates.schema.ts         # Zod schema validating rates.json at build/test time
│   ├── i18n/
│   │   ├── LanguageContext.tsx     # Lightweight EN / BN client toggle (persisted in localStorage)
│   │   ├── en.json                 # Shared UI strings (English)
│   │   └── bn.json                 # Shared UI strings (Bangla)
│   ├── lib/
│   │   ├── formatters.ts           # South Asian ৳ formatting (1,00,000), BDT in-words (EN/BN)
│   │   ├── urlState.ts             # Encode/decode calculator inputs into URL query params
│   │   ├── schema.ts               # JSON-LD builders (WebApplication, FAQPage, BreadcrumbList)
│   │   ├── bijoy/                  # Bijoy ANSI <-> Unicode mapping engine (Phase 3)
│   │   └── calculators/            # Pure TypeScript calculation functions + unit tests
│   │       ├── types.ts            # Shared Insight, BreakdownRow, CalculatorResult types
│   │       ├── sanchayapatra.ts
│   │       ├── sanchayapatra.test.ts
│   │       ├── incomeTax.ts
│   │       ├── incomeTax.test.ts
│   │       └── ... (1 file + 1 test file per tool)
│   ├── content/
│   │   └── tools/                  # Rich SEO prose, worked examples & FAQs per tool (EN/BN)
│   └── components/
│       ├── layout/                 # Header, Footer, ThemeToggle, LanguageToggle, Breadcrumbs
│       ├── tool-shell/             # ToolLayout, ResultCard, SmartInsightsBox, ShareActionBar
│       ├── inputs/                 # CurrencyInput, PresetChips, SliderField, SegmentedTabs
│       ├── monetization/           # AdSlot (CLS-safe), AffiliateCard (disclosed)
│       └── seo/                    # JsonLd, RateSourceBadge, ToolGuideSection, RelatedTools
└── tests/
    └── e2e/                        # Playwright smoke tests (mobile layout, CLS, core flows)
```

---

## 3. Centralized `src/data/rates.json` Design & Maintenance Plan

Every regulated number MUST live in `src/data/rates.json` (never hardcoded inside UI components).

### Schema Blueprint
```json
{
  "meta": {
    "schemaVersion": "1.0.0",
    "lastGlobalAudit": "2026-11-22"
  },
  "incomeTax": {
    "fiscalYear": "FY 2025-26 / 2026-27",
    "lastUpdated": "2026-07-01",
    "officialSource": "National Board of Revenue (NBR) Bangladesh",
    "sourceUrl": "https://nbr.gov.bd",
    "thresholds": {
      "general": 400000,
      "femaleOrSenior65": 450000,
      "disabledOrThirdGender": 525000,
      "gazettedFreedomOrJulyFighter": 550000,
      "parentOfDisabledAddon": 50000
    },
    "slabs": [
      { "limit": 300000, "rate": 0.10 },
      { "limit": 400000, "rate": 0.15 },
      { "limit": 500000, "rate": 0.20 },
      { "limit": 2000000, "rate": 0.25 },
      { "limit": null, "rate": 0.30 }
    ],
    "minimumTax": {
      "dhakaChattogramCity": 5000,
      "otherCityCorporations": 4000,
      "outsideCity": 3000
    }
  },
  "sanchayapatra": {
    "lastUpdated": "2026-07-01",
    "reviewCadence": "Semi-annual (Jan & Jul)",
    "officialSource": "National Savings Directorate (NSD)",
    "sourceUrl": "https://nationalsavings.gov.bd",
    "slabCutoffBdt": 750000,
    "schemes": {
      "paribar": { "termYears": 5, "maxSingleLimit": 4500000, "tier1MaturityRate": 0.1193, "tier2MaturityRate": 0.1180 },
      "pensioner": { "termYears": 5, "maxSingleLimit": 5000000, "tier1MaturityRate": 0.1198, "tier2MaturityRate": 0.1180, "taxFreeLimit": 500000 }
    }
  },
  "bankExciseDuty": {
    "lastUpdated": "2026-07-01",
    "sourceTax": { "withPsr": 0.10, "withoutPsr": 0.15, "company": 0.20 },
    "slabs": [
      { "upTo": 400000, "duty": 0 },
      { "upTo": 500000, "duty": 150 },
      { "upTo": 1000000, "duty": 500 },
      { "upTo": 5000000, "duty": 3000 },
      { "upTo": 10000000, "duty": 5000 },
      { "upTo": 20000000, "duty": 10000 },
      { "upTo": 50000000, "duty": 20000 },
      { "upTo": null, "duty": 50000 }
    ]
  },
  "electricityBerc": {
    "lastUpdated": "2026-07-01",
    "officialSource": "Bangladesh Energy Regulatory Commission (BERC)",
    "lifelineMaxUnits": 50,
    "lifelineRate": 4.63,
    "demandChargePerKw": 42,
    "prepaidMeterRentSinglePhase": 40,
    "prepaidRebateRate": 0.005,
    "vatRate": 0.05,
    "slabs": [
      { "from": 1, "to": 75, "rate": 5.26 },
      { "from": 76, "to": 200, "rate": 8.50 },
      { "from": 201, "to": 300, "rate": 9.10 },
      { "from": 301, "to": 400, "rate": 9.62 },
      { "from": 401, "to": 600, "rate": 15.01 },
      { "from": 601, "to": null, "rate": 17.35 }
    ]
  },
  "remittance": {
    "govtIncentiveRate": 0.025,
    "defaultUsdToBdt": 122.0,
    "lastUpdated": "2026-11-22"
  },
  "govtJobAgeLimit": {
    "generalMaxYears": 32,
    "lastUpdated": "2026-01-01",
    "officialSource": "Government Service Maximum Age Limit Act"
  }
}
```
> **Note for Implementation:** Always verify the latest official gazette / NBR / NSD / BERC / BAJUS circulars right before production launch and update `rates.json` with exact effective dates.

### Recurring Maintenance Calendar
- **January 1 & July 1:** Verify Sanchayapatra semi-annual profit rates from National Savings Directorate.
- **June / July (Bangladesh National Budget):** Update Income Tax slabs, rebate rules, VAT rates, and Bank Excise Duty in `rates.json`.
- **Quarterly:** Audit MFS cash-out charges (bKash/Nagad/Rocket), BERC electricity notices, and reference gold/USD preset values.

---

## 4. Phased Build Roadmap

### Sprint 0 — Foundation, Design System & Core Platform (Days 1–4)
**Goal:** Stand up a rock-solid Next.js App Router scaffold with shared components, bilingual plumbing, trust pages, and automated testing so every subsequent tool takes hours—not days—to ship.

- [ ] **0.1 Project Initialization:** Bootstrap Next.js (App Router, TypeScript, Tailwind CSS, ESLint), configure Vitest + Testing Library + Playwright, and add npm scripts (`typecheck`, `lint`, `test`, `build`).
- [ ] **0.2 Design System & Mobile-First Shell:**
  - Configure `Plus Jakarta Sans` + `Hind Siliguri` fonts and Light/Dark CSS tokens (clean emerald/slate financial palette with high contrast WCAG AA).
  - Build `Header` (brand logo, quick search trigger, `EN / BN` toggle, theme toggle), `Footer` (trust links, financial disclaimer notice, category links), and `Breadcrumbs`.
- [ ] **0.3 Core Utility Libraries:**
  - `src/lib/formatters.ts`: South Asian number grouping (`formatBDT(150000)` → `৳1,50,000`), `numberToWordsEN` (Lakh/Crore), `numberToWordsBN` (`১ লক্ষ ৫০ হাজার টাকা`), and percentage/decimal helpers + full unit tests.
  - `src/lib/urlState.ts`: Safe query-param serialization/deserialization for shareable calculation links.
  - `src/lib/schema.ts`: Reusable JSON-LD builders (`WebApplication`, `FAQPage`, `BreadcrumbList`).
  - `src/data/rates.json` + `src/data/rates.schema.ts` + validation unit test.
- [ ] **0.4 Reusable Tool Shell & Monetization Components:**
  - `ToolLayout`: Two-column desktop / stacked mobile layout ensuring inputs & primary result stay **above the fold**.
  - `SmartInsightsBox`: Highlighted green/amber/blue tip banner rendering actionable savings/warning messages returned by each calculator.
  - `ShareActionBar`: One-click **Copy WhatsApp Summary**, **Copy Shareable Link**, **Print / Save PDF**, and **Reset**.
  - `RateSourceBadge`: Shows *"Verified Rates • Updated [Date] • Source: [Official Body]"*.
  - `AdSlot`: Reserved fixed-height (`min-h-[90px]` / `min-h-[250px]`) wrapper with `aria-label="Advertisement"`, graceful collapse/placeholder in dev, zero CLS, never placed adjacent to interactive CTA buttons.
  - `AffiliateCard`: Clean comparison card with mandatory `"Affiliate Disclosure"` notice and `rel="sponsored noopener noreferrer"` links + GA4 click event tracking.
- [ ] **0.5 Homepage & Mandatory Trust Pages:**
  - Build `src/config/tools.ts` registry.
  - Build Homepage with instant client-side search (matching English, Bangla & Banglish keywords), category filter pills, and Phase-1 live tools grid.
  - Author genuine, thorough **About Us**, **Methodology & Official Sources**, **Contact**, **Privacy Policy**, **Terms of Use**, and **Financial Disclaimer** pages (essential for AdSense approval!).
  - Implement dynamic `src/app/sitemap.ts` and `src/app/robots.ts`.

**Sprint 0 Exit Gate:** `npm run typecheck && npm test && npm run build` passes; Homepage + all 6 trust pages score 95+ on Lighthouse Mobile.

---

### Sprint 1 — Phase 1 Launch: Core High-RPM Finance, Tax & NRB Tools (Days 5–14)
**Goal:** Ship the 6 highest-RPM tools, verify accuracy with exhaustive unit tests, deploy to production domain, submit sitemap to Google Search Console, and apply for Google AdSense + affiliate programs.

1. **Tool 1: Sanchayapatra Profit & Tax Calculator (`/sanchayapatra-calculator`)**
   - **Logic (`sanchayapatra.ts`):** Support Paribar, Pensioner, 3-Month Profit-Bearing, and 5-Year Bangladesh Sanchayapatra; apply 2-tier cumulative slab (`≤৳7.5L` vs `>৳7.5L`); source tax rules (0% Pensioner ≤৳5L, 5%/10% applicable rates); year-wise premature encashment simulator; monthly/quarterly & total maturity payout.
   - **Smart Insights:** Alert user when crossing ৳7.5L slab or ৳5L Pensioner tax-free threshold; compare against Bank FDR net return.
   - **Tests:** Exact boundary tests at `৳5,00,000`, `৳5,00,001`, `৳7,50,000`, `৳7,50,001`, max investment caps, premature Year 1–4 exit.

2. **Tool 2: BD Income Tax Calculator (`/bd-income-tax-calculator`)**
   - **Logic (`incomeTax.ts`):** Taxpayer categories (General `৳4L`, Women/Senior 65+ `৳4.5L`, Disabled/Third-Gender `৳5.25L`, Freedom/July Fighters `৳5.5L`, Parent of disabled `+৳50k`); salary exemption rule; progressive slabs (10%→30%); allowable investment tax rebate calculator (comparing 3% of taxable income, 15% of actual investment, and ৳10L cap); area-based minimum tax; net payable after TDS.
   - **Smart Insights:** Show exact extra investment needed to maximize tax rebate; highlight minimum tax trigger and PSR compliance reminder.
   - **Tests:** Below threshold (`৳0` tax), exact slab boundaries, rebate capping, minimum tax override, negative/zero inputs.

3. **Tool 3: BD Salary, Take-Home & Gratuity Calculator (`/bd-salary-calculator`)**
   - **Logic (`salary.ts`):** Monthly Gross/Annual CTC split (Basic %, House Rent, Medical, Conveyance — customizable with BD corporate defaults); Provident Fund deduction; auto-link to `incomeTax.ts` for estimated monthly TDS; Festival Bonus (2× Basic) and Gratuity estimator (years of service × last basic).
   - **Smart Insights:** Show true annual compensation (Cash + PF + Bonus + Gratuity) and tax-saving investment suggestion.
   - **Tests:** Tax-free salary tier, high-bracket salary, zero PF/gratuity, custom split percentages summing ≠100% validation.

4. **Tool 4: EMI & Bank Loan Calculator (`/emi-loan-calculator`)**
   - **Logic (`emiLoan.ts`):** Standard reducing-balance EMI formula; BD loan presets (Home Loan, Car Loan, Personal Loan); full year-by-year & expandable month-by-month amortization schedule; **Extra Monthly / Lump-Sum Prepayment Simulator** calculating months saved & total interest saved; total cost visual bar (Principal vs Interest).
   - **Smart Insights:** Quantify exact Taka & months saved if the user prepays even 5%–10% extra per month.
   - **Tests:** 0% interest edge case, 1-month tenure, 25-year home loan, prepayment larger than balance, Lakh/Crore formatting.

5. **Tool 5: DPS & FDR Maturity Calculator (`/dps-fdr-calculator`)**
   - **Logic (`dpsFdr.ts`):** Dual-tab calculator (DPS Monthly Deposit & FDR Lump Sum); compounding frequency (monthly/quarterly/annual); **automatic BD Bank Excise Duty deduction** per annual balance peak; side-by-side **With PSR (10% TDS) vs Without PSR (15% TDS)** net maturity comparison.
   - **Smart Insights:** Prominently highlight `"Submitting your PSR to the bank saves you ৳X,XXX on this deposit"` + excise duty bracket awareness around `৳4,00,000` and `৳10,00,000`.
   - **Tests:** Balance at `৳4,00,000` (৳0 duty) vs `৳4,00,001` (৳150 duty), PSR vs Non-PSR delta, multi-year DPS accrual.

6. **Tool 6: Remittance (2.5% Incentive) & Freelancer USD-to-BDT Calculator (`/remittance-freelancer-calculator`)**
   - **Logic (`remittance.ts`):** Two modes:
     - *NRB Remittance Mode:* Send currency (`USD`, `GBP`, `EUR`, `CAD`, `AUD`, `SAR`, `AED`) → editable exchange rate, transfer fee, automatic **2.5% Bangladesh Govt Cash Incentive** toggle, net BDT received by family.
     - *BD Freelancer Mode:* Gross client invoice (`USD`) → platform fee presets (Upwork 10%, Fiverr 20%, Direct 0%) → withdrawal method fee (Payoneer 2%, Wise, Bank Wire SWIFT fee) → editable bank dollar encashment rate + incentive → net BDT take-home.
   - **Smart Insights:** Compare cost of hidden FX spread vs flat fee; display transparent `AffiliateCard` comparing **Wise, Remitly, TapTap Send, and Payoneer**.
   - **Tests:** Zero amount, incentive on vs off, multiple currencies, custom FX rates, fee exceeding transfer amount clamping.

7. **Sprint 1 Companion SEO Reference Guides (3 High-Intent Hub Pages):**
   - `/guides/bd-income-tax-slabs-guide` → funnels into Income Tax & Salary Calculators.
   - `/guides/sanchayapatra-profit-rates-bd` → funnels into Sanchayapatra & DPS/FDR Calculators.
   - `/guides/bd-remittance-incentive-freelancer-guide` → funnels into Remittance & Freelancer Calculator.

**Sprint 1 Exit Gate (Production Launch v1.0 & AdSense Application):**
- Deploy to custom domain on Vercel/Cloudflare with HTTPS + clean `www`/apex canonical redirect.
- Verify Search Console indexing for all 6 tools + 3 guides + 6 trust pages (15+ high-value indexed pages).
- Apply for **Google AdSense**, **Wise Partner**, **Remitly Affiliate**, and **Payoneer Partner** programs.

---

### Sprint 2 — Phase 2 Expansion: Daily Utilities, Property & Commerce (Days 15–26)
**Goal:** Launch the 6 high-volume daily utility, real-estate, and SME calculators to grow organic traffic rapidly and diversify RPM across Real Estate & B2B niches.

1. **Tool 7: BD Electricity Bill Calculator (`/electricity-bill-calculator-bd`)**
   - **Logic (`electricityBill.ts`):** Provider selector (DESCO, DPDC, NESCO, BPDB, WZPDCL, BREB/Palli Bidyut); Meter type (Postpaid vs Prepaid); Sanctioned load (kW); Monthly units (kWh); BERC lifeline rule (`≤50 units × ৳4.63`) vs full progressive slabs (`1–75` through `601+`); demand charge (`৳42/kW`), prepaid `৳40` meter rent & `0.5%` rebate, `5%` VAT; itemized slab-by-slab receipt table.
   - **Smart Insights:** Warn users close to 50 units (lifeline cliff) or 400 units (major rate jump from ৳9.62 to ৳15.01/unit) with exact savings tip!
   - **Tests:** `0`, `50`, `51`, `75`, `76`, `400`, `401`, `650` units; prepaid vs postpaid toggles.

2. **Tool 8: BD Land Measurement & Registration Cost Calculator (`/land-measurement-calculator-bd`)**
   - **Logic (`landMeasurement.ts`):**
     - *Converter Tab:* Live multi-unit table converting Shotok/Decimal (`435.6 sq ft`), Katha (`720 sq ft` standard + regional Bigha preset selector), Bigha, Acre, Sq Ft, Sq Meter, Gonda, Kora, Kranti, plus irregular 4-side plot area estimator (average-sides method with disclaimer).
     - *Registration Cost Tab:* Property deed value + location type (City Corp / Pourashava / Rural) → Stamp Duty, Registration Fee, Local Govt Tax, Source/Gain Tax & VAT breakdown (all rates driven from `rates.json`).
   - **Tests:** Exact conversion identity (`1 Acre = 100 Shotok = 43,560 Sq Ft`), round-trip precision, deed cost brackets.

3. **Tool 9: Gold Price (Vori / Ana / Rotti) & Jewelry Cost Calculator (`/gold-vori-calculator-bd`)**
   - **Logic (`goldVori.ts`):** Convert between Vori (`11.664g`), Ana (`16 Ana = 1 Vori`), Rotti (`6 Rotti = 1 Ana`), Point (`10 Point = 1 Rotti`), and Grams; Karat presets (`22K`, `21K`, `18K`, `Traditional`) with editable BDT/Vori BAJUS reference rate; add `5%` VAT + customizable making charge (per Vori or %); optional **Old Gold Exchange Calculator** (applying standard jewelers' wastage deduction % transparently).
   - **Smart Insights:** Show how much making charge + VAT adds to total cost and verify whether a jeweler's quoted total matches BAJUS math.
   - **Tests:** `1 Vori = 16 Ana = 96 Rotti = 960 Point = 11.664g`, fractional combinations, zero weight, old-gold exchange.

4. **Tool 10: bKash, Nagad & Rocket Charge Calculator (`/mfs-charge-calculator-bd`)**
   - **Logic (`mfsCharge.ts`):** Side-by-side comparison across bKash (Standard, Priyo Agent, ATM), Nagad (App, USSD), and Rocket (Agent, DBBL ATM); **Forward Mode** (cash-out fee & net cash received) + **Reverse Mode** (*"I want the receiver to get exact ৳10,000 in hand — how much should I send?"*).
   - **Smart Insights:** Highlight the cheapest cash-out option for that exact amount (e.g., Priyo Agent / Nagad App / ATM savings).
   - **Tests:** Reverse math accuracy (verifying forward(reverse(X)) ≥ X), Priyo monthly cap warnings, zero/small amounts.

5. **Tool 11: BD VAT, VDS & AIT Calculator (`/vat-ait-calculator-bd`)**
   - **Logic (`vatAit.ts`):** Add VAT (Exclusive → Inclusive) & Extract VAT (Inclusive → Base + VAT) with quick BD rate pills (`15%`, `10%`, `7.5%`, `5%`, `2%`, custom); optional **VDS & AIT Withholding Mode** for B2B invoices/tenders showing exact net payable to vendor vs treasury challan amounts.
   - **Tests:** Inclusive/exclusive round-trip exactness (`115` @ 15% inclusive → `100` base + `15` VAT), combined VAT + AIT order of calculation.

6. **Tool 12: SME & F-Commerce Profit Margin, COD & Discount Calculator (`/profit-margin-discount-calculator`)**
   - **Logic (`profitMargin.ts`):** Two focused tabs:
     - *F-Commerce / Order Profit:* Product cost, packaging, delivery fee (Inside/Outside Dhaka), COD charge %, return/cancellation rate %, Facebook ad cost per order, selling price → **True Net Profit, Profit Margin %, Markup %, and Break-Even ROAS**.
     - *Discount & Sale Price:* Original price, % or flat discount, optional promo stack → Final price & savings.
   - **Smart Insights:** Alert seller immediately if return rate + ad spend pushes real net margin below 10% or negative!
   - **Tests:** Negative margin warning, 0% return rate vs 15% return rate impact, break-even ROAS edge cases.

**Sprint 2 Exit Gate:** 12 live tools deployed, internal cross-linking updated across all calculators, Google Search Console indexing verified, initial AdSense RPM & CTR review completed.

---

### Sprint 3 — Phase 3 Viral Seasonal, Civic & Productivity Hub (Days 27–38)
**Goal:** Ship the remaining 6 high-volume seasonal, civic, student, and Bangla productivity tools to accelerate organic backlinks and word-of-mouth growth.

1. **Tool 13: Zakat Calculator (BD & NRB) (`/zakat-calculator-bd`)**
   - **Logic (`zakat.ts`):** Multi-currency (`BDT`, `USD`, `GBP`, `EUR`, `SAR`, `AED`); Nisab toggle (Silver `52.5 Vori / 612.36g` default conservative vs Gold `7.5 Vori / 87.48g`); itemized inputs (Cash, Bank/FDR, Sanchayapatra, Gold/Silver jewelry, Shares/Investments, Business Inventory, Money Owed to You) minus Deductible Short-Term Liabilities → `2.5%` Zakat Payable (or `৳0` if below Nisab).
   - **Smart Insights:** Clearly display Nisab threshold status and printable breakdown for personal record keeping.
   - **Tests:** Below Nisab (`0` payable), exact Nisab boundary, liabilities exceeding assets, currency switching.

2. **Tool 14: BD Govt Job, BCS & Passport Photo/Signature Resizer (`/bd-job-photo-signature-resizer`)**
   - **Logic (`imageResizer.ts` + Canvas UI):** 100% browser-side processing (prominent privacy badge: *"Your photo never leaves your device"*).
   - **One-Click Official Presets:**
     - BCS / Teletalk Govt Job Photo (`300 × 300 px`, JPEG, `< 100 KB`)
     - BCS / Teletalk Signature (`300 × 80 px`, JPEG, `< 60 KB`)
     - University Admission Photo (`300 × 300 px`, `< 50 KB`)
     - NID / e-Passport Reference Crop & Custom Size/KB target
   - **Algorithm:** Interactive pan/zoom aspect-locked crop + binary-search JPEG quality compression loop ensuring output file size is strictly under target KB while preserving maximum sharpness.
   - **Tests:** Unit tests for aspect-ratio crop math & KB compression loop + Playwright E2E upload-crop-download verification.

3. **Tool 15: Age & BD Govt Job / BCS Eligibility Calculator (`/age-govt-job-calculator-bd`)**
   - **Logic (`ageGovtJob.ts`):** Date of Birth + Target / Circular Reference Date (defaults to Today); exact calendar Years, Months, Days (handling leap years and variable month lengths accurately); total days/weeks lived; next birthday countdown; **BD Govt Job / BCS Eligibility Panel** checking against the statutory **32-year limit** (plus customizable max/min circular limits) and showing exact years/months/days remaining until max age cutoff.
   - **Tests:** Leap year DOB (`Feb 29`), exact 32-year birthday cutoff (eligible vs 1 day over), DOB > target date validation.

4. **Tool 16: SSC, HSC & University GPA / CGPA Calculator (`/gpa-cgpa-calculator-bd`)**
   - **Logic (`gpaCgpa.ts`):**
     - *SSC / HSC Tab (5.00 Scale):* Subject-wise marks or letter grades (`A+` to `F`), automatic **4th / Optional Subject Bonus Rule** (`max(0, optionalGP - 2.0)` added before dividing by compulsory subject count, capped at `5.00`), fail-in-compulsory detection.
     - *University CGPA Tab (4.00 Scale):* Dynamic course rows (Credits + Grade/Marks using BD UGC standard scale), semester GPA, cumulative CGPA (with previous completed credits & CGPA), and **Target CGPA Planner** ("What GPA do I need next semester to reach 3.50?").
   - **Tests:** Optional subject `A+` (`+3.0` bonus capped at `5.00`), optional subject `C` (`0` bonus), F grade in compulsory subject (`GPA 0.00`), target CGPA impossible (`>4.00`) detection.

5. **Tool 17: SIP, Compound Interest & Inflation Goal Calculator (`/sip-investment-calculator`)**
   - **Logic (`sipInvestment.ts`):** Monthly SIP + optional Initial Lump Sum + annual Step-Up % + expected annual return % + **expected inflation rate %** → Total Invested, Wealth Gained, Nominal Future Value, and **Inflation-Adjusted Today's Value** + year-by-year growth schedule. Supports BDT/USD/GBP.
   - **Smart Insights:** Highlight power of starting 5 years earlier and real vs nominal purchasing power.
   - **Tests:** 0% return, 0% inflation, step-up compounding, goal-reverse mode accuracy.

6. **Tool 18: Bijoy ⇄ Unicode Converter & Bangla Text Toolkit (`/bijoy-to-unicode-converter`)**
   - **Logic (`bijoyConverter.ts` + `textStats.ts`):** Bidirectional Bijoy ANSI (SutonnyMJ) → Unicode (Avro/Standard Bangla) AND Unicode → Bijoy conversion handling pre-base vowels (`ি`, `ে`, `ৈ`), reph (`র্`), kar reordering, and common broken conjuncts; one-click Copy, Clear, Swap; **integrated live Bangla + English Word Counter, Character Counter (with/without spaces), Sentence Count, and Bangla/English SMS Segment Counter**.
   - **Tests:** Comprehensive regression suite of 30+ tricky Bangla conjuncts, kar reorderings, numbers (`০-৯`), punctuation (`।`), and round-trip fidelity checks.

**Sprint 3 Exit Gate:** All 18 tools live, 100% unit-test passing, E2E smoke tests passing on mobile + desktop viewports, all Bangla (`BN`) UI strings completed.

---

### Sprint 4 — Revenue Optimization, Bilingual SEO & Growth Loop (Ongoing Post-Launch)
- [ ] **4.1 AdSense & RPM Optimization (Data-Driven after 30 Days):**
  - Review Google Analytics + AdSense RPM per URL; identify top 5 highest-RPM tools and expand their FAQ & comparison guides.
  - A/B test ad placement viewability while strictly protecting **CLS < 0.05** and mobile UX speed.
  - Add `/ads.txt` and ensure GDPR/consent banner compliance for EU/UK NRB visitors (required by Google AdSense!).
- [ ] **4.2 Affiliate & Conversion Tracking:**
  - Instrument GA4 custom events: `tool_calculate`, `copy_summary`, `share_link`, `print_pdf`, `affiliate_click` (labeled by tool + partner).
  - Refine contextual `AffiliateCard` copy on Remittance/Freelancer & SME Margin calculators based on actual CTR.
- [ ] **4.3 Seasonal SEO Content Calendar (Bangladesh & NRB Spikes):**
  - **February–March (Ramadan):** Promote & refresh Zakat Calculator + Gold/Silver Nisab rates.
  - **June–July (National Budget):** Publish Day-1 updates to `rates.json` (Income Tax, VAT, Excise Duty, Sanchayapatra) — being the *first accurate calculator* after budget speech wins massive news/social backlinks!
  - **September–November (Tax Return Season):** Refresh Income Tax & Salary guides and FAQs.
  - **Result Days & BCS Circulars:** Share GPA/CGPA, BCS Age 32-Year Checker, and Photo/Signature Resizer updates across relevant student/career communities.

---

## 5. Google AdSense Approval & Monetization Checklist

Before submitting to Google AdSense (at end of Sprint 1):
- [ ] Custom top-level domain connected with valid SSL (`https://`).
- [ ] Minimum **15+ substantive, indexed pages** (6 Phase-1 Tools + 3 Reference Guides + 6 Trust Pages).
- [ ] Every tool page contains **500–800+ words** of genuinely original, well-structured explanation, official rate tables, worked Bangladesh examples, and FAQs below the calculator (zero AI-slop filler, zero thin content).
- [ ] Zero broken links, zero placeholder `"Coming Soon"` pages exposed in navigation or `sitemap.xml` (only publish tools to `sitemap.ts` when `status: "live"`!).
- [ ] Clean mobile navigation, visible Footer links to Privacy Policy, Disclaimer, About, and Contact.
- [ ] Consent Management Platform (Google Funding Choices / CMP) enabled for EEA/UK NRB visitors before serving personalized ads.

---

## 6. Agentic CLI Execution Protocol (Per-Tool Definition of Done)

Whenever invoking **Claude Code**, **Codex CLI**, or **Antigravity CLI** to build a tool, enforce this exact contract:

1. **Read First:** Inspect `src/config/tools.ts`, `src/data/rates.json`, `src/lib/calculators/types.ts`, and one reference completed tool before writing code.
2. **Pure Logic First:** Implement `src/lib/calculators/<name>.ts` (consuming `rates.json`, returning typed result + breakdown + `smartInsights`) and `src/lib/calculators/<name>.test.ts`.
3. **Verify Logic:** Run `npm test -- <name>.test.ts` and confirm all boundary/edge cases pass.
4. **Build UI & Content:** Implement the client calculator component using shared inputs + `ToolLayout`, `SmartInsightsBox`, `ShareActionBar`, `RateSourceBadge`, and fixed-height `AdSlot`s; add rich SEO prose, worked example, FAQs, and JSON-LD in the `page.tsx` Server Component.
5. **Register & Localize:** Mark tool `status: "live"` in `src/config/tools.ts` and add EN/BN labels to `src/i18n/en.json` & `src/i18n/bn.json`.
6. **Mandatory Quality Gate:**
   ```bash
   npm run typecheck && npm run lint && npm test && npm run build
   ```
   A tool is **not complete** until all four checks pass cleanly with zero warnings/errors and mobile rendering is verified.

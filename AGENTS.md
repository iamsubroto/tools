<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tools BD — Project Engineering Rules (`AGENTS.md`)

**Brand:** Tools BD (`src/config/site.ts`, domain via `NEXT_PUBLIC_SITE_URL`)
**Mission:** Fast, accurate, 100% free, zero-signup calculators and practical utilities for **Bangladesh & Non-Resident Bangladeshis (NRBs)**—engineered for top organic SEO, high-RPM AdSense & ethical affiliate monetization, and genuine real-world usefulness.
**Languages:** **English (default) + Bangla (`EN / BN`) toggle from Phase 1.**
**Reference Docs:** See `project-scope.md` (product & revenue strategy) and `implementation-plan.md` (architecture & sprint execution).

---

## 1. Next.js 16+ Standards & Server-First Architecture

1. **Default to React Server Components (RSC):**
   - `layout.tsx`, every `page.tsx`, SEO content guides, rate tables, FAQ sections, `RateSourceBadge`, `Breadcrumbs`, `RelatedTools`, `JsonLd`, and all trust pages (`/about`, `/privacy-policy`, `/terms`, `/disclaimer`, `/contact`, `/methodology`) **MUST remain Server Components**.
   - **NEVER** add `"use client"` to `page.tsx`, `layout.tsx`, or static informational sections.
   - Use native HTML `<details>` / `<summary>` for FAQs and collapsible breakdowns so they require **zero client JavaScript**.
2. **Isolate Client Components to Interactive Leaves:**
   - Only mark the smallest interactive boundary with `"use client"` (e.g., `<SanchayapatraCalculatorClient />`, `<ThemeToggle />`, `<LanguageToggle />`, `<ShareActionBar />`, `<HomepageSearch />`).
   - Load static data (`src/data/rates.json`, tool metadata, SEO copy) in the Server Component and pass only serializable props down to Client leaves.
3. **Follow Next.js 16.4+ Conventions (`node_modules/next/dist/docs/`):**
   - Respect `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts`; keep all tool pages statically prerenderable (`○ Static`) with no unguarded dynamic request APIs (`cookies()`, `headers()`) in static routes.
   - Use typed `LayoutProps` / `PageProps` and App Router metadata conventions (`export const metadata: Metadata` or `generateMetadata`, `src/app/sitemap.ts`, `src/app/robots.ts`).
   - Use `next/font/google` for fonts (`Plus Jakarta Sans` + `Hind Siliguri`, `display: "swap"`), `next/image` for raster images, and `next/script` (`strategy="afterInteractive"` or `"lazyOnload"`) for analytics/ads.
4. **Static-First, Zero-Backend Privacy:**
   - All tools run **100% in the browser**—no login, no database, no server-side file uploads. Photo/signature resizing uses HTML5 Canvas; PDF export uses clean `@media print` stylesheets.

---

## 2. Library Standards & Best Practices

Always verify current library APIs via **Context7 MCP** (and `node_modules/next/dist/docs/` for Next.js) before writing unfamiliar code.

- **React 19:**
  - Compute calculator outputs **synchronously** from state (or via `useMemo` for heavy loops like amortization schedules)—**never** use `useEffect` to sync derived calculation results into state.
  - Use `useId()` for accessible form label/input bindings; keep components small, pure, and composable.
- **TypeScript (`strict: true`):**
  - Zero `any` and zero `@ts-ignore`.
  - All calculator functions in `src/lib/calculators/<tool>.ts` must have explicit input/output interfaces extending shared types in `src/lib/calculators/types.ts` (including `smartInsights: Insight[]`).
- **UI & Styling (`@radix-ui/themes` + Tailwind CSS v4 `@tailwindcss/turbopack`):**
  - Use **`@radix-ui/themes`** (`Theme` provider in `src/app/layout.tsx`, `Card`, `Badge`, `Button`, `TextField`, `Table`, `Callout`, `SegmentedControl`, `Separator`, `Tooltip`, etc.) as the primary component design system so the UI looks crisp, editorial, and authentic—never generic AI-slop gradients or over-stylized cards.
  - Pair `@radix-ui/themes` with **Tailwind CSS v4** (`@theme inline` in `src/app/globals.css`, no legacy `tailwind.config.js`) for responsive grid/flex layout, spacing, and print rules.
  - Keep Radix `<Theme>` as the root wrapper inside `layout.tsx` (Next.js App Router preserves Server Component children inside client providers); do **not** put `"use client"` on `page.tsx` or static sections.
  - Write mobile-first classes (`base` → `sm:` → `md:` → `lg:`); maintain WCAG AA contrast in both Light (default) and Dark themes.
  - Provide `@media print` utility styles to hide nav/ads/buttons and produce clean printable financial summaries.
- **Zod:**
  - Validate `src/data/rates.json` with `src/data/rates.schema.ts` during tests/build.
  - Validate and clamp all URL query parameters parsed in `src/lib/urlState.ts` so malformed shared links never crash a page.
- **Data & Pure Logic Separation:**
  - **Never** hardcode statutory rates (NBR tax slabs, Sanchayapatra rates, BERC electricity tariffs, Bank Excise Duty, MFS fees, BAJUS gold presets, 32-year govt job age limit) inside UI components. Store all rates in `src/data/rates.json` with `lastUpdated`, `effectiveFrom`, and `officialSourceUrl`.
  - Keep all math/business rules in pure, side-effect-free TypeScript modules under `src/lib/calculators/`.
- **Minimal Dependencies:**
  - Avoid heavy charting/PDF/utility libraries (no Moment.js, Lodash, or multi-MB PDF engines in core bundles). Prefer native `Intl`, CSS breakdown bars, inline/tree-shakable SVG icons (`lucide-react`), and native Canvas/print APIs.
- **Testing (Vitest + Playwright):**
  - Every `src/lib/calculators/<tool>.ts` MUST have a co-located `<tool>.test.ts` testing nominal cases, zero/empty values, negative/invalid clamping, and exact slab boundaries (e.g., `50` vs `51` electricity units, `৳4,00,000` vs `৳4,00,001` tax/excise, `৳7,50,000` vs `৳7,50,001` Sanchayapatra).

---

## 3. Mandatory SEO Rules (Every Tool Page)

No tool is complete until **all** SEO requirements below are satisfied:

1. **Single Registry (`src/config/tools.ts`):** Every tool is registered with `slug`, `category`, `phase`, `status` (`"live" | "planned"`), EN/BN titles, search keywords (including Banglish like `"biddut bill"`, `"jomi"`, `"sanchaypatra"`), and related tool slugs. Only `status: "live"` routes are emitted in `src/app/sitemap.ts` (never expose thin "Coming Soon" pages to Google).
2. **Unique Metadata:** Every tool `page.tsx` exports unique `title` (`<Tool Name> — Tools BD`), `description` (140–160 chars, action-oriented), `alternates.canonical`, `openGraph`, and `twitter` metadata.
3. **Server-Rendered JSON-LD:** Every tool page injects valid `<script type="application/ld+json">` for:
   - `WebApplication` (`applicationCategory: "FinanceApplication" | "UtilitiesApplication"`, `isAccessibleForFree: true`)
   - `FAQPage` (matching the visible FAQ items exactly)
   - `BreadcrumbList` (`Home → Category → Tool`)
4. **Rich Below-the-Fold Helpful Content (Anti-Thin-Content for AdSense):**
   - Server-rendered **500–800+ words** of genuinely useful, original content per tool:
     1. Plain-language overview & who it helps
     2. Official rate/slab table hydrated dynamically from `src/data/rates.json` + `RateSourceBadge`
     3. Formula & step-by-step worked Bangladesh example
     4. 4–6 targeted FAQs (addressing English & Bangla user queries)
     5. `RelatedTools` internal link cards
5. **Semantic HTML:** Exactly one `<h1>` per page, logical `<h2>`/`<h3>` hierarchy, semantic `<main>`, `<section>`, `<article>`, and descriptive anchor text.

---

## 4. Mobile-First Design & UX Standards

1. **Design for `360px–390px` Budget Android Phones First:** Stack inputs and primary result cleanly so users see inputs + live answer **above the fold** without excessive scrolling.
2. **Touch & Input Ergonomics:**
   - Minimum `44×44px` tap targets on all buttons, chips, and tabs.
   - Use `inputMode="decimal"` or `inputMode="numeric"` on number fields; include quick-fill preset chips (`৳1L`, `৳5L`, `৳10L`), inline validation, and a one-click **Reset** button.
3. **Localized Formatting & Bilingual (`EN / BN`):**
   - Format BDT with South Asian Lakh/Crore grouping (`৳1,00,000`) via `src/lib/formatters.ts`, with English & Bangla **"In Words"** display for major financial outputs.
   - Keep UI strings in `src/i18n/en.json` and `src/i18n/bn.json` so the `EN / BN` toggle works seamlessly across every tool.
4. **People-First Utility Features:**
   - Include a **`SmartInsightsBox`** on financial/utility calculators (e.g., PSR 10% vs 15% TDS savings, 50-unit electricity lifeline cliff, ৳7.5L Sanchayapatra slab shift, loan prepayment interest savings).
   - Provide `ShareActionBar`: **Copy WhatsApp Summary**, **Copy Shareable Link** (URL query state), and **Print / Save PDF**.

---

## 5. Fast Load, Core Web Vitals & Ad-Safe Layout

1. **Performance Budgets:**
   - Lighthouse Mobile targets: **Performance ≥ 95**, **Accessibility ≥ 95**, **Best Practices ≥ 95**, **SEO = 100**.
   - **CLS < 0.05**, fast LCP, minimal client JS (lazy-load heavy client-only widgets like Canvas cropper or Bijoy conversion tables via `next/dynamic` only on their own routes).
2. **AdSense & Affiliate Compliance:**
   - Every `AdSlot` must reserve fixed height (`min-h-[90px]` / `min-h-[250px]`) to guarantee zero layout shift and keep generous spacing away from inputs/action buttons to prevent accidental clicks.
   - Every `AffiliateCard` (e.g., Wise, Remitly, TapTap Send, Payoneer on Remittance/Freelancer tools) must show a clear **Affiliate Disclosure** and use `rel="sponsored noopener noreferrer"`.
   - Never gate or paywall core calculator outputs.

---

## 6. Canonical Tool List (Hybrid: `notes.txt` + Top BD Additions)

Tools are built in phased order balancing **revenue (AdSense RPM + Affiliates)**, **BD + NRB demand**, and **everyday utility**.

### Phase 1 — High-RPM BD Finance, Tax & NRB Core (6 Tools)
1. **Sanchayapatra Calculator** — `/sanchayapatra-calculator` *(from `notes.txt`)*
2. **Income Tax Calculator (BD)** — `/bd-income-tax-calculator` *(from `notes.txt`)*
3. **Salary & Take-Home Calculator (BD)** — `/bd-salary-calculator` *(from `notes.txt`)*
4. **EMI & Bank Loan Calculator (BD)** — `/emi-loan-calculator` *(unifies EMI + Loan from `notes.txt`; add `/loan-calculator` redirect or dedicated preset view if needed without duplicate thin content)*
5. **DPS & FDR Maturity Calculator (BD)** — `/dps-fdr-calculator` *(upgraded from DPS in `notes.txt` with PSR 10%/15% TDS & Excise Duty)*
6. **Remittance (2.5% Incentive) & Freelancer USD-to-BDT Calculator** — `/remittance-freelancer-calculator` *(Top BD/NRB revenue addition)*

### Phase 2 — High-Traffic BD Daily Utilities, Property & Commerce (7 Tools)
7. **BD Electricity Bill Calculator (BERC / DESCO / DPDC / Palli Bidyut)** — `/electricity-bill-calculator-bd` *(Top BD addition)*
8. **Land Measurement & Registration Cost Calculator (BD)** — `/land-measurement-calculator-bd` *(from `notes.txt` + Deed Cost)*
9. **Gold Price (Vori / Ana / Rotti) & Jewelry Cost Calculator** — `/gold-vori-calculator-bd` *(Top BD addition)*
10. **bKash, Nagad & Rocket Charge Calculator** — `/mfs-charge-calculator-bd` *(Top BD addition)*
11. **VAT, VDS & AIT Calculator (BD)** — `/vat-ait-calculator-bd` *(from `notes.txt`)*
12. **Discount & SME / F-Commerce Profit Margin Calculator** — `/discount-margin-calculator` *(upgraded from Discount in `notes.txt`)*
13. **SIP & Compound Investment Calculator** — `/sip-calculator` *(from `notes.txt`)*

### Phase 3 — Civic, Student, Bangla & Everyday Utilities (9 Tools)
14. **Age & BD Govt Job / BCS (32-Year) Eligibility Calculator** — `/age-calculator` *(upgraded from Age in `notes.txt`)*
15. **BD Govt Job, BCS & Passport Photo/Signature Resizer (Client-Side)** — `/bd-job-photo-signature-resizer` *(Top BD addition)*
16. **Zakat Calculator (BD & NRB)** — `/zakat-calculator-bd` *(Top BD addition)*
17. **SSC, HSC & University GPA / CGPA Calculator (BD)** — `/gpa-cgpa-calculator-bd` *(Top BD addition)*
18. **Bijoy ⇄ Unicode Converter** — `/bijoy-to-unicode-converter` *(from `notes.txt`)*
19. **Word & Character Counter (Bangla + English)** — `/word-character-counter` *(from `notes.txt`)*
20. **Percentage Calculator** — `/percentage-calculator` *(from `notes.txt` — include practical BD/finance presets to avoid thin content)*
21. **Unit Converter (BD + Standard)** — `/unit-converter` *(from `notes.txt` — prioritize local + engineering units with rich guides)*
22. **BMI Calculator** — `/bmi-calculator` *(from `notes.txt` — include prominent non-medical disclaimer)*
23. **HTML & JavaScript Beautifier (Client-Side)** — `/code-beautifier` *(or separate `/html-beautifier` & `/javascript-beautifier` from `notes.txt`; dynamically import formatter only on click so zero bundle impact elsewhere)*

> **Explicit Exclusion (`Short URL Generator` from `notes.txt`):** Do **NOT** build a URL shortener/redirect service on the main Tools BD domain. It requires a backend database/redirect server and carries severe spam/phishing domain-blacklisting and Google AdSense ban risks. If requested later, it must live on a separate isolated domain and backend.

---

## 7. Security, Workflow & Verification Gate

- **Secrets Hygiene:** Never commit API keys, tokens, or `.env.local` files. Keep `notes.txt` out of git commits (and ensure no secrets remain in tracked files).
- **Windows Shell Note:** In Windows PowerShell where `.ps1` scripts are restricted, run `npm.cmd` and `npx.cmd`.
- **Mandatory Definition of Done (Every PR / Tool):**
  ```powershell
  npm.cmd run lint; npm.cmd run build
  ```
  *(Once Vitest & `typecheck` scripts are added in Sprint 0, require `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build` to all pass with zero errors before marking any task complete.)*

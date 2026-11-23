# Tools BD — Project Rules

**Brand:** Tools BD (`src/config/site.ts`, domain via `NEXT_PUBLIC_SITE_URL`) — free, browser-only calculators for Bangladesh & NRBs in **English (default) + Bangla (`EN / BN`)**.
**Docs:** Tool registry is `src/config/tools.ts`; strategy & sprint details live in `project-scope.md` and `implementation-plan.md`.

## 1. Next.js 16 & Server-First Rules
- Keep `layout.tsx`, every `page.tsx`, SEO guides, rate tables, `<details>` FAQs, `JsonLd`, `AdSlot`, `ToolCard`, `Header`, and `Footer` as **Server Components**.
- Isolate `"use client"` to minimal interactive leaves (`*CalculatorClient`, `ToolDirectory`, `ThemeToggle`, `LanguageToggle`). Pass serializable props from Server Components.
- Respect `cacheComponents: true` & `partialPrefetching: true` (`next.config.ts`): keep all routes `○ Static` (no `new Date()`, `cookies()`, or `headers()` in static Server Components).
- Use `LayoutProps`/`PageProps`, `Metadata`, `next/font/google` (`Plus Jakarta Sans` + `Hind Siliguri`), `next/image`, and `next/script` (`afterInteractive`/`lazyOnload`).
- 100% browser-side, zero-backend privacy (HTML5 Canvas for image tools, `@media print` for PDF).

## 2. Stack & UI Conventions
- **Verify APIs:** Check Context7 MCP and `node_modules/next/dist/docs/` before writing unfamiliar library code.
- **React 19 & TypeScript (`strict: true`):** Zero `any`/`@ts-ignore`. Compute derived results synchronously (`useMemo` if heavy)—never `setState` inside `useEffect`. Use `useSyncExternalStore` for `localStorage`/external subscriptions.
- **Tailwind CSS v4 + `lucide-react`:** No themed UI kits (Radix Themes/MUI). Tokens live in `src/app/globals.css` (`@theme inline`, `@custom-variant dark (&:where(.dark, .dark *))`). Palette: `slate` neutrals, `emerald-600` accent, `rounded-2xl border border-slate-200` white cards, `tabular-nums` for numbers, no flashy gradients/emojis.
- **Category Icons & Homepage:** Define category color classes as *literal* strings in `CATEGORIES` (`src/config/tools.ts`) rendered via `<ToolIcon>`. Homepage (`/`) is a searchable tool directory; `live` tools link to `/<slug>`, `planned` tools render as disabled "Coming soon" cards.
- **Data & Pure Logic:** Never hardcode statutory rates in UI—store them in `src/data/rates.json` (validated via `src/data/rates.schema.ts` with `lastUpdated` & `officialSourceUrl`). Put math in pure `src/lib/calculators/<tool>.ts` returning `smartInsights` and test edge/slab boundaries in co-located `<tool>.test.ts`.
- **Minimal Dependencies:** Avoid Moment, Lodash, and heavy chart/PDF libraries; use native `Intl`, CSS bars, `src/lib/formatters.ts` (South Asian Lakh/Crore `৳1,00,000` + EN/BN in-words), and `next/dynamic` for heavy route-only widgets.

## 3. Mandatory Per-Tool SEO, UX & Monetization
- **Registry & Sitemap:** Register every tool in `src/config/tools.ts` with `icon`, EN/BN titles, and Banglish keywords. Only `status: "live"` routes appear in `src/app/sitemap.ts`.
- **Metadata & JSON-LD:** Unique `title`, `description` (140–160 chars), `alternates.canonical`, `openGraph`, `twitter`, plus server-rendered `WebApplication`, `FAQPage`, and `BreadcrumbList` JSON-LD.
- **Content & Mobile UX:** Mobile-first (`360px+`), `≥40px` tap targets, `inputMode="numeric"|"decimal"`, presets, Copy/Share/Print/Reset, plus 500–800w server-rendered guide (official rate table, worked BD example, `<details>` FAQs, `RelatedTools`).
- **Ad-Safe & Scope Guardrail:** Fixed-height `AdSlot` (`CLS < 0.05`), disclosed `rel="sponsored noopener noreferrer"` affiliates, Lighthouse Mobile ≥ 95 / SEO 100. **Never** build a URL shortener on this domain.

## 4. Verification Gate (Required Before Done)
- Never commit secrets or `notes.txt`. On Windows PowerShell use `npm.cmd` / `npx.cmd`.
- All four must pass with zero errors:
  ```powershell
  npm.cmd run typecheck; npm.cmd run lint; npm.cmd test; npm.cmd run build
  ```

"use client";

import { useId, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Info,
  Link2,
  Printer,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { SanchayapatraConfig } from "@/data/rates.schema";
import {
  calculateAllSanchayapatra,
  type SanchayapatraSchemeResult,
} from "@/lib/calculators/sanchayapatra";
import {
  formatBDT,
  formatBDTInWords,
  formatPercent,
  formatSouthAsianNumber,
  toBanglaDigits,
} from "@/lib/formatters";
import { useLanguage, type Locale } from "@/i18n/LanguageContext";

interface Props {
  config: SanchayapatraConfig;
}

const DEFAULT_AMOUNT = 500000;
const MAX_AMOUNT = 100_000_000;

const PRESETS = [
  { value: 100000, en: "1 Lakh", bn: "১ লক্ষ" },
  { value: 500000, en: "5 Lakh", bn: "৫ লক্ষ" },
  { value: 750000, en: "7.5 Lakh", bn: "৭.৫ লক্ষ" },
  { value: 1000000, en: "10 Lakh", bn: "১০ লক্ষ" },
  { value: 2000000, en: "20 Lakh", bn: "২০ লক্ষ" },
  { value: 3000000, en: "30 Lakh", bn: "৩০ লক্ষ" },
];

function parseAmount(raw: string): number {
  const digits = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_AMOUNT);
}

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";

const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

export function SanchayapatraCalculatorClient({ config }: Props) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const fmt = (v: number) => formatBDT(v, { decimals: 0, locale });

  const amountId = useId();
  const existingId = useId();
  const switchLabelId = useId();

  const [amount, setAmount] = useState<number>(DEFAULT_AMOUNT);
  const [hasExisting, setHasExisting] = useState(false);
  const [existing, setExisting] = useState<number>(0);
  const [copied, setCopied] = useState<"summary" | "link" | null>(null);

  const existingHoldings = hasExisting ? existing : 0;

  const result = useMemo(
    () =>
      calculateAllSanchayapatra(
        { investmentAmount: amount, existingHoldings },
        config
      ),
    [amount, existingHoldings, config]
  );

  const maxMonthly = Math.max(...result.schemes.map((s) => s.netMonthly), 1);
  const lowTax = result.cumulativeTotal <= config.taxCutoffBdt;

  const flashCopied = (kind: "summary" | "link") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleCopySummary = async () => {
    const lines = [
      "Sanchayapatra Profit Summary — Tools BD",
      `Investment: ${formatBDT(result.investmentAmount)}`,
      ...(result.existingHoldings > 0
        ? [`Existing holdings: ${formatBDT(result.existingHoldings)} (total ${formatBDT(result.cumulativeTotal)})`]
        : []),
      "",
      ...result.schemes.map((s) => {
        const head = `• ${s.nameEn} — ${(s.annualRate * 100).toFixed(2)}%, ${(s.taxRate * 100).toFixed(0)}% tax`;
        if (s.payoutFrequency === "quarterly") {
          return `${head}\n   ${formatBDT(s.netQuarterly)} every 3 months (≈ ${formatBDT(s.netMonthly)}/month)`;
        }
        if (s.payoutFrequency === "maturity") {
          return `${head}\n   ${formatBDT(s.totalNetProfit)} at maturity (≈ ${formatBDT(s.netMonthly)}/month)`;
        }
        return `${head}\n   ${formatBDT(s.netMonthly)} per month`;
      }),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      flashCopied("summary");
    } catch {
      // Clipboard unavailable
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("amount", String(amount));
      if (existingHoldings > 0) url.searchParams.set("existing", String(existingHoldings));
      else url.searchParams.delete("existing");
      await navigator.clipboard.writeText(url.toString());
      flashCopied("link");
    } catch {
      // Clipboard unavailable
    }
  };

  const handleReset = () => {
    setAmount(DEFAULT_AMOUNT);
    setHasExisting(false);
    setExisting(0);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      {/* ── Input Panel ─────────────────────────────── */}
      <aside className="lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          <label
            htmlFor={amountId}
            className="text-sm font-semibold text-slate-900 dark:text-white"
          >
            {t("Investment amount", "বিনিয়োগের পরিমাণ")}
          </label>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t(
              "Enter how much you want to invest",
              "কত টাকা বিনিয়োগ করতে চান লিখুন"
            )}
          </p>

          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">
              ৳
            </span>
            <input
              id={amountId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={amount > 0 ? formatSouthAsianNumber(amount) : ""}
              onChange={(e) => setAmount(parseAmount(e.target.value))}
              placeholder="5,00,000"
              className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-2xl font-bold tabular-nums tracking-tight text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <p className="mt-2 min-h-[1.25rem] text-[13px] text-slate-500 dark:text-slate-400">
            {amount > 0 ? formatBDTInWords(amount, locale) : t("Enter an amount", "পরিমাণ লিখুন")}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const active = amount === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setAmount(p.value)}
                  aria-pressed={active}
                  className={`h-10 rounded-lg border text-[13px] font-semibold tabular-nums transition-colors ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  ৳{isBn ? p.bn : p.en}
                </button>
              );
            })}
          </div>

          {/* Existing holdings */}
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id={switchLabelId} className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("I already own Sanchayapatra", "আগে থেকেই সঞ্চয়পত্র আছে")}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t(
                    "Tax & rate slabs use your total holdings",
                    "কর ও মুনাফার স্ল্যাব মোট বিনিয়োগের ওপর নির্ভর করে"
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={hasExisting}
                aria-labelledby={switchLabelId}
                onClick={() => setHasExisting((v) => !v)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  hasExisting ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    hasExisting ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {hasExisting && (
              <div className="mt-3">
                <label htmlFor={existingId} className="sr-only">
                  {t("Existing holdings amount", "পূর্বের সঞ্চয়পত্রের পরিমাণ")}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                    ৳
                  </span>
                  <input
                    id={existingId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={existing > 0 ? formatSouthAsianNumber(existing) : ""}
                    onChange={(e) => setExisting(parseAmount(e.target.value))}
                    placeholder={t("Existing amount", "পূর্বের পরিমাণ")}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-[15px] font-semibold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Applied rules */}
          <dl className="mt-5 space-y-2.5 rounded-xl bg-slate-50 p-4 text-[13px] dark:bg-slate-800/60">
            {hasExisting && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{t("Total holdings", "মোট বিনিয়োগ")}</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {fmt(result.cumulativeTotal)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">{t("Profit slab", "মুনাফার স্ল্যাব")}</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">
                {result.appliedTier === "tier1"
                  ? t("Up to ৳7.5 Lakh", "৭.৫ লক্ষ পর্যন্ত")
                  : t("Above ৳7.5 Lakh", "৭.৫ লক্ষের বেশি")}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">{t("Source tax", "উৎস কর")}</dt>
              <dd
                className={`font-semibold ${lowTax ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}
              >
                {lowTax
                  ? t("5% · Pensioner 0%", "৫% · পেনশনার ০%")
                  : t("10% on all", "সবগুলোতে ১০%")}
              </dd>
            </div>
          </dl>

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-2 print:hidden">
            <button type="button" onClick={handleCopySummary} className={ghostBtn}>
              {copied === "summary" ? (
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied === "summary" ? t("Copied", "কপি হয়েছে") : t("Copy summary", "সারাংশ কপি")}
            </button>
            <button type="button" onClick={handleCopyLink} className={ghostBtn}>
              {copied === "link" ? (
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden="true" />
              )}
              {copied === "link" ? t("Link copied", "লিংক কপি") : t("Share link", "লিংক শেয়ার")}
            </button>
            <button type="button" onClick={() => window.print()} className={ghostBtn}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t("Print / PDF", "প্রিন্ট / PDF")}
            </button>
            <button type="button" onClick={handleReset} className={ghostBtn}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("Reset", "রিসেট")}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Results ─────────────────────────────────── */}
      <section aria-live="polite" className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
              {t("Your profit in all 4 schemes", "৪টি সঞ্চয়পত্রে আপনার মুনাফা")}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {t(
                `For ${formatBDT(amount)} · all figures are net after source tax`,
                `${formatBDT(amount, { locale: "bn" })} বিনিয়োগে · সব অঙ্ক উৎস কর বাদে নিট`
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {result.schemes.map((s) => (
            <SchemeCard
              key={s.id}
              scheme={s}
              locale={locale}
              isTop={amount > 0 && s.id === result.highestMonthlySchemeId}
            />
          ))}
        </div>

        {/* Insights */}
        {result.smartInsights.length > 0 && (
          <div className="space-y-3">
            {result.smartInsights.map((ins) => {
              const tone =
                ins.tone === "positive"
                  ? {
                      wrap: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5",
                      icon: "text-emerald-600 dark:text-emerald-400",
                      Icon: Sparkles,
                    }
                  : ins.tone === "warning"
                    ? {
                        wrap: "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5",
                        icon: "text-amber-600 dark:text-amber-400",
                        Icon: TriangleAlert,
                      }
                    : {
                        wrap: "border-sky-200 bg-sky-50/70 dark:border-sky-500/20 dark:bg-sky-500/5",
                        icon: "text-sky-600 dark:text-sky-400",
                        Icon: Info,
                      };
              return (
                <div key={ins.id} className={`flex gap-3 rounded-xl border p-4 ${tone.wrap}`}>
                  <tone.Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${tone.icon}`} aria-hidden="true" />
                  <div className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isBn ? ins.titleBn : ins.titleEn}
                    </p>
                    <p className="mt-0.5">{isBn ? ins.bodyBn : ins.bodyEn}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comparison */}
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
              {t("Monthly income comparison", "মাসিক আয়ের তুলনা")}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t("Net per-month equivalent, highest to lowest", "নিট মাসিক সমতুল্য, বেশি থেকে কম")}
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...result.schemes]
              .sort((a, b) => b.netMonthly - a.netMonthly)
              .map((s) => (
                <li key={s.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                      {isBn ? s.nameBn : s.nameEn}
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-slate-900 dark:text-white">
                      {fmt(s.netMonthly)}
                      <span className="font-normal text-slate-400">/{t("mo", "মাস")}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                      style={{ width: `${Math.max(2, (s.netMonthly / maxMonthly) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* Detailed table */}
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
              {t("Full breakdown", "বিস্তারিত হিসাব")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">{t("Scheme", "সঞ্চয়পত্র")}</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">{t("Rate", "হার")}</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">{t("Tax", "কর")}</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">{t("Per month", "প্রতি মাস")}</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">{t("You receive", "হাতে পাবেন")}</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">{t("Total profit", "মোট মুনাফা")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.schemes.map((s) => (
                  <tr key={s.id} className="text-slate-700 dark:text-slate-300">
                    <th scope="row" className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                      {isBn ? s.nameBn : s.nameEn}
                    </th>
                    <td className="px-3 py-3.5 text-right tabular-nums">
                      {formatPercent(s.annualRate, { locale })}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums">
                      {formatPercent(s.taxRate, { decimals: 0, locale })}
                    </td>
                    <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {fmt(s.netMonthly)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums">
                      {s.payoutFrequency === "monthly" && (
                        <>{fmt(s.netMonthly)} <span className="text-slate-400">/{t("month", "মাস")}</span></>
                      )}
                      {s.payoutFrequency === "quarterly" && (
                        <>{fmt(s.netQuarterly)} <span className="text-slate-400">/{t("3 months", "৩ মাস")}</span></>
                      )}
                      {s.payoutFrequency === "maturity" && (
                        <>{fmt(s.totalNetProfit)} <span className="text-slate-400">{t("at maturity", "মেয়াদান্তে")}</span></>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      {fmt(s.totalNetProfit)}{" "}
                      <span className="text-slate-400">
                        ({isBn ? `${toBanglaDigits(s.termYears)} বছর` : `${s.termYears} yrs`})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function SchemeCard({
  scheme,
  locale,
  isTop,
}: {
  scheme: SanchayapatraSchemeResult;
  locale: Locale;
  isTop: boolean;
}) {
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const fmt = (v: number) => formatBDT(v, { decimals: 0, locale });
  const years = isBn ? toBanglaDigits(scheme.termYears) : String(scheme.termYears);

  const frequency =
    scheme.payoutFrequency === "monthly"
      ? t("Monthly payout", "মাসিক মুনাফা")
      : scheme.payoutFrequency === "quarterly"
        ? t("Paid every 3 months", "৩ মাস অন্তর মুনাফা")
        : t("Paid at maturity", "মেয়াদান্তে মুনাফা");

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:bg-slate-900 ${
        isTop
          ? "border-emerald-500 ring-4 ring-emerald-500/10 dark:border-emerald-500/70"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {isTop && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          {t("Highest monthly income", "সর্বোচ্চ মাসিক আয়")}
        </span>
      )}

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">
            {isBn ? scheme.nameBn : scheme.nameEn}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t(`${years}-year term`, `${years} বছর মেয়াদ`)} · {frequency}
          </p>
        </div>
        <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
            {formatPercent(scheme.annualRate, { locale })}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {formatPercent(scheme.taxRate, { decimals: 0, locale })} {t("tax", "কর")}
          </div>
        </div>
      </header>

      <div className="mt-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {scheme.payoutFrequency === "monthly"
            ? t("You receive every month", "প্রতি মাসে পাবেন")
            : t("Equivalent per month", "মাসিক সমতুল্য")}
        </p>
        <p className="mt-1 text-[2rem] font-bold leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
          {fmt(scheme.netMonthly)}
        </p>
        <p className="mt-2 text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {t("Gross", "মোট")} {fmt(scheme.grossMonthly)} − {t("tax", "কর")} {fmt(scheme.monthlyTax)}
        </p>
      </div>

      {scheme.payoutFrequency === "quarterly" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-500/20 dark:bg-sky-500/10">
          <div>
            <p className="text-[13px] font-semibold text-sky-900 dark:text-sky-200">
              {t("You receive every 3 months", "প্রতি ৩ মাসে পাবেন")}
            </p>
            <p className="text-[11px] text-sky-700 dark:text-sky-300/80">
              {t("4 payments a year to your bank", "বছরে ৪ বার ব্যাংকে জমা")}
            </p>
          </div>
          <p className="text-xl font-bold tabular-nums text-sky-900 dark:text-sky-100">
            {fmt(scheme.netQuarterly)}
          </p>
        </div>
      )}

      {scheme.payoutFrequency === "maturity" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div>
            <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
              {t(`Paid once after ${years} years`, `${years} বছর শেষে একসাথে`)}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
              {t("No monthly payout for this scheme", "এই সঞ্চয়পত্রে মাসিক মুনাফা নেই")}
            </p>
          </div>
          <p className="text-xl font-bold tabular-nums text-amber-900 dark:text-amber-100">
            {fmt(scheme.totalNetProfit)}
          </p>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">{t("Per year", "প্রতি বছর")}</dt>
          <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">
            {fmt(scheme.netAnnual)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">
            {t(`Total profit (${years} yrs)`, `মোট মুনাফা (${years} বছর)`)}
          </dt>
          <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">
            {fmt(scheme.totalNetProfit)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">{t("Total tax", "মোট কর")}</dt>
          <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-slate-700 dark:text-slate-300">
            {fmt(scheme.totalTax)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">{t("Principal + profit", "আসল + মুনাফা")}</dt>
          <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">
            {fmt(scheme.maturityTotalValue)}
          </dd>
        </div>
      </dl>

      {scheme.exceedsSingleLimit && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t(
            `Exceeds single-name limit of ${fmt(scheme.maxSingleLimit)}`,
            `একক নামের সীমা ${fmt(scheme.maxSingleLimit)} অতিক্রম করেছে`
          )}
        </p>
      )}

      <details className="group mt-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-600 select-none hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          {t("Eligibility & early encashment rates", "যোগ্যতা ও আগে ভাঙানোর হার")}
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-3 border-t border-slate-200 px-3.5 py-3 text-xs dark:border-slate-800">
          <p className="leading-relaxed text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">{t("Who can buy: ", "কারা কিনতে পারবেন: ")}</span>
            {isBn ? scheme.eligibilityBn : scheme.eligibilityEn}
          </p>
          <table className="w-full tabular-nums">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {scheme.yearWiseSchedule.map((row) => (
                <tr key={row.year} className="text-slate-600 dark:text-slate-400">
                  <td className="py-1.5">
                    {t(`After year ${row.year}`, `${toBanglaDigits(row.year)} বছর পর`)}
                    {row.year === scheme.termYears && (
                      <span className="ml-1 text-emerald-600">{t("(maturity)", "(মেয়াদপূর্তি)")}</span>
                    )}
                  </td>
                  <td className="py-1.5 text-right font-semibold text-slate-900 dark:text-white">
                    {formatPercent(row.annualRate, { locale })}
                  </td>
                  <td className="py-1.5 pl-3 text-right">
                    {fmt(row.netMonthlyEquivalent)}/{t("mo", "মাস")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}

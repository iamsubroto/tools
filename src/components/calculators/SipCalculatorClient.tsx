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
} from "lucide-react";
import { calculateSip } from "@/lib/calculators/sip";
import {
  formatBDT,
  formatBDTInWords,
  formatSouthAsianNumber,
  toBanglaDigits,
} from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

const DEFAULT_MONTHLY = 5000;
const DEFAULT_RATE = 12;
const DEFAULT_YEARS = 10;

const MONTHLY_PRESETS = [
  { value: 2000, en: "2,000", bn: "২,০০০" },
  { value: 5000, en: "5,000", bn: "৫,০০০" },
  { value: 10000, en: "10,000", bn: "১০,০০০" },
  { value: 25000, en: "25,000", bn: "২৫,০০০" },
];

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function parseIntAmount(raw: string): number {
  const digits = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 50_000_000);
}

function parseDecimal(raw: string, max: number): number {
  const clean = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  const n = Number.parseFloat(clean);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export function SipCalculatorClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const fmt = (v: number) => formatBDT(v, { decimals: 0, locale });

  const monthlyId = useId();
  const rateId = useId();
  const yearsId = useId();
  const stepUpId = useId();
  const inflationId = useId();
  const advSwitchId = useId();

  const [monthly, setMonthly] = useState<number>(DEFAULT_MONTHLY);
  const [rateText, setRateText] = useState<string>(String(DEFAULT_RATE));
  const [yearsText, setYearsText] = useState<string>(String(DEFAULT_YEARS));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stepUpText, setStepUpText] = useState<string>("10");
  const [inflationText, setInflationText] = useState<string>("6");
  const [copied, setCopied] = useState<"summary" | "link" | null>(null);

  const annualReturnRate = parseDecimal(rateText, 40);
  const years = Math.round(parseDecimal(yearsText, 50));
  const annualStepUpPercent = showAdvanced ? parseDecimal(stepUpText, 50) : 0;
  const inflationRate = showAdvanced ? parseDecimal(inflationText, 25) : 0;

  const result = useMemo(
    () =>
      calculateSip({
        monthlyInvestment: monthly,
        annualReturnRate,
        years,
        annualStepUpPercent,
        inflationRate,
      }),
    [monthly, annualReturnRate, years, annualStepUpPercent, inflationRate]
  );

  const flashCopied = (kind: "summary" | "link") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleCopySummary = async () => {
    const lines = [
      "SIP & Compound Growth Summary — Tools BD",
      `Monthly Investment: ${formatBDT(result.monthlyInvestment)}`,
      `Expected Return: ${result.annualReturnRate}% / year`,
      `Period: ${result.years} years`,
      "",
      `Estimated Value: ${formatBDT(result.futureValue)}`,
      `Total Invested: ${formatBDT(result.totalInvested)}`,
      `Estimated Returns: ${formatBDT(result.estimatedReturns)}`,
      ...(result.inflationAdjustedValue !== null
        ? [`Inflation-Adjusted Value: ${formatBDT(result.inflationAdjustedValue)}`]
        : []),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      flashCopied("summary");
    } catch {
      // Ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("monthly", String(monthly));
      url.searchParams.set("rate", String(annualReturnRate));
      url.searchParams.set("years", String(years));
      await navigator.clipboard.writeText(url.toString());
      flashCopied("link");
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setMonthly(DEFAULT_MONTHLY);
    setRateText(String(DEFAULT_RATE));
    setYearsText(String(DEFAULT_YEARS));
    setShowAdvanced(false);
    setStepUpText("10");
    setInflationText("6");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:items-start">
      {/* Input Panel */}
      <aside className="lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={monthlyId}
                className="text-sm font-semibold text-slate-900 dark:text-white"
              >
                {t("Monthly investment (BDT)", "মাসিক বিনিয়োগ (টাকা)")}
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                  ৳
                </span>
                <input
                  id={monthlyId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={monthly > 0 ? formatSouthAsianNumber(monthly) : ""}
                  onChange={(e) => setMonthly(parseIntAmount(e.target.value))}
                  placeholder="5,000"
                  className="h-13 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xl font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <p className="mt-1 min-h-[1.1rem] text-xs text-slate-500 dark:text-slate-400">
                {monthly > 0 ? formatBDTInWords(monthly, locale) : ""}
              </p>

              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {MONTHLY_PRESETS.map((p) => {
                  const active = monthly === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setMonthly(p.value)}
                      className={`h-9 rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      ৳{isBn ? p.bn : p.en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={rateId}
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {t("Expected return (%)", "প্রত্যাশিত রিটার্ন (%)")}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id={rateId}
                    type="text"
                    inputMode="decimal"
                    value={rateText}
                    onChange={(e) => setRateText(e.target.value)}
                    placeholder="12"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-8 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor={yearsId}
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {t("Period (years)", "সময়কাল (বছর)")}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id={yearsId}
                    type="text"
                    inputMode="numeric"
                    value={yearsText}
                    onChange={(e) => setYearsText(e.target.value)}
                    placeholder="10"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-11 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    {t("yrs", "বছর")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step-up & Inflation Toggle */}
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id={advSwitchId} className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("Annual step-up & inflation", "বার্ষিক বৃদ্ধি ও মূল্যস্ফীতি")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("See inflation-adjusted real value", "আজকের টাকার প্রকৃত মান দেখুন")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showAdvanced}
                aria-labelledby={advSwitchId}
                onClick={() => setShowAdvanced((v) => !v)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  showAdvanced ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    showAdvanced ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={stepUpId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("Yearly step-up (%)", "বার্ষিক বৃদ্ধি (%)")}
                  </label>
                  <input
                    id={stepUpId}
                    type="text"
                    inputMode="decimal"
                    value={stepUpText}
                    onChange={(e) => setStepUpText(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor={inflationId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t("Inflation (% / yr)", "মূল্যস্ফীতি (%)")}
                  </label>
                  <input
                    id={inflationId}
                    type="text"
                    inputMode="decimal"
                    value={inflationText}
                    onChange={(e) => setInflationText(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

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

      {/* Results Panel */}
      <section aria-live="polite" className="min-w-0 space-y-6">
        <div className={`${card} p-6`}>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("Estimated value at maturity", "মেয়াদ শেষে সম্ভাব্য মোট মূল্য")}
          </p>
          <p className="mt-1.5 text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-5xl dark:text-white">
            {fmt(result.futureValue)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {result.futureValue > 0
              ? formatBDTInWords(result.futureValue, locale)
              : t("Enter a monthly amount and period above zero.", "মাসিক অঙ্ক ও সময়কাল লিখুন।")}
          </p>

          {/* Invested vs Returns Bar */}
          <div className="mt-6">
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="bg-slate-400 transition-[width] duration-300 dark:bg-slate-500"
                style={{ width: `${result.investedSharePercent}%` }}
              />
              <div
                className="bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${result.returnsSharePercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                {t("Invested", "নিজের জমা")}:{" "}
                <strong className="tabular-nums text-slate-900 dark:text-white">
                  {result.investedSharePercent.toFixed(1)}%
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {t("Returns", "মুনাফা")}:{" "}
                <strong className="tabular-nums text-slate-900 dark:text-white">
                  {result.returnsSharePercent.toFixed(1)}%
                </strong>
              </span>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3 dark:border-slate-800">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {t("Total invested", "মোট জমা")}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {fmt(result.totalInvested)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {t("Estimated returns", "সম্ভাব্য মুনাফা")}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {fmt(result.estimatedReturns)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {result.inflationAdjustedValue !== null
                  ? t("Today's purchasing power", "আজকের প্রকৃত মান")
                  : t("Growth multiple", "বৃদ্ধির গুণিতক")}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {result.inflationAdjustedValue !== null
                  ? fmt(result.inflationAdjustedValue)
                  : result.totalInvested > 0
                    ? `${(result.futureValue / result.totalInvested).toFixed(2)}×`
                    : "–"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Insights */}
        {result.smartInsights.length > 0 && (
          <div className="space-y-3">
            {result.smartInsights.map((ins) => {
              const isPos = ins.tone === "positive";
              const Icon = isPos ? Sparkles : Info;
              return (
                <div
                  key={ins.id}
                  className={`flex gap-3 rounded-xl border p-4 ${
                    isPos
                      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                      : "border-sky-200 bg-sky-50/70 dark:border-sky-500/20 dark:bg-sky-500/5"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                      isPos
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-sky-600 dark:text-sky-400"
                    }`}
                    aria-hidden="true"
                  />
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

        {/* Yearly Growth Table */}
        {result.yearlySchedule.length > 0 && (
          <details open className={`${card} group overflow-hidden`}>
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 select-none hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                  {t("Year-by-year wealth projection", "বছরভিত্তিক মূলধন বৃদ্ধি")}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("Cumulative invested vs compounded value", "মোট জমা বনাম চক্রবৃদ্ধি মূল্য")}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">{t("Year", "বছর")}</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">{t("Invested", "জমা")}</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">{t("Returns", "মুনাফা")}</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">{t("Total value", "মোট মূল্য")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums dark:divide-slate-800">
                  {result.yearlySchedule.map((row) => (
                    <tr key={row.year} className="text-slate-700 dark:text-slate-300">
                      <th scope="row" className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                        {isBn ? `${toBanglaDigits(row.year)}ম বছর` : `Year ${row.year}`}
                      </th>
                      <td className="px-3 py-3 text-right">{fmt(row.totalInvested)}</td>
                      <td className="px-3 py-3 text-right text-emerald-700 dark:text-emerald-400">
                        {fmt(row.estimatedReturns)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">
                        {fmt(row.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>
    </div>
  );
}

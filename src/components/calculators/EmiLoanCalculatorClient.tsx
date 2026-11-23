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
import type { LoanPresetsBdConfig } from "@/data/rates.schema";
import { calculateEmiLoan } from "@/lib/calculators/emiLoan";
import {
  formatBDT,
  formatBDTInWords,
  formatSouthAsianNumber,
  toBanglaDigits,
} from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: LoanPresetsBdConfig;
}

const DEFAULT_AMOUNT = 1_000_000;
const DEFAULT_RATE = 11.5;
const DEFAULT_YEARS = 5;

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function parseIntAmount(raw: string, max = 500_000_000): number {
  const digits = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function parseDecimal(raw: string, max: number): number {
  const clean = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  const n = Number.parseFloat(clean);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export function EmiLoanCalculatorClient({ config }: Props) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const fmt = (v: number) => formatBDT(v, { decimals: 0, locale });

  const principalId = useId();
  const rateId = useId();
  const tenureId = useId();
  const extraId = useId();
  const prepaySwitchId = useId();

  const [principal, setPrincipal] = useState<number>(DEFAULT_AMOUNT);
  const [rateText, setRateText] = useState<string>(String(DEFAULT_RATE));
  const [yearsText, setYearsText] = useState<string>(String(DEFAULT_YEARS));
  const [enablePrepay, setEnablePrepay] = useState(false);
  const [extraMonthly, setExtraMonthly] = useState<number>(5000);
  const [copied, setCopied] = useState<"summary" | "link" | null>(null);

  const annualInterestRate = parseDecimal(rateText, 50);
  const tenureYears = parseDecimal(yearsText, 40);

  const result = useMemo(
    () =>
      calculateEmiLoan({
        principal,
        annualInterestRate,
        tenureYears,
        extraMonthlyPayment: enablePrepay ? extraMonthly : 0,
      }),
    [principal, annualInterestRate, tenureYears, enablePrepay, extraMonthly]
  );

  const flashCopied = (kind: "summary" | "link") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleCopySummary = async () => {
    const lines = [
      "EMI & Bank Loan Summary — Tools BD",
      `Loan Amount: ${formatBDT(result.principal)}`,
      `Interest Rate: ${result.annualInterestRate}% / year`,
      `Tenure: ${(result.tenureMonths / 12).toFixed(1).replace(/\.0$/, "")} years (${result.tenureMonths} months)`,
      "",
      `Monthly EMI: ${formatBDT(result.monthlyEmi)}`,
      `Total Interest: ${formatBDT(result.totalInterest)}`,
      `Total Payable: ${formatBDT(result.totalPayable)}`,
      ...(result.prepayment && result.prepayment.interestSaved > 0
        ? [
            `With +${formatBDT(result.prepayment.extraMonthly)}/mo prepayment: save ${formatBDT(result.prepayment.interestSaved)} interest & ${result.prepayment.monthsSaved} months.`,
          ]
        : []),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      flashCopied("summary");
    } catch {
      // Ignore clipboard error
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("amount", String(principal));
      url.searchParams.set("rate", String(annualInterestRate));
      url.searchParams.set("years", String(tenureYears));
      await navigator.clipboard.writeText(url.toString());
      flashCopied("link");
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setPrincipal(DEFAULT_AMOUNT);
    setRateText(String(DEFAULT_RATE));
    setYearsText(String(DEFAULT_YEARS));
    setEnablePrepay(false);
    setExtraMonthly(5000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:items-start">
      {/* Input Panel */}
      <aside className="lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          {/* BD Loan Presets */}
          <div className="mb-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("Quick Bangladesh loan presets", "দ্রুত লোন প্রিসেট")}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {config.presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPrincipal(p.amount);
                    setRateText(String(p.annualRate));
                    setYearsText(String(p.tenureYears));
                  }}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {isBn ? p.labelBn : p.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Loan Amount */}
            <div>
              <label
                htmlFor={principalId}
                className="text-sm font-semibold text-slate-900 dark:text-white"
              >
                {t("Loan amount (BDT)", "লোনের পরিমাণ (টাকা)")}
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                  ৳
                </span>
                <input
                  id={principalId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={principal > 0 ? formatSouthAsianNumber(principal) : ""}
                  onChange={(e) => setPrincipal(parseIntAmount(e.target.value))}
                  placeholder="10,00,000"
                  className="h-13 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xl font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <p className="mt-1 min-h-[1.1rem] text-xs text-slate-500 dark:text-slate-400">
                {principal > 0 ? formatBDTInWords(principal, locale) : ""}
              </p>
            </div>

            {/* Rate & Tenure side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={rateId}
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {t("Interest (% / yr)", "সুদের হার (%/বছর)")}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id={rateId}
                    type="text"
                    inputMode="decimal"
                    value={rateText}
                    onChange={(e) => setRateText(e.target.value)}
                    placeholder="11.5"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-8 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor={tenureId}
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {t("Tenure (years)", "মেয়াদ (বছর)")}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id={tenureId}
                    type="text"
                    inputMode="decimal"
                    value={yearsText}
                    onChange={(e) => setYearsText(e.target.value)}
                    placeholder="5"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-11 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    {t("yrs", "বছর")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Extra Prepayment Simulator */}
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  id={prepaySwitchId}
                  className="text-sm font-medium text-slate-900 dark:text-white"
                >
                  {t("Simulate extra monthly payment", "অতিরিক্ত মাসিক পরিশোধ যাচাই")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("See how much interest & time you save", "সুদ ও মেয়াদ কতটা কমবে দেখুন")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enablePrepay}
                aria-labelledby={prepaySwitchId}
                onClick={() => setEnablePrepay((v) => !v)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  enablePrepay ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    enablePrepay ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {enablePrepay && (
              <div className="mt-3">
                <label htmlFor={extraId} className="sr-only">
                  {t("Extra monthly payment in BDT", "অতিরিক্ত মাসিক পরিশোধ")}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                    ৳
                  </span>
                  <input
                    id={extraId}
                    type="text"
                    inputMode="numeric"
                    value={extraMonthly > 0 ? formatSouthAsianNumber(extraMonthly) : ""}
                    onChange={(e) => setExtraMonthly(parseIntAmount(e.target.value, 50_000_000))}
                    placeholder="5,000"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-[15px] font-semibold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
        {/* Hero Result Card */}
        <div className={`${card} p-6`}>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("Monthly EMI (You pay every month)", "মাসিক কিস্তি (EMI)")}
          </p>
          <p className="mt-1.5 text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-5xl dark:text-white">
            {fmt(result.monthlyEmi)}
            <span className="ml-1.5 text-base font-medium text-slate-400">
              /{t("month", "মাস")}
            </span>
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {result.tenureMonths > 0
              ? t(
                  `For ${result.tenureMonths} monthly instalments at ${result.annualInterestRate}% p.a.`,
                  `বার্ষিক ${toBanglaDigits(result.annualInterestRate)}% সুদে মোট ${toBanglaDigits(result.tenureMonths)}টি মাসিক কিস্তি`
                )
              : t("Enter loan amount and tenure above zero.", "লোনের পরিমাণ ও মেয়াদ লিখুন।")}
          </p>

          {/* Principal vs Interest Split Bar */}
          <div className="mt-6">
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${result.principalSharePercent}%` }}
              />
              <div
                className="bg-amber-500 transition-[width] duration-300"
                style={{ width: `${result.interestSharePercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {t("Principal", "আসল")}:{" "}
                <strong className="tabular-nums text-slate-900 dark:text-white">
                  {result.principalSharePercent.toFixed(1)}%
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                {t("Interest", "মোট সুদ")}:{" "}
                <strong className="tabular-nums text-slate-900 dark:text-white">
                  {result.interestSharePercent.toFixed(1)}%
                </strong>
              </span>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3 dark:border-slate-800">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {t("Loan amount", "মূল ঋণ")}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {fmt(result.principal)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {t("Total interest", "মোট সুদ")}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                {fmt(result.totalInterest)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {t("Total payable", "সর্বমোট পরিশোধ")}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {fmt(result.totalPayable)}
              </dd>
            </div>
          </dl>

          {result.prepayment && result.prepayment.interestSaved > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  {t("Interest saved", "সুদ সাশ্রয়")}
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                  {fmt(result.prepayment.interestSaved)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  {t("Loan finishes earlier by", "মেয়াদ কমবে")}
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                  {isBn
                    ? `${toBanglaDigits(result.prepayment.monthsSaved)} মাস`
                    : `${result.prepayment.monthsSaved} months`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Smart Insights */}
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

        {/* Year-by-Year Amortization Schedule */}
        {result.yearlySchedule.length > 0 && (
          <details open className={`${card} group overflow-hidden`}>
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 select-none hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                  {t("Year-by-year repayment schedule", "বছরভিত্তিক পরিশোধ তালিকা")}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("Principal vs interest paid each year", "প্রতি বছর আসল ও সুদ পরিশোধ")}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">{t("Year", "বছর")}</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">{t("Principal", "আসল")}</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">{t("Interest", "সুদ")}</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">{t("Balance", "বাকি ঋণ")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums dark:divide-slate-800">
                  {result.yearlySchedule.map((row) => (
                    <tr key={row.year} className="text-slate-700 dark:text-slate-300">
                      <th scope="row" className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                        {isBn ? `${toBanglaDigits(row.year)}ম বছর` : `Year ${row.year}`}
                      </th>
                      <td className="px-3 py-3 text-right text-emerald-700 dark:text-emerald-400">
                        {fmt(row.principalPaid)}
                      </td>
                      <td className="px-3 py-3 text-right text-amber-700 dark:text-amber-400">
                        {fmt(row.interestPaid)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">
                        {fmt(row.closingBalance)}
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

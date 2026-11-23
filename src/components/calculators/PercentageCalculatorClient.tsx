"use client";

import { useId, useMemo, useState } from "react";
import { Check, Copy, Info, Printer, RotateCcw } from "lucide-react";
import { calculatePercentage } from "@/lib/calculators/percentage";
import { formatSouthAsianNumber, toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function parseNum(raw: string): number {
  const clean = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

function fmtNum(v: number, locale: "en" | "bn"): string {
  const decimals = Number.isInteger(v) ? 0 : 2;
  return formatSouthAsianNumber(v, { decimals, locale });
}

export function PercentageCalculatorClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);

  const aId = useId();
  const bId = useId();
  const fromId = useId();
  const toId = useId();

  const [aText, setAText] = useState("15");
  const [bText, setBText] = useState("2000");
  const [fromText, setFromText] = useState("1000");
  const [toText, setToText] = useState("1250");
  const [copied, setCopied] = useState(false);

  const percentA = parseNum(aText);
  const baseB = parseNum(bText);
  const changeFrom = parseNum(fromText);
  const changeTo = parseNum(toText);

  const result = useMemo(
    () => calculatePercentage({ percentA, baseB, changeFrom, changeTo }),
    [percentA, baseB, changeFrom, changeTo]
  );

  const handleCopy = async () => {
    const text = [
      "Percentage Summary — Tools BD",
      `${result.percentA}% of ${result.baseB} = ${result.percentOfBase.toFixed(2)}`,
      `${result.percentA} is ${result.aIsWhatPercentOfB !== null ? result.aIsWhatPercentOfB.toFixed(2) + "%" : "N/A"} of ${result.baseB}`,
      `${result.baseB} + ${result.percentA}% = ${result.increasedByA.toFixed(2)}`,
      `${result.baseB} - ${result.percentA}% = ${result.decreasedByA.toFixed(2)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setAText("15");
    setBText("2000");
    setFromText("1000");
    setToText("1250");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      {/* Inputs */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("Quick percentage inputs", "শতাংশ ইনপুট")}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={aId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {t("Percentage (A)", "শতাংশ (A)")}
              </label>
              <div className="relative mt-1">
                <input
                  id={aId}
                  type="text"
                  inputMode="decimal"
                  value={aText}
                  onChange={(e) => setAText(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-8 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
              </div>
            </div>
            <div>
              <label htmlFor={bId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {t("Of number (B)", "মূল সংখ্যা (B)")}
              </label>
              <input
                id={bId}
                type="text"
                inputMode="decimal"
                value={bText}
                onChange={(e) => setBText(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("Percentage change (From → To)", "শতাংশ পরিবর্তন (থেকে → পর্যন্ত)")}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={fromId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t("From (Old)", "আগের মান")}
                </label>
                <input
                  id={fromId}
                  type="text"
                  inputMode="decimal"
                  value={fromText}
                  onChange={(e) => setFromText(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor={toId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t("To (New)", "নতুন মান")}
                </label>
                <input
                  id={toId}
                  type="text"
                  inputMode="decimal"
                  value={toText}
                  onChange={(e) => setToText(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 print:hidden">
            <button type="button" onClick={handleCopy} className={ghostBtn}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? t("Copied", "কপি") : t("Copy", "কপি")}
            </button>
            <button type="button" onClick={() => window.print()} className={ghostBtn}>
              <Printer className="h-4 w-4" />
              {t("Print", "প্রিন্ট")}
            </button>
            <button type="button" onClick={handleReset} className={ghostBtn}>
              <RotateCcw className="h-4 w-4" />
              {t("Reset", "রিসেট")}
            </button>
          </div>
        </div>
      </aside>

      {/* Results — All 4 + Change Card Live */}
      <section aria-live="polite" className="min-w-0 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={`${card} border-emerald-500/50 p-5 ring-4 ring-emerald-500/5`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isBn
                ? `${fmtNum(result.baseB, "bn")}-এর ${fmtNum(result.percentA, "bn")}%`
                : `${fmtNum(result.percentA, "en")}% of ${fmtNum(result.baseB, "en")}`}
            </p>
            <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {fmtNum(result.percentOfBase, locale)}
            </p>
          </div>

          <div className={`${card} p-5`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isBn
                ? `${fmtNum(result.percentA, "bn")} হলো ${fmtNum(result.baseB, "bn")}-এর কত %?`
                : `${fmtNum(result.percentA, "en")} is what % of ${fmtNum(result.baseB, "en")}?`}
            </p>
            <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {result.aIsWhatPercentOfB !== null
                ? `${fmtNum(result.aIsWhatPercentOfB, locale)}%`
                : "–"}
            </p>
          </div>

          <div className={`${card} p-5`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isBn
                ? `${fmtNum(result.baseB, "bn")} + ${fmtNum(result.percentA, "bn")}% বৃদ্ধি`
                : `${fmtNum(result.baseB, "en")} increased by ${fmtNum(result.percentA, "en")}%`}
            </p>
            <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
              {fmtNum(result.increasedByA, locale)}
            </p>
          </div>

          <div className={`${card} p-5`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isBn
                ? `${fmtNum(result.baseB, "bn")} − ${fmtNum(result.percentA, "bn")}% হ্রাস`
                : `${fmtNum(result.baseB, "en")} decreased by ${fmtNum(result.percentA, "en")}%`}
            </p>
            <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-amber-700 dark:text-amber-400">
              {fmtNum(result.decreasedByA, locale)}
            </p>
          </div>
        </div>

        {/* Percentage Change Card */}
        <div className={`${card} p-6`}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {isBn
              ? `${fmtNum(result.changeFrom, "bn")} থেকে ${fmtNum(result.changeTo, "bn")}-এ শতাংশ পরিবর্তন`
              : `Percentage change from ${fmtNum(result.changeFrom, "en")} to ${fmtNum(result.changeTo, "en")}`}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <p
              className={`text-3xl font-extrabold tabular-nums ${
                (result.changePercent ?? 0) >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {result.changePercent !== null
                ? `${result.changePercent >= 0 ? "+" : ""}${
                    isBn
                      ? toBanglaDigits(result.changePercent.toFixed(2))
                      : result.changePercent.toFixed(2)
                  }%`
                : "–"}
            </p>
            <p className="text-sm font-medium tabular-nums text-slate-600 dark:text-slate-400">
              {t("Difference", "পার্থক্য")}:{" "}
              <strong className="text-slate-900 dark:text-white">
                {result.changeDifference >= 0 ? "+" : ""}
                {fmtNum(result.changeDifference, locale)}
              </strong>
            </p>
          </div>
        </div>

        {result.smartInsights.map((ins) => (
          <div
            key={ins.id}
            className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-500/20 dark:bg-sky-500/5"
          >
            <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <div className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">
                {isBn ? ins.titleBn : ins.titleEn}
              </p>
              <p className="mt-0.5">{isBn ? ins.bodyBn : ins.bodyEn}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

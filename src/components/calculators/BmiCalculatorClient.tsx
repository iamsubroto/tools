"use client";

import { useId, useMemo, useState } from "react";
import { Check, Copy, Info, Printer, RotateCcw, Sparkles } from "lucide-react";
import {
  calculateBmi,
  cmToFeetInches,
  feetInchesToCm,
  type BmiCategoryTone,
} from "@/lib/calculators/bmi";
import { toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

type HeightUnit = "cm" | "ft";

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function parseDec(raw: string, max: number): number {
  const clean = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  const n = Number.parseFloat(clean);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function tonePill(tone: BmiCategoryTone): string {
  switch (tone) {
    case "positive":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400";
    case "warning":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400";
    case "danger":
      return "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400";
    default:
      return "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400";
  }
}

export function BmiCalculatorClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const d = (val: string) => (isBn ? toBanglaDigits(val) : val);

  const cmId = useId();
  const ftId = useId();
  const inId = useId();
  const kgId = useId();

  const [heightUnit, setHeightUnit] = useState<HeightUnit>("ft");
  const [cmText, setCmText] = useState("170");
  const [feetText, setFeetText] = useState("5");
  const [inchText, setInchText] = useState("7");
  const [kgText, setKgText] = useState("65");
  const [copied, setCopied] = useState(false);

  const heightCm =
    heightUnit === "cm"
      ? parseDec(cmText, 275)
      : feetInchesToCm(parseDec(feetText, 9), parseDec(inchText, 11.9));
  const weightKg = parseDec(kgText, 400);

  const result = useMemo(
    () => calculateBmi({ heightCm, weightKg }),
    [heightCm, weightKg]
  );

  const switchUnit = (next: HeightUnit) => {
    if (next === heightUnit) return;
    if (next === "cm") {
      const converted = feetInchesToCm(parseDec(feetText, 9), parseDec(inchText, 11.9));
      setCmText(converted > 0 ? String(Math.round(converted)) : "170");
    } else {
      const { feet, inches } = cmToFeetInches(parseDec(cmText, 275));
      setFeetText(String(feet));
      setInchText(String(Math.round(inches)));
    }
    setHeightUnit(next);
  };

  const handleCopy = async () => {
    if (!result.valid) return;
    const text = [
      "BMI Summary — Tools BD",
      `Height: ${result.heightCm.toFixed(0)} cm | Weight: ${result.weightKg} kg`,
      `BMI: ${result.bmi.toFixed(1)}`,
      `WHO Category: ${result.whoCategory.labelEn}`,
      `South Asian Category: ${result.asianCategory.labelEn}`,
      `Reference Healthy Weight (South Asian): ${result.asianHealthyRangeKg.min.toFixed(1)}–${result.asianHealthyRangeKg.max.toFixed(1)} kg`,
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
    setHeightUnit("ft");
    setFeetText("5");
    setInchText("7");
    setCmText("170");
    setKgText("65");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      {/* Inputs */}
      <aside className="lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          <div className="space-y-4">
            {/* Height Unit Switch */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("Height", "উচ্চতা")}
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => switchUnit("ft")}
                    className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                      heightUnit === "ft"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    {t("ft / in", "ফুট / ইঞ্চি")}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchUnit("cm")}
                    className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                      heightUnit === "cm"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    {t("cm", "সেমি")}
                  </button>
                </div>
              </div>

              {heightUnit === "ft" ? (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label htmlFor={ftId} className="sr-only">Feet</label>
                    <input
                      id={ftId}
                      type="text"
                      inputMode="numeric"
                      value={feetText}
                      onChange={(e) => setFeetText(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-10 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      {t("ft", "ফুট")}
                    </span>
                  </div>
                  <div className="relative">
                    <label htmlFor={inId} className="sr-only">Inches</label>
                    <input
                      id={inId}
                      type="text"
                      inputMode="decimal"
                      value={inchText}
                      onChange={(e) => setInchText(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-10 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      {t("in", "ইঞ্চি")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative mt-2">
                  <label htmlFor={cmId} className="sr-only">Height in cm</label>
                  <input
                    id={cmId}
                    type="text"
                    inputMode="decimal"
                    value={cmText}
                    onChange={(e) => setCmText(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-12 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    {t("cm", "সেমি")}
                  </span>
                </div>
              )}
            </div>

            {/* Weight */}
            <div>
              <label htmlFor={kgId} className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("Weight (kg)", "ওজন (কেজি)")}
              </label>
              <div className="relative mt-1.5">
                <input
                  id={kgId}
                  type="text"
                  inputMode="decimal"
                  value={kgText}
                  onChange={(e) => setKgText(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-12 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  {t("kg", "কেজি")}
                </span>
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

      {/* Results */}
      <section aria-live="polite" className="min-w-0 space-y-6">
        <div className={`${card} p-6`}>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("Your Body Mass Index (BMI)", "আপনার বিএমআই (BMI)")}
          </p>
          <p className="mt-1.5 text-5xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
            {result.valid ? d(result.bmi.toFixed(1)) : "–"}
          </p>

          {/* Visual BMI Range Bar */}
          {result.valid && (
            <div className="mt-6">
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="grid h-full w-full grid-cols-4">
                  <div className="bg-sky-400" />
                  <div className="bg-emerald-500" />
                  <div className="bg-amber-400" />
                  <div className="bg-rose-500" />
                </div>
                <span
                  className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 ring-2 ring-white dark:bg-white dark:ring-slate-900"
                  style={{ left: `${result.barPositionPercent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-400">
                <span>14</span>
                <span>18.5</span>
                <span>23 / 25</span>
                <span>27.5 / 30</span>
                <span>38+</span>
              </div>
            </div>
          )}

          {/* WHO vs South Asian Comparison */}
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 dark:border-slate-800">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("South Asian Cut-off (Recommended for BD)", "দক্ষিণ এশীয় মানদণ্ড (বাংলাদেশের জন্য)")}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tonePill(
                    result.asianCategory.tone
                  )}`}
                >
                  {isBn ? result.asianCategory.labelBn : result.asianCategory.labelEn}
                </span>
              </div>
              {result.valid && (
                <p className="mt-2 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {t("Healthy range:", "স্বাভাবিক ওজন:")}{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {d(result.asianHealthyRangeKg.min.toFixed(1))}–{d(result.asianHealthyRangeKg.max.toFixed(1))} {t("kg", "কেজি")}
                  </strong>
                </p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("WHO Global Standard", "বৈশ্বিক WHO মানদণ্ড")}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tonePill(
                    result.whoCategory.tone
                  )}`}
                >
                  {isBn ? result.whoCategory.labelBn : result.whoCategory.labelEn}
                </span>
              </div>
              {result.valid && (
                <p className="mt-2 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {t("Healthy range:", "স্বাভাবিক ওজন:")}{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {d(result.whoHealthyRangeKg.min.toFixed(1))}–{d(result.whoHealthyRangeKg.max.toFixed(1))} {t("kg", "কেজি")}
                  </strong>
                </p>
              )}
            </div>
          </div>
        </div>

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
                  isPos ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"
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
      </section>
    </div>
  );
}

"use client";

import { useId, useMemo, useState } from "react";
import {
  BadgeCheck,
  Cake,
  Check,
  Copy,
  Info,
  Printer,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import type { GovtJobAgeLimitConfig } from "@/data/rates.schema";
import { calculateAgeAndGovtJob } from "@/lib/calculators/ageGovtJob";
import { formatSouthAsianNumber, toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: GovtJobAgeLimitConfig;
  defaultTargetDate: string;
}

const DEFAULT_DOB = "2000-01-01";

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AgeCalculatorClient({ config, defaultTargetDate }: Props) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const num = (v: number) => formatSouthAsianNumber(v, { locale });

  const dobId = useId();
  const targetId = useId();
  const maxAgeId = useId();

  const [birthDate, setBirthDate] = useState(DEFAULT_DOB);
  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const [maxAgeYears, setMaxAgeYears] = useState<number>(config.generalMaxYears);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      calculateAgeAndGovtJob(
        {
          birthDate,
          targetDate,
          customMaxAgeYears: maxAgeYears,
          customMinAgeYears: config.minYears,
        },
        config
      ),
    [birthDate, targetDate, maxAgeYears, config]
  );

  const handleCopy = async () => {
    if (!result.valid) return;
    const lines = [
      "Age & BD Govt Job Eligibility — Tools BD",
      `Date of Birth: ${birthDate}`,
      `Age On: ${targetDate}`,
      `Exact Age: ${result.age.years} years, ${result.age.months} months, ${result.age.days} days`,
      `Total Days Lived: ${result.totalDaysLived.toLocaleString("en-IN")}`,
      `BD Govt Job (${result.jobEligibility.minYears}-${result.jobEligibility.maxYears} yrs): ${result.jobEligibility.status.toUpperCase()}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setBirthDate(DEFAULT_DOB);
    setTargetDate(defaultTargetDate);
    setMaxAgeYears(config.generalMaxYears);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      {/* Input Panel */}
      <aside className="lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          <div className="space-y-4">
            <div>
              <label htmlFor={dobId} className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("Date of birth", "জন্ম তারিখ")}
              </label>
              <input
                id={dobId}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base font-semibold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={targetId} className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("Age on / Circular cutoff date", "নির্ধারিত বা সার্কুলারের তারিখ")}
                </label>
                <button
                  type="button"
                  onClick={() => setTargetDate(getLocalTodayIso())}
                  className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {t("Set today", "আজকের তারিখ")}
                </button>
              </div>
              <input
                id={targetId}
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base font-semibold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <label htmlFor={maxAgeId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {t("Job circular max age limit (years)", "সার্কুলারের সর্বোচ্চ বয়সসীমা (বছর)")}
              </label>
              <div className="mt-2 flex gap-2">
                {[30, 32, 35].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setMaxAgeYears(yr)}
                    className={`h-9 flex-1 rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                      maxAgeYears === yr
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {isBn ? `${toBanglaDigits(yr)} বছর` : `${yr} yrs`}
                    {yr === config.generalMaxYears ? (isBn ? " (বিসিএস)" : " (BCS)") : ""}
                  </button>
                ))}
              </div>
              <input id={maxAgeId} type="hidden" value={maxAgeYears} />
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

      {/* Results Panel */}
      <section aria-live="polite" className="min-w-0 space-y-6">
        {!result.valid ? (
          <div className={`${card} p-6 text-sm text-amber-700 dark:text-amber-400`}>
            {isBn ? result.errorBn : result.errorEn}
          </div>
        ) : (
          <>
            <div className={`${card} p-6`}>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("Exact age", "সঠিক বয়স")}
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-5xl dark:text-white">
                {isBn
                  ? `${toBanglaDigits(result.age.years)} বছর ${toBanglaDigits(result.age.months)} মাস ${toBanglaDigits(result.age.days)} দিন`
                  : `${result.age.years} yrs, ${result.age.months} mos, ${result.age.days} days`}
              </p>

              {/* BD Govt Job Eligibility Banner */}
              <div
                className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  result.jobEligibility.status === "eligible"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : result.jobEligibility.status === "over-limit"
                      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
                      : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200"
                }`}
              >
                <div className="flex items-center gap-2.5 text-sm font-semibold">
                  {result.jobEligibility.status === "eligible" ? (
                    <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : result.jobEligibility.status === "over-limit" ? (
                    <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  ) : (
                    <Info className="h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
                  )}
                  <span>
                    {result.jobEligibility.status === "eligible"
                      ? t(`Eligible for BD Govt Jobs (${maxAgeYears}-yr limit)`, `সরকারি চাকরির জন্য যোগ্য (${toBanglaDigits(maxAgeYears)} বছর সীমা)`)
                      : result.jobEligibility.status === "over-limit"
                        ? t(`Over ${maxAgeYears}-year age limit`, `${toBanglaDigits(maxAgeYears)} বছরের সীমা অতিক্রম`)
                        : t(`Below minimum entry age (${config.minYears} yrs)`, `ন্যূনতম বয়সসীমার নিচে`)}
                  </span>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4 dark:border-slate-800">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Total months", "মোট মাস")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {num(result.totalMonthsLived)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Total weeks", "মোট সপ্তাহ")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {num(result.totalWeeksLived)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Total days", "মোট দিন")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {num(result.totalDaysLived)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Cake className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("Next birthday", "পরবর্তী জন্মদিন")}
                  </dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {result.isBirthdayToday
                      ? t("Today!", "আজ!")
                      : isBn
                        ? `${toBanglaDigits(result.daysUntilNextBirthday)} দিন`
                        : `${result.daysUntilNextBirthday} days`}
                  </dd>
                </div>
              </dl>
            </div>

            {result.smartInsights.map((ins) => {
              const tone =
                ins.tone === "positive"
                  ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                  : ins.tone === "warning"
                    ? "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5"
                    : "border-sky-200 bg-sky-50/70 dark:border-sky-500/20 dark:bg-sky-500/5";
              return (
                <div key={ins.id} className={`rounded-xl border p-4 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 ${tone}`}>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {isBn ? ins.titleBn : ins.titleEn}
                  </p>
                  <p className="mt-0.5">{isBn ? ins.bodyBn : ins.bodyEn}</p>
                </div>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}

"use client";

import { useId, useMemo, useState } from "react";
import { Check, Copy, Info, RotateCcw, Trash2 } from "lucide-react";
import { analyzeText } from "@/lib/calculators/wordCounter";
import { formatSouthAsianNumber, toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

const SAMPLE_EN =
  "Tools BD provides fast, free calculators for Bangladesh and NRBs. Type or paste any English or Bangla text here to count words, characters, sentences, reading time, and SMS segments instantly.";
const SAMPLE_BN =
  "টুলস বিডি বাংলাদেশ ও প্রবাসীদের জন্য ফ্রি এবং নির্ভুল ক্যালকুলেটর। এখানে যেকোনো বাংলা বা ইংরেজি লেখা পেস্ট করলে শব্দ, অক্ষর, বাক্য ও এসএমএস সংখ্যা সাথে সাথে দেখা যাবে।";

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

export function WordCounterClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const num = (v: number) => formatSouthAsianNumber(v, { locale });

  const areaId = useId();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState<"text" | "stats" | null>(null);

  const result = useMemo(() => analyzeText(text), [text]);

  const flash = (kind: "text" | "stats") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flash("text");
    } catch {
      // Ignore
    }
  };

  const handleCopyStats = async () => {
    const summary = [
      "Text Stats — Tools BD",
      `Words: ${result.words}`,
      `Characters: ${result.characters} (without spaces: ${result.charactersNoSpaces})`,
      `Sentences: ${result.sentences} | Paragraphs: ${result.paragraphs}`,
      `Reading time: ${result.readingTimeMinutes} min | SMS parts: ${result.smsSegments}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      flash("stats");
    } catch {
      // Ignore
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
      {/* Textarea */}
      <div className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={areaId} className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("Type or paste your text (English or Bangla)", "আপনার বাংলা বা ইংরেজি লেখা এখানে লিখুন বা পেস্ট করুন")}
          </label>
          <button
            type="button"
            onClick={() => setText(isBn ? SAMPLE_BN : SAMPLE_EN)}
            className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {t("Try sample text", "নমুনা লেখা বসান")}
          </button>
        </div>

        <textarea
          id={areaId}
          rows={11}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(
            "Start typing or paste an article, assignment, Facebook post, or SMS message…",
            "এখানে প্রবন্ধ, অ্যাসাইনমেন্ট, ফেসবুক পোস্ট বা এসএমএস লিখুন অথবা পেস্ট করুন…"
          )}
          className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-slate-50/50 p-4 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
          <button type="button" onClick={handleCopyText} className={ghostBtn}>
            {copied === "text" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied === "text" ? t("Text copied", "কপি হয়েছে") : t("Copy text", "লেখা কপি")}
          </button>
          <button type="button" onClick={handleCopyStats} className={ghostBtn}>
            {copied === "stats" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied === "stats" ? t("Stats copied", "হিসাব কপি") : t("Copy stats", "হিসাব কপি")}
          </button>
          <button
            type="button"
            onClick={() => setText((prev) => prev.replace(/\s+/g, " ").trim())}
            className={ghostBtn}
          >
            <RotateCcw className="h-4 w-4" />
            {t("Clean extra spaces", "অতিরিক্ত স্পেস সরান")}
          </button>
          <button
            type="button"
            onClick={() => setText("")}
            className={`${ghostBtn} text-rose-600 hover:text-rose-700 dark:text-rose-400`}
          >
            <Trash2 className="h-4 w-4" />
            {t("Clear", "মুছুন")}
          </button>
        </div>
      </div>

      {/* Live Stats Sidebar */}
      <aside aria-live="polite" className="space-y-4 lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                {t("Words", "শব্দ")}
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-emerald-950 dark:text-white">
                {num(result.words)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("Characters", "অক্ষর")}
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {num(result.characters)}
              </p>
            </div>
          </div>

          <dl className="mt-5 divide-y divide-slate-100 text-sm dark:divide-slate-800">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">{t("Without spaces", "স্পেস ছাড়া অক্ষর")}</dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {num(result.charactersNoSpaces)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">{t("Sentences", "বাক্য")}</dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {num(result.sentences)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">{t("Paragraphs", "অনুচ্ছেদ")}</dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {num(result.paragraphs)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">{t("Reading time", "পড়ার সময়")}</dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {isBn
                  ? `${toBanglaDigits(result.readingTimeMinutes)} মিনিট`
                  : `${result.readingTimeMinutes} min`}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">{t("Speaking time", "বলার সময়")}</dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {isBn
                  ? `${toBanglaDigits(result.speakingTimeMinutes)} মিনিট`
                  : `${result.speakingTimeMinutes} min`}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">
                {t(
                  `SMS parts (${result.containsUnicodeSmsChars ? "Bangla" : "English"})`,
                  `এসএমএস সংখ্যা (${result.containsUnicodeSmsChars ? "বাংলা" : "ইংরেজি"})`
                )}
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {num(result.smsSegments)}{" "}
                <span className="text-xs font-normal text-slate-400">
                  ({isBn ? `${toBanglaDigits(result.smsLimitPerSegment)}/অংশ` : `${result.smsLimitPerSegment}/part`})
                </span>
              </dd>
            </div>
          </dl>
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
      </aside>
    </div>
  );
}

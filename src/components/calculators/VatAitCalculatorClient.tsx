"use client";

import { useId, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Info,
  Link2,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { VatBdConfig } from "@/data/rates.schema";
import { calculateVatAit } from "@/lib/calculators/vatAit";
import {
  formatBDT,
  formatBDTInWords,
  formatSouthAsianNumber,
  toBanglaDigits,
} from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: VatBdConfig;
}

const DEFAULT_AMOUNT = 10000;

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function parseAmount(raw: string): number {
  const digits = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  const n = Number.parseFloat(digits);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 1_000_000_000);
}

function parseRate(raw: string): number {
  const clean = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  const n = Number.parseFloat(clean);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 100);
}

export function VatAitCalculatorClient({ config }: Props) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const fmt = (v: number) => formatBDT(v, { decimals: 2, locale });

  const amountId = useId();
  const vatId = useId();
  const aitSwitchId = useId();

  const [amount, setAmount] = useState<number>(DEFAULT_AMOUNT);
  const [vatRateText, setVatRateText] = useState<string>(
    String(config.standardRate)
  );
  const [includeAit, setIncludeAit] = useState(false);
  const [aitRate, setAitRate] = useState<number>(5);
  const [copied, setCopied] = useState<"summary" | "link" | null>(null);

  const vatRatePercent = parseRate(vatRateText);

  const result = useMemo(
    () =>
      calculateVatAit({
        amount,
        vatRatePercent,
        aitRatePercent: includeAit ? aitRate : 0,
      }),
    [amount, vatRatePercent, includeAit, aitRate]
  );

  const flashCopied = (kind: "summary" | "link") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleCopySummary = async () => {
    const lines = [
      `BD VAT (${result.vatRatePercent}%) Summary — Tools BD`,
      `Entered Amount: ${formatBDT(result.amount, { decimals: 2 })}`,
      "",
      `[Add VAT — Exclusive]`,
      `Base: ${formatBDT(result.exclusive.baseAmount, { decimals: 2 })} | VAT: ${formatBDT(result.exclusive.vatAmount, { decimals: 2 })} | Total: ${formatBDT(result.exclusive.totalWithVat, { decimals: 2 })}`,
      "",
      `[Remove VAT — Inclusive]`,
      `Base without VAT: ${formatBDT(result.inclusive.baseWithoutVat, { decimals: 2 })} | VAT inside: ${formatBDT(result.inclusive.vatInside, { decimals: 2 })}`,
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
      url.searchParams.set("amount", String(amount));
      url.searchParams.set("vat", String(vatRatePercent));
      await navigator.clipboard.writeText(url.toString());
      flashCopied("link");
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setAmount(DEFAULT_AMOUNT);
    setVatRateText(String(config.standardRate));
    setIncludeAit(false);
    setAitRate(5);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:items-start">
      {/* Input Panel */}
      <aside className="lg:sticky lg:top-24">
        <div className={`${card} p-5 sm:p-6`}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={amountId}
                className="text-sm font-semibold text-slate-900 dark:text-white"
              >
                {t("Amount (BDT)", "টাকার পরিমাণ")}
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                  ৳
                </span>
                <input
                  id={amountId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount > 0 ? formatSouthAsianNumber(amount) : ""}
                  onChange={(e) => setAmount(parseAmount(e.target.value))}
                  placeholder="10,000"
                  className="h-13 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xl font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <p className="mt-1 min-h-[1.1rem] text-xs text-slate-500 dark:text-slate-400">
                {amount > 0 ? formatBDTInWords(amount, locale) : ""}
              </p>
            </div>

            <div>
              <label
                htmlFor={vatId}
                className="text-sm font-semibold text-slate-900 dark:text-white"
              >
                {t("VAT rate (%)", "ভ্যাট হার (%)")}
              </label>
              <div className="relative mt-1.5">
                <input
                  id={vatId}
                  type="text"
                  inputMode="decimal"
                  value={vatRateText}
                  onChange={(e) => setVatRateText(e.target.value)}
                  placeholder="15"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-9 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  %
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {config.presets.map((p) => {
                  const active = vatRatePercent === p.rate;
                  return (
                    <button
                      key={p.rate}
                      type="button"
                      onClick={() => setVatRateText(String(p.rate))}
                      className={`h-9 rounded-lg border px-2.5 text-xs font-semibold tabular-nums transition-colors ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {isBn ? `${toBanglaDigits(p.rate)}%` : `${p.rate}%`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Optional AIT / VDS Withholding */}
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id={aitSwitchId} className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("Include AIT withholding (B2B)", "এআইটি (AIT) কর্তন যোগ করুন")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("For vendor bills & treasury challans", "ভেন্ডর বিল ও সরকারি চালানের জন্য")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeAit}
                aria-labelledby={aitSwitchId}
                onClick={() => setIncludeAit((v) => !v)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  includeAit ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    includeAit ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {includeAit && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {config.aitPresets
                  .filter((r) => r > 0)
                  .map((r) => {
                    const active = aitRate === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAitRate(r)}
                        className={`h-9 rounded-lg border px-3 text-xs font-semibold tabular-nums transition-colors ${
                          active
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        AIT {isBn ? `${toBanglaDigits(r)}%` : `${r}%`}
                      </button>
                    );
                  })}
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

      {/* Results — Both Add VAT and Remove VAT Simultaneously */}
      <section aria-live="polite" className="min-w-0 space-y-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Card 1: Add VAT (Exclusive -> Inclusive) */}
          <article className={`${card} border-emerald-500/50 p-6 ring-4 ring-emerald-500/5`}>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              {t("Add VAT (VAT Exclusive)", "ভ্যাট যোগ (মূল মূল্যের ওপর)")}
            </span>
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("Total price with VAT added", "ভ্যাটসহ মোট মূল্য")}
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-4xl dark:text-white">
              {fmt(result.exclusive.totalWithVat)}
            </p>

            <dl className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{t("Base amount", "মূল অঙ্ক")}</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {fmt(result.exclusive.baseAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">
                  {t(`VAT (${vatRatePercent}%)`, `ভ্যাট (${toBanglaDigits(vatRatePercent)}%)`)}
                </dt>
                <dd className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{fmt(result.exclusive.vatAmount)}
                </dd>
              </div>
              {includeAit && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">
                      {t(`AIT (${aitRate}%)`, `এআইটি (${toBanglaDigits(aitRate)}%)`)}
                    </dt>
                    <dd className="font-semibold tabular-nums text-indigo-700 dark:text-indigo-400">
                      {fmt(result.exclusive.aitAmount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <dt className="text-slate-500 dark:text-slate-400">{t("Treasury challan (VDS+AIT)", "সরকারি চালান")}</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {fmt(result.exclusive.totalTreasuryChallan)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-medium text-slate-700 dark:text-slate-300">{t("Net payable to vendor", "ভেন্ডরকে নিট পেমেন্ট")}</dt>
                    <dd className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {fmt(result.exclusive.netVendorPayableAfterVdsAit)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </article>

          {/* Card 2: Remove VAT (Inclusive -> Exclusive) */}
          <article className={`${card} p-6`}>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
              {t("Remove VAT (Already VAT Inclusive)", "ভ্যাট বিয়োগ (মোট অঙ্কের ভেতর থেকে)")}
            </span>
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("Price without VAT (Base value)", "ভ্যাট বাদে মূল মূল্য")}
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-4xl dark:text-white">
              {fmt(result.inclusive.baseWithoutVat)}
            </p>

            <dl className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{t("Gross total", "ভ্যাটসহ মোট")}</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {fmt(result.inclusive.grossAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">
                  {t(`VAT inside (${vatRatePercent}%)`, `ভেতরের ভ্যাট (${toBanglaDigits(vatRatePercent)}%)`)}
                </dt>
                <dd className="font-semibold tabular-nums text-indigo-700 dark:text-indigo-400">
                  {fmt(result.inclusive.vatInside)}
                </dd>
              </div>
              {includeAit && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">
                      {t(`AIT on base (${aitRate}%)`, `মূল অঙ্কে এআইটি (${toBanglaDigits(aitRate)}%)`)}
                    </dt>
                    <dd className="font-semibold tabular-nums text-indigo-700 dark:text-indigo-400">
                      {fmt(result.inclusive.aitAmount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <dt className="text-slate-500 dark:text-slate-400">{t("Treasury challan (VDS+AIT)", "সরকারি চালান")}</dt>
                    <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {fmt(result.inclusive.totalTreasuryChallan)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-medium text-slate-700 dark:text-slate-300">{t("Net payable to vendor", "ভেন্ডরকে নিট পেমেন্ট")}</dt>
                    <dd className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {fmt(result.inclusive.netVendorPayableAfterVdsAit)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </article>
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
      </section>
    </div>
  );
}

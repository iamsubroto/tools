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
  TriangleAlert,
} from "lucide-react";
import {
  calculateDiscount,
  calculateOrderMargin,
} from "@/lib/calculators/discountMargin";
import {
  formatBDT,
  formatBDTInWords,
  formatSouthAsianNumber,
  toBanglaDigits,
} from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

type Mode = "discount" | "margin";

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function parseNum(raw: string, max = 1_000_000_000): number {
  const clean = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  const n = Number.parseFloat(clean);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export function DiscountMarginCalculatorClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const fmt = (v: number, decimals = 0) => formatBDT(v, { decimals, locale });

  const priceId = useId();
  const discId = useId();
  const extraId = useId();
  const vatId = useId();
  const sellId = useId();
  const costId = useId();
  const delivId = useId();
  const codId = useId();
  const adId = useId();

  const [mode, setMode] = useState<Mode>("discount");

  // Discount state
  const [originalPrice, setOriginalPrice] = useState<number>(2500);
  const [discountText, setDiscountText] = useState<string>("20");
  const [extraText, setExtraText] = useState<string>("0");
  const [vatText, setVatText] = useState<string>("0");

  // Margin state
  const [sellingPrice, setSellingPrice] = useState<number>(1500);
  const [productCost, setProductCost] = useState<number>(700);
  const [deliveryCost, setDeliveryCost] = useState<number>(120);
  const [codText, setCodText] = useState<string>("1");
  const [adCost, setAdCost] = useState<number>(200);

  const [copied, setCopied] = useState<"summary" | "link" | null>(null);

  const discountRes = useMemo(
    () =>
      calculateDiscount({
        originalPrice,
        discountPercent: parseNum(discountText, 100),
        extraDiscountPercent: parseNum(extraText, 100),
        vatPercent: parseNum(vatText, 100),
      }),
    [originalPrice, discountText, extraText, vatText]
  );

  const marginRes = useMemo(
    () =>
      calculateOrderMargin({
        sellingPrice,
        productCost,
        deliveryAndPackaging: deliveryCost,
        codChargePercent: parseNum(codText, 50),
        adCostPerOrder: adCost,
      }),
    [sellingPrice, productCost, deliveryCost, codText, adCost]
  );

  const flashCopied = (kind: "summary" | "link") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const handleCopySummary = async () => {
    const lines =
      mode === "discount"
        ? [
            "Discount Summary — Tools BD",
            `Original Price: ${formatBDT(discountRes.originalPrice)}`,
            `Discount: ${discountRes.effectiveDiscountPercent.toFixed(1)}% (Save ${formatBDT(discountRes.totalSavings)})`,
            `Final Price: ${formatBDT(discountRes.finalPayable)}`,
          ]
        : [
            "F-Commerce Order Margin Summary — Tools BD",
            `Selling Price: ${formatBDT(marginRes.sellingPrice)}`,
            `Total Cost: ${formatBDT(marginRes.totalCost)}`,
            `Net Profit: ${formatBDT(marginRes.netProfit)} (${marginRes.profitMarginPercent.toFixed(1)}% margin)`,
            `Break-Even Price: ${formatBDT(Math.ceil(marginRes.breakEvenPrice))}`,
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
      url.searchParams.set("mode", mode);
      await navigator.clipboard.writeText(url.toString());
      flashCopied("link");
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setOriginalPrice(2500);
    setDiscountText("20");
    setExtraText("0");
    setVatText("0");
    setSellingPrice(1500);
    setProductCost(700);
    setDeliveryCost(120);
    setCodText("1");
    setAdCost(200);
  };

  const activeInsights =
    mode === "discount" ? discountRes.smartInsights : marginRes.smartInsights;

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div
        role="tablist"
        aria-label={t("Calculator mode", "ক্যালকুলেটর মোড")}
        className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "discount"}
          onClick={() => setMode("discount")}
          className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold transition-all ${
            mode === "discount"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          {t("Discount Calculator", "ডিসকাউন্ট ক্যালকুলেটর")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "margin"}
          onClick={() => setMode("margin")}
          className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold transition-all ${
            mode === "margin"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          {t("SME / F-Commerce Margin", "ব্যবসা / এফ-কমার্স লাভ")}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:items-start">
        {/* Inputs */}
        <aside className="lg:sticky lg:top-24">
          <div className={`${card} p-5 sm:p-6`}>
            {mode === "discount" ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor={priceId} className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("Original price (BDT)", "আসল দাম (টাকা)")}
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">৳</span>
                    <input
                      id={priceId}
                      type="text"
                      inputMode="decimal"
                      value={originalPrice > 0 ? formatSouthAsianNumber(originalPrice) : ""}
                      onChange={(e) => setOriginalPrice(parseNum(e.target.value))}
                      placeholder="2,500"
                      className="h-13 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xl font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 min-h-[1.1rem] text-xs text-slate-500 dark:text-slate-400">
                    {originalPrice > 0 ? formatBDTInWords(originalPrice, locale) : ""}
                  </p>
                </div>

                <div>
                  <label htmlFor={discId} className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("Discount (%)", "ছাড় (%)")}
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id={discId}
                      type="text"
                      inputMode="decimal"
                      value={discountText}
                      onChange={(e) => setDiscountText(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-8 text-lg font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-6 gap-1.5">
                    {DISCOUNT_PRESETS.map((pct) => {
                      const active = parseNum(discountText, 100) === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountText(String(pct))}
                          className={`h-9 rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                            active
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {isBn ? `${toBanglaDigits(pct)}%` : `${pct}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div>
                    <label htmlFor={extraId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("Extra coupon (%)", "অতিরিক্ত কুপন (%)")}
                    </label>
                    <input
                      id={extraId}
                      type="text"
                      inputMode="decimal"
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={vatId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("VAT after discount (%)", "ভ্যাট (%)")}
                    </label>
                    <input
                      id={vatId}
                      type="text"
                      inputMode="decimal"
                      value={vatText}
                      onChange={(e) => setVatText(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label htmlFor={sellId} className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("Selling price (BDT)", "বিক্রয়মূল্য (টাকা)")}
                  </label>
                  <input
                    id={sellId}
                    type="text"
                    inputMode="numeric"
                    value={sellingPrice > 0 ? formatSouthAsianNumber(sellingPrice) : ""}
                    onChange={(e) => setSellingPrice(parseNum(e.target.value))}
                    className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-lg font-bold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={costId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("Product cost (৳)", "পণ্যের ক্রয়মূল্য")}
                    </label>
                    <input
                      id={costId}
                      type="text"
                      inputMode="numeric"
                      value={productCost > 0 ? formatSouthAsianNumber(productCost) : ""}
                      onChange={(e) => setProductCost(parseNum(e.target.value))}
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={delivId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("Delivery + Pkg (৳)", "ডেলিভারি + প্যাকেজিং")}
                    </label>
                    <input
                      id={delivId}
                      type="text"
                      inputMode="numeric"
                      value={deliveryCost > 0 ? formatSouthAsianNumber(deliveryCost) : ""}
                      onChange={(e) => setDeliveryCost(parseNum(e.target.value))}
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={codId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("COD charge (%)", "সিওডি চার্জ (%)")}
                    </label>
                    <input
                      id={codId}
                      type="text"
                      inputMode="decimal"
                      value={codText}
                      onChange={(e) => setCodText(e.target.value)}
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={adId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("Ad cost / order (৳)", "বিজ্ঞাপন খরচ / অর্ডার")}
                    </label>
                    <input
                      id={adId}
                      type="text"
                      inputMode="numeric"
                      value={adCost > 0 ? formatSouthAsianNumber(adCost) : ""}
                      onChange={(e) => setAdCost(parseNum(e.target.value))}
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
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

        {/* Results */}
        <section aria-live="polite" className="min-w-0 space-y-6">
          {mode === "discount" ? (
            <div className={`${card} p-6`}>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("Final price you pay", "ছাড়ের পর আপনার পরিশোধ")}
              </p>
              <p className="mt-1.5 text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-5xl dark:text-white">
                {fmt(discountRes.finalPayable, 2)}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                {t("You save", "আপনার সাশ্রয়")}: {fmt(discountRes.totalSavings, 2)} (
                {isBn
                  ? toBanglaDigits(discountRes.effectiveDiscountPercent.toFixed(1))
                  : discountRes.effectiveDiscountPercent.toFixed(1)}
                %)
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3 dark:border-slate-800">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Original price", "আসল দাম")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {fmt(discountRes.originalPrice, 2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Total discount", "মোট ছাড়")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    -{fmt(discountRes.totalSavings, 2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("VAT added", "ভ্যাট")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    +{fmt(discountRes.vatAmount, 2)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className={`${card} p-6`}>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("Net profit per order", "প্রতি অর্ডারে নিট লাভ")}
              </p>
              <p
                className={`mt-1.5 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl ${
                  marginRes.netProfit >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {fmt(marginRes.netProfit, 0)}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4 dark:border-slate-800">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Profit margin", "লাভের মার্জিন")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {marginRes.profitMarginPercent.toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Markup", "মার্কআপ")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {marginRes.markupPercent.toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Total cost", "মোট খরচ")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {fmt(marginRes.totalCost, 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t("Break-even price", "ব্রেক-ইভেন দাম")}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {fmt(Math.ceil(marginRes.breakEvenPrice), 0)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {activeInsights.length > 0 && (
            <div className="space-y-3">
              {activeInsights.map((ins) => {
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
        </section>
      </div>
    </div>
  );
}

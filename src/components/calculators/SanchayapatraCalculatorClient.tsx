"use client";

import { useId, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Separator,
  Switch,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  AlertTriangle,
  Check,
  Copy,
  Info,
  Link2,
  Printer,
  RotateCcw,
  Sparkles,
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
  toBanglaDigits,
} from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

interface SanchayapatraCalculatorClientProps {
  config: SanchayapatraConfig;
}

const PRESET_AMOUNTS = [
  { value: 100000, labelEn: "৳1 Lakh", labelBn: "১ লক্ষ" },
  { value: 500000, labelEn: "৳5 Lakh", labelBn: "৫ লক্ষ" },
  { value: 750000, labelEn: "৳7.5 Lakh", labelBn: "৭.৫ লক্ষ" },
  { value: 1000000, labelEn: "৳10 Lakh", labelBn: "১০ লক্ষ" },
  { value: 2000000, labelEn: "৳20 Lakh", labelBn: "২০ লক্ষ" },
  { value: 3000000, labelEn: "৳30 Lakh", labelBn: "৩০ লক্ষ" },
];

function parseAmountInput(raw: string): number {
  const normalized = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^\d]/g, "");
  if (!normalized) return 0;
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 100_000_000);
}

export function SanchayapatraCalculatorClient({
  config,
}: SanchayapatraCalculatorClientProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const amountInputId = useId();
  const existingInputId = useId();

  const [amountText, setAmountText] = useState<string>("500000");
  const [hasExisting, setHasExisting] = useState<boolean>(false);
  const [existingText, setExistingText] = useState<string>("0");
  const [copiedType, setCopiedType] = useState<"summary" | "link" | null>(null);

  const investmentAmount = parseAmountInput(amountText);
  const existingHoldings = hasExisting ? parseAmountInput(existingText) : 0;

  const result = useMemo(
    () =>
      calculateAllSanchayapatra(
        { investmentAmount, existingHoldings },
        config
      ),
    [investmentAmount, existingHoldings, config]
  );

  const handleReset = () => {
    setAmountText("500000");
    setHasExisting(false);
    setExistingText("0");
  };

  const handleCopySummary = async () => {
    const lines = [
      `Tools BD — Sanchayapatra Profit Summary`,
      `Investment: ${formatBDT(result.investmentAmount)}${
        result.existingHoldings > 0
          ? ` (Existing: ${formatBDT(result.existingHoldings)}, Cumulative: ${formatBDT(result.cumulativeTotal)})`
          : ""
      }`,
      `Profit Slab: ${result.appliedTier === "tier1" ? "Up to ৳7.5 Lakh" : "Above ৳7.5 Lakh"}`,
      "",
      ...result.schemes.map((s) => {
        const rateStr = `${(s.annualRate * 100).toFixed(2)}%`;
        const taxStr = `${(s.taxRate * 100).toFixed(0)}% TDS`;
        if (s.payoutFrequency === "quarterly") {
          return `• ${s.nameEn} (${rateStr}, ${taxStr}): ${formatBDT(s.netMonthly, { decimals: 0 })}/mo equivalent | ${formatBDT(s.netQuarterly, { decimals: 0 })} every 3 months`;
        }
        if (s.payoutFrequency === "maturity") {
          return `• ${s.nameEn} (${rateStr}, ${taxStr}): ${formatBDT(s.netMonthly, { decimals: 0 })}/mo equivalent | ${formatBDT(s.totalNetProfit, { decimals: 0 })} total net profit (5 yrs)`;
        }
        return `• ${s.nameEn} (${rateStr}, ${taxStr}): ${formatBDT(s.netMonthly, { decimals: 0 })}/month net`;
      }),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedType("summary");
      window.setTimeout(() => setCopiedType(null), 2200);
    } catch {
      // Ignore clipboard failures in restricted environments
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("amount", String(investmentAmount));
      if (existingHoldings > 0) {
        url.searchParams.set("existing", String(existingHoldings));
      } else {
        url.searchParams.delete("existing");
      }
      await navigator.clipboard.writeText(url.toString());
      setCopiedType("link");
      window.setTimeout(() => setCopiedType(null), 2200);
    } catch {
      // Ignore
    }
  };

  const fmt = (val: number, decimals = 0) =>
    formatBDT(val, { decimals, locale });

  return (
    <section
      aria-label={
        isBn ? "সঞ্চয়পত্র মুনাফা ক্যালকুলেটর" : "Sanchayapatra Profit Calculator"
      }
      className="space-y-6"
    >
      {/* Input Card — Above the Fold */}
      <Card size="3" className="border border-[var(--gray-5)]">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-md space-y-2">
              <label
                htmlFor={amountInputId}
                className="block text-sm font-semibold text-[var(--gray-12)]"
              >
                {isBn
                  ? "আপনি কত টাকা বিনিয়োগ করতে চান? (BDT)"
                  : "How much do you want to invest? (BDT)"}
              </label>

              <TextField.Root
                id={amountInputId}
                size="3"
                type="text"
                inputMode="numeric"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder={isBn ? "যেমন: 500000" : "e.g. 500000"}
                className="tabular-nums text-lg font-semibold"
              >
                <TextField.Slot className="font-bold text-[var(--accent-11)]">
                  ৳
                </TextField.Slot>
              </TextField.Root>

              <Text as="p" size="2" color="gray" className="tabular-nums">
                {fmt(investmentAmount)} —{" "}
                <span className="font-medium text-[var(--gray-11)]">
                  {formatBDTInWords(investmentAmount, locale)}
                </span>
              </Text>
            </div>

            {/* Active Slab & Tax Status Pill */}
            <Flex wrap="wrap" gap="2" align="center">
              <Badge
                size="2"
                variant="soft"
                color={result.appliedTier === "tier1" ? "jade" : "blue"}
              >
                {result.appliedTier === "tier1"
                  ? isBn
                    ? "স্ল্যাব ১: ≤ ৭.৫ লক্ষ"
                    : "Slab 1: ≤ ৳7.5 Lakh"
                  : isBn
                    ? "স্ল্যাব ২: > ৭.৫ লক্ষ"
                    : "Slab 2: > ৳7.5 Lakh"}
              </Badge>
              <Badge
                size="2"
                variant="soft"
                color={
                  result.cumulativeTotal <= config.taxCutoffBdt
                    ? "jade"
                    : "amber"
                }
              >
                {result.cumulativeTotal <= config.taxCutoffBdt
                  ? isBn
                    ? "উৎস কর: ০% (পেনশনার) / ৫%"
                    : "Tax: 0% (Pensioner) / 5%"
                  : isBn
                    ? "উৎস কর: ১০% (৫ লক্ষ+)"
                    : "Tax: 10% (> ৳5 Lakh)"}
              </Badge>
            </Flex>
          </div>

          {/* Quick-Fill Preset Chips */}
          <div className="space-y-1.5">
            <Text as="p" size="1" color="gray" weight="medium">
              {isBn ? "দ্রুত নির্বাচন করুন:" : "Quick amounts:"}
            </Text>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => {
                const isActive = investmentAmount === preset.value;
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    size="2"
                    variant={isActive ? "solid" : "soft"}
                    color={isActive ? "jade" : "gray"}
                    onClick={() => setAmountText(String(preset.value))}
                    className="min-h-[40px] cursor-pointer tabular-nums"
                  >
                    {isBn ? preset.labelBn : preset.labelEn}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator size="4" />

          {/* Optional Cumulative Existing Holdings Toggle + Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Flex align="center" gap="2">
                <Switch
                  id={existingInputId}
                  checked={hasExisting}
                  onCheckedChange={setHasExisting}
                  className="cursor-pointer"
                />
                <label
                  htmlFor={existingInputId}
                  className="cursor-pointer text-sm text-[var(--gray-11)]"
                >
                  {isBn
                    ? "আমার আগে থেকেই সঞ্চয়পত্র কেনা আছে (সঠিক স্ল্যাব ও করের জন্য)"
                    : "I already hold existing Sanchayapatra (for exact ৳5L tax & ৳7.5L slab)"}
                </label>
              </Flex>

              {hasExisting && (
                <div className="max-w-xs space-y-1">
                  <TextField.Root
                    size="2"
                    type="text"
                    inputMode="numeric"
                    value={existingText}
                    onChange={(e) => setExistingText(e.target.value)}
                    placeholder="e.g. 500000"
                    aria-label={
                      isBn
                        ? "পূর্বের সঞ্চয়পত্রের পরিমাণ"
                        : "Existing Sanchayapatra holdings in BDT"
                    }
                    className="tabular-nums"
                  >
                    <TextField.Slot>৳</TextField.Slot>
                  </TextField.Root>
                  <Text as="p" size="1" color="gray" className="tabular-nums">
                    {isBn
                      ? `মোট সঞ্চয়পত্র: ${fmt(result.cumulativeTotal)}`
                      : `Cumulative total: ${fmt(result.cumulativeTotal)}`}
                  </Text>
                </div>
              )}
            </div>

            {/* Share / Copy / Print / Reset Actions */}
            <Flex wrap="wrap" gap="2" className="print:hidden">
              <Button
                type="button"
                variant="soft"
                color="gray"
                size="2"
                onClick={handleCopySummary}
                className="min-h-[40px] cursor-pointer"
              >
                {copiedType === "summary" ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copiedType === "summary"
                  ? isBn
                    ? "কপি হয়েছে"
                    : "Copied"
                  : isBn
                    ? "সারাংশ কপি"
                    : "Copy Summary"}
              </Button>
              <Button
                type="button"
                variant="soft"
                color="gray"
                size="2"
                onClick={handleCopyLink}
                className="min-h-[40px] cursor-pointer"
              >
                {copiedType === "link" ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                )}
                {copiedType === "link"
                  ? isBn
                    ? "লিংক কপি হয়েছে"
                    : "Link Copied"
                  : isBn
                    ? "লিংক শেয়ার"
                    : "Share Link"}
              </Button>
              <Button
                type="button"
                variant="soft"
                color="gray"
                size="2"
                onClick={() => window.print()}
                className="min-h-[40px] cursor-pointer"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                {isBn ? "প্রিন্ট / PDF" : "Print / PDF"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                color="gray"
                size="2"
                onClick={handleReset}
                className="min-h-[40px] cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {isBn ? "রিসেট" : "Reset"}
              </Button>
            </Flex>
          </div>
        </div>
      </Card>

      {/* All 4 Sanchayapatra Scheme Cards Side-by-Side */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Heading as="h2" size="5">
            {isBn
              ? `৪টি সঞ্চয়পত্রের নিট মুনাফার তুলনা (${fmt(investmentAmount)} বিনিয়োগে)`
              : `Net Profit Across All 4 Sanchayapatra Schemes (${fmt(investmentAmount)})`}
          </Heading>
          <Text size="2" color="gray">
            {isBn
              ? "সকল অঙ্ক উৎস কর (TDS) বাদে নিট হিসাব"
              : "All highlighted payouts are net after source tax (TDS)"}
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {result.schemes.map((scheme) => (
            <SchemeResultCard
              key={scheme.id}
              scheme={scheme}
              isTopMonthly={
                investmentAmount > 0 &&
                scheme.id === result.highestMonthlySchemeId
              }
              locale={locale}
            />
          ))}
        </div>
      </div>

      {/* Smart Money Insights */}
      {result.smartInsights.length > 0 && (
        <div className="space-y-2.5">
          {result.smartInsights.map((insight) => (
            <Callout.Root
              key={insight.id}
              color={
                insight.tone === "positive"
                  ? "jade"
                  : insight.tone === "warning"
                    ? "amber"
                    : "blue"
              }
              variant="soft"
              size="2"
            >
              <Callout.Icon>
                {insight.tone === "positive" ? (
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                ) : insight.tone === "warning" ? (
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Info className="h-4 w-4" aria-hidden="true" />
                )}
              </Callout.Icon>
              <Callout.Text>
                <strong className="font-semibold">
                  {isBn ? insight.titleBn : insight.titleEn}:{" "}
                </strong>
                {isBn ? insight.bodyBn : insight.bodyEn}
              </Callout.Text>
            </Callout.Root>
          ))}
        </div>
      )}

      {/* Side-by-Side Quick Comparison Table */}
      <Card size="2" className="overflow-hidden border border-[var(--gray-5)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Heading as="h3" size="4">
            {isBn
              ? "এক নজরে ৪টি সঞ্চয়পত্রের তুলনা"
              : "Side-by-Side Monthly & Payout Comparison"}
          </Heading>
        </div>
        <div className="overflow-x-auto">
          <Table.Root variant="surface" size="2">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>
                  {isBn ? "সঞ্চয়পত্রের ধরন" : "Scheme"}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  {isBn ? "মুনাফার হার" : "Rate"}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  {isBn ? "উৎস কর" : "Tax"}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  {isBn ? "প্রতি মাসে (নিট)" : "Per Month (Net)"}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  {isBn ? "হাতে পাওয়ার সময় ও অঙ্ক" : "Actual Payout"}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  {isBn ? "মেয়াদান্তে মোট নিট মুনাফা" : "Full-Term Net Profit"}
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {result.schemes.map((s) => (
                <Table.Row key={s.id}>
                  <Table.RowHeaderCell className="font-medium">
                    {isBn ? s.nameBn : s.nameEn}
                  </Table.RowHeaderCell>
                  <Table.Cell align="right" className="tabular-nums">
                    {formatPercent(s.annualRate, { locale })}
                  </Table.Cell>
                  <Table.Cell align="right" className="tabular-nums">
                    {formatPercent(s.taxRate, { decimals: 0, locale })}
                  </Table.Cell>
                  <Table.Cell
                    align="right"
                    className="tabular-nums font-semibold text-[var(--accent-11)]"
                  >
                    {fmt(s.netMonthly, 0)}
                  </Table.Cell>
                  <Table.Cell align="right" className="tabular-nums">
                    {s.payoutFrequency === "monthly" && (
                      <span>
                        {fmt(s.netMonthly, 0)}{" "}
                        <Text size="1" color="gray">
                          /{isBn ? "মাস" : "mo"}
                        </Text>
                      </span>
                    )}
                    {s.payoutFrequency === "quarterly" && (
                      <span>
                        <strong>{fmt(s.netQuarterly, 0)}</strong>{" "}
                        <Text size="1" color="gray">
                          /{isBn ? "৩ মাস" : "3 mo"}
                        </Text>
                      </span>
                    )}
                    {s.payoutFrequency === "maturity" && (
                      <span>
                        {fmt(s.totalNetProfit, 0)}{" "}
                        <Text size="1" color="gray">
                          ({isBn ? "৫ বছর পর" : "at 5 yrs"})
                        </Text>
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell align="right" className="tabular-nums">
                    {fmt(s.totalNetProfit, 0)}{" "}
                    <Text size="1" color="gray">
                      ({isBn ? `${toBanglaDigits(s.termYears)} বছর` : `${s.termYears} yrs`})
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </div>
      </Card>
    </section>
  );
}

function SchemeResultCard({
  scheme,
  isTopMonthly,
  locale,
}: {
  scheme: SanchayapatraSchemeResult;
  isTopMonthly: boolean;
  locale: "en" | "bn";
}) {
  const isBn = locale === "bn";
  const fmt = (val: number, decimals = 0) =>
    formatBDT(val, { decimals, locale });

  const payoutBadgeText =
    scheme.payoutFrequency === "monthly"
      ? isBn
        ? "মাসিক মুনাফা"
        : "Monthly Payout"
      : scheme.payoutFrequency === "quarterly"
        ? isBn
          ? "৩-মাস পরপর মুনাফা"
          : "Every 3 Months"
        : isBn
          ? "মেয়াদান্তে মুনাফা"
          : "Paid at Maturity";

  return (
    <Card
      size="3"
      className={`flex flex-col justify-between border ${
        isTopMonthly
          ? "border-[var(--accent-8)] bg-[var(--accent-2)]/30"
          : "border-[var(--gray-5)]"
      }`}
    >
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <Heading as="h3" size="4" className="leading-snug">
              {isBn ? scheme.nameBn : scheme.nameEn}
            </Heading>
            <Flex wrap="wrap" gap="1.5" align="center">
              <Badge size="1" variant="soft" color="gray">
                {isBn
                  ? `${toBanglaDigits(scheme.termYears)} বছর মেয়াদ`
                  : `${scheme.termYears}-Year Term`}
              </Badge>
              <Badge
                size="1"
                variant="soft"
                color={scheme.payoutFrequency === "quarterly" ? "blue" : "jade"}
              >
                {payoutBadgeText}
              </Badge>
              {isTopMonthly && (
                <Badge size="1" variant="solid" color="jade">
                  {isBn ? "সর্বোচ্চ মাসিক" : "Highest Monthly"}
                </Badge>
              )}
              {scheme.exceedsSingleLimit && (
                <Badge size="1" variant="soft" color="amber">
                  {isBn
                    ? `একক সীমা ${fmt(scheme.maxSingleLimit)} অতিক্রম`
                    : `Over ${fmt(scheme.maxSingleLimit)} limit`}
                </Badge>
              )}
            </Flex>
          </div>

          <div className="text-right tabular-nums">
            <Text as="div" size="3" weight="bold" color="jade">
              {formatPercent(scheme.annualRate, { locale })}
            </Text>
            <Text as="div" size="1" color="gray">
              {isBn
                ? `কর ${formatPercent(scheme.taxRate, { decimals: 0, locale })}`
                : `${formatPercent(scheme.taxRate, { decimals: 0, locale })} Tax`}
            </Text>
          </div>
        </div>

        {/* Primary Payout Highlight Box */}
        {scheme.payoutFrequency === "quarterly" ? (
          <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-3)] border border-[var(--gray-4)] bg-[var(--gray-2)] p-3.5">
            <div>
              <Text as="p" size="1" color="gray" weight="medium">
                {isBn ? "প্রতি মাসে (গড় নিট)" : "Per Month (Net Avg)"}
              </Text>
              <Text
                as="p"
                size="5"
                weight="bold"
                className="tabular-nums text-[var(--accent-11)]"
              >
                {fmt(scheme.netMonthly, 0)}
              </Text>
              <Text as="p" size="1" color="gray" className="tabular-nums">
                {isBn
                  ? `কর: -${fmt(scheme.monthlyTax, 0)}/মাস`
                  : `Tax: -${fmt(scheme.monthlyTax, 0)}/mo`}
              </Text>
            </div>
            <div className="border-l border-[var(--gray-5)] pl-3">
              <Text as="p" size="1" color="gray" weight="medium">
                {isBn ? "প্রতি ৩ মাসে পাবেন (নিট)" : "Every 3 Months (Payout)"}
              </Text>
              <Text
                as="p"
                size="5"
                weight="bold"
                className="tabular-nums text-[var(--gray-12)]"
              >
                {fmt(scheme.netQuarterly, 0)}
              </Text>
              <Text as="p" size="1" color="gray" className="tabular-nums">
                {isBn
                  ? `মোট: ${fmt(scheme.grossQuarterly, 0)} − কর ${fmt(scheme.quarterlyTax, 0)}`
                  : `Gross ${fmt(scheme.grossQuarterly, 0)} − Tax ${fmt(scheme.quarterlyTax, 0)}`}
              </Text>
            </div>
          </div>
        ) : scheme.payoutFrequency === "maturity" ? (
          <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-3)] border border-[var(--gray-4)] bg-[var(--gray-2)] p-3.5">
            <div>
              <Text as="p" size="1" color="gray" weight="medium">
                {isBn ? "প্রতি মাসে (গড় নিট)" : "Per Month (Net Avg)"}
              </Text>
              <Text
                as="p"
                size="5"
                weight="bold"
                className="tabular-nums text-[var(--accent-11)]"
              >
                {fmt(scheme.netMonthly, 0)}
              </Text>
              <Text as="p" size="1" color="gray" className="tabular-nums">
                {isBn
                  ? `কর: -${fmt(scheme.monthlyTax, 0)}/মাস`
                  : `Tax: -${fmt(scheme.monthlyTax, 0)}/mo`}
              </Text>
            </div>
            <div className="border-l border-[var(--gray-5)] pl-3">
              <Text as="p" size="1" color="gray" weight="medium">
                {isBn ? "প্রতি বছর (নিট)" : "Per Year (Net)"}
              </Text>
              <Text
                as="p"
                size="5"
                weight="bold"
                className="tabular-nums text-[var(--gray-12)]"
              >
                {fmt(scheme.netAnnual, 0)}
              </Text>
              <Text as="p" size="1" color="gray" className="tabular-nums">
                {isBn ? "৫ বছর শেষে একত্রে" : "Paid at 5-yr maturity"}
              </Text>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-3)] border border-[var(--gray-4)] bg-[var(--gray-2)] p-3.5">
            <Text as="p" size="1" color="gray" weight="medium">
              {isBn
                ? "প্রতি মাসে হাতে পাবেন (উৎস কর বাদে নিট)"
                : "Net Monthly Payout (After Source Tax)"}
            </Text>
            <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-2">
              <Text
                as="p"
                size="6"
                weight="bold"
                className="tabular-nums text-[var(--accent-11)]"
              >
                {fmt(scheme.netMonthly, 0)}
                <Text size="2" weight="regular" color="gray">
                  /{isBn ? "মাস" : "mo"}
                </Text>
              </Text>
              <Text as="p" size="1" color="gray" className="tabular-nums">
                {isBn
                  ? `মোট ${fmt(scheme.grossMonthly, 0)} − কর ${fmt(scheme.monthlyTax, 0)}`
                  : `Gross ${fmt(scheme.grossMonthly, 0)} − Tax ${fmt(scheme.monthlyTax, 0)}`}
              </Text>
            </div>
          </div>
        )}

        {/* Secondary Metrics Grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
          <div>
            <dt className="text-[var(--gray-10)]">
              {isBn ? "বার্ষিক নিট মুনাফা" : "Annual Net Profit"}
            </dt>
            <dd className="tabular-nums font-semibold text-[var(--gray-12)]">
              {fmt(scheme.netAnnual, 0)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--gray-10)]">
              {isBn
                ? `${toBanglaDigits(scheme.termYears)} বছরে মোট নিট মুনাফা`
                : `Total ${scheme.termYears}-Yr Net Profit`}
            </dt>
            <dd className="tabular-nums font-semibold text-[var(--gray-12)]">
              {fmt(scheme.totalNetProfit, 0)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--gray-10)]">
              {isBn ? "মোট উৎস কর কাটা" : "Total Tax Deducted"}
            </dt>
            <dd className="tabular-nums font-medium text-[var(--gray-11)]">
              {fmt(scheme.totalTax, 0)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--gray-10)]">
              {isBn ? "আসল + মোট নিট মুনাফা" : "Principal + Net Profit"}
            </dt>
            <dd className="tabular-nums font-semibold text-[var(--gray-12)]">
              {fmt(scheme.maturityTotalValue, 0)}
            </dd>
          </div>
        </dl>

        {/* Eligibility Note */}
        <Text as="p" size="1" color="gray" className="leading-relaxed">
          <strong className="text-[var(--gray-11)]">
            {isBn ? "যোগ্যতা: " : "Eligibility: "}
          </strong>
          {isBn ? scheme.eligibilityBn : scheme.eligibilityEn}
        </Text>

        {/* Zero-JS Native Details: Year-Wise Premature Encashment Rates */}
        <details className="group rounded-[var(--radius-2)] border border-[var(--gray-4)] bg-[var(--color-background)] px-3 py-2 text-xs">
          <summary className="cursor-pointer font-medium text-[var(--gray-11)] select-none hover:text-[var(--accent-11)]">
            {isBn
              ? "মেয়াদপূর্তির আগে ভাঙালে বছরভিত্তিক মুনাফার হার"
              : "Early encashment rates (Year-wise breakdown)"}
          </summary>
          <div className="mt-2 space-y-1 border-t border-[var(--gray-4)] pt-2 tabular-nums">
            {scheme.yearWiseSchedule.map((row) => (
              <div
                key={row.year}
                className="flex items-center justify-between text-[var(--gray-11)]"
              >
                <span>
                  {isBn
                    ? `${toBanglaDigits(row.year)}ম বছর শেষে`
                    : `End of Year ${row.year}`}
                  {row.year === scheme.termYears
                    ? isBn
                      ? " (মেয়াদপূর্তি)"
                      : " (Maturity)"
                    : ""}
                </span>
                <span>
                  <strong>{formatPercent(row.annualRate, { locale })}</strong>{" "}
                  <span className="text-[var(--gray-10)]">
                    ({fmt(row.netMonthlyEquivalent, 0)}/{isBn ? "মাস" : "mo"})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </Card>
  );
}

import type {
  SanchayapatraConfig,
  SanchayapatraSchemeConfig,
} from "@/data/rates.schema";
import type { CalculatorResultBase, SmartInsight } from "./types";
import { formatBDT } from "@/lib/formatters";

export type SanchayapatraSchemeId =
  | "paribar"
  | "pensioner"
  | "threeMonth"
  | "fiveYear";

export interface SanchayapatraInput {
  /** Amount the user wants to invest now (in BDT) */
  investmentAmount: number;
  /** Optional existing cumulative Sanchayapatra holdings across all schemes (in BDT) */
  existingHoldings?: number;
}

export interface SanchayapatraYearBreakdown {
  year: number;
  annualRate: number;
  netMonthlyEquivalent: number;
  netAnnualProfit: number;
}

export interface SanchayapatraSchemeResult {
  id: SanchayapatraSchemeId;
  nameEn: string;
  nameBn: string;
  termYears: number;
  payoutFrequency: "monthly" | "quarterly" | "maturity";
  payoutsPerYear: number;
  maxSingleLimit: number;
  exceedsSingleLimit: boolean;
  eligibilityEn: string;
  eligibilityBn: string;
  /** "tier1" (<= 7.5L cumulative) or "tier2" (> 7.5L cumulative) */
  appliedTier: "tier1" | "tier2";
  annualRate: number;
  taxRate: number;
  /** Monthly equivalent figures (for apples-to-apples comparison across all 4 types) */
  grossMonthly: number;
  monthlyTax: number;
  netMonthly: number;
  /** 3-Month lump payout figures (populated for all, highlighted for 3-Month Profit-Bearing) */
  grossQuarterly: number;
  quarterlyTax: number;
  netQuarterly: number;
  /** Annual figures */
  grossAnnual: number;
  annualTax: number;
  netAnnual: number;
  /** Full tenure totals */
  totalGrossProfit: number;
  totalTax: number;
  totalNetProfit: number;
  maturityTotalValue: number;
  /** Year-wise premature encashment rates for the active tier */
  yearWiseSchedule: SanchayapatraYearBreakdown[];
}

export interface SanchayapatraCalculationResult extends CalculatorResultBase {
  investmentAmount: number;
  existingHoldings: number;
  cumulativeTotal: number;
  appliedTier: "tier1" | "tier2";
  schemes: SanchayapatraSchemeResult[];
  highestMonthlySchemeId: SanchayapatraSchemeId;
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

function calculateSingleScheme(
  amount: number,
  cumulativeTotal: number,
  config: SanchayapatraConfig,
  scheme: SanchayapatraSchemeConfig
): SanchayapatraSchemeResult {
  const appliedTier: "tier1" | "tier2" =
    cumulativeTotal <= config.slabCutoffBdt ? "tier1" : "tier2";

  const tierData = appliedTier === "tier1" ? scheme.tier1 : scheme.tier2;
  const annualRate = tierData.maturityRate;
  const taxRate =
    cumulativeTotal <= config.taxCutoffBdt
      ? scheme.taxRateUpToCutoff
      : scheme.taxRateAboveCutoff;

  const grossAnnual = amount * annualRate;
  const annualTax = grossAnnual * taxRate;
  const netAnnual = grossAnnual - annualTax;

  const grossMonthly = grossAnnual / 12;
  const monthlyTax = annualTax / 12;
  const netMonthly = netAnnual / 12;

  const grossQuarterly = grossAnnual / 4;
  const quarterlyTax = annualTax / 4;
  const netQuarterly = netAnnual / 4;

  const totalGrossProfit = grossAnnual * scheme.termYears;
  const totalTax = annualTax * scheme.termYears;
  const totalNetProfit = netAnnual * scheme.termYears;
  const maturityTotalValue = amount + totalNetProfit;

  const yearWiseSchedule: SanchayapatraYearBreakdown[] =
    tierData.yearWiseRates.map((rate, idx) => {
      const yGrossAnnual = amount * rate;
      const yNetAnnual = yGrossAnnual * (1 - taxRate);
      return {
        year: idx + 1,
        annualRate: rate,
        netMonthlyEquivalent: yNetAnnual / 12,
        netAnnualProfit: yNetAnnual,
      };
    });

  return {
    id: scheme.id,
    nameEn: scheme.nameEn,
    nameBn: scheme.nameBn,
    termYears: scheme.termYears,
    payoutFrequency: scheme.payoutFrequency,
    payoutsPerYear: scheme.payoutsPerYear,
    maxSingleLimit: scheme.maxSingleLimit,
    exceedsSingleLimit: cumulativeTotal > scheme.maxSingleLimit,
    eligibilityEn: scheme.eligibilityEn,
    eligibilityBn: scheme.eligibilityBn,
    appliedTier,
    annualRate,
    taxRate,
    grossMonthly,
    monthlyTax,
    netMonthly,
    grossQuarterly,
    quarterlyTax,
    netQuarterly,
    grossAnnual,
    annualTax,
    netAnnual,
    totalGrossProfit,
    totalTax,
    totalNetProfit,
    maturityTotalValue,
    yearWiseSchedule,
  };
}

export function calculateAllSanchayapatra(
  input: SanchayapatraInput,
  config: SanchayapatraConfig
): SanchayapatraCalculationResult {
  const investmentAmount = clampNonNegative(input.investmentAmount);
  const existingHoldings = clampNonNegative(input.existingHoldings ?? 0);
  const cumulativeTotal = investmentAmount + existingHoldings;
  const appliedTier: "tier1" | "tier2" =
    cumulativeTotal <= config.slabCutoffBdt ? "tier1" : "tier2";

  const orderedSchemes: SanchayapatraSchemeConfig[] = [
    config.schemes.paribar,
    config.schemes.pensioner,
    config.schemes.threeMonth,
    config.schemes.fiveYear,
  ];

  const schemes = orderedSchemes.map((scheme) =>
    calculateSingleScheme(investmentAmount, cumulativeTotal, config, scheme)
  );

  let highestMonthlySchemeId: SanchayapatraSchemeId = "pensioner";
  let bestNetMonthly = -1;
  for (const s of schemes) {
    if (s.netMonthly > bestNetMonthly) {
      bestNetMonthly = s.netMonthly;
      highestMonthlySchemeId = s.id;
    }
  }

  const smartInsights: SmartInsight[] = [];

  if (investmentAmount > 0) {
    if (cumulativeTotal <= config.taxCutoffBdt) {
      const pensioner = schemes.find((s) => s.id === "pensioner");
      const paribar = schemes.find((s) => s.id === "paribar");
      const monthlyDiff =
        pensioner && paribar ? pensioner.netMonthly - paribar.netMonthly : 0;
      smartInsights.push({
        id: "tax-tier-low",
        tone: "positive",
        titleEn: "Lower Source Tax Applies (≤ ৳5 Lakh Total)",
        titleBn: "কম উৎস কর প্রযোজ্য (মোট ≤ ৫ লক্ষ টাকা)",
        bodyEn: `Because your cumulative investment is within ৳5,00,000, Pensioner Sanchayapatra enjoys 0% source tax (saving ${formatBDT(monthlyDiff, { decimals: 0 })}/month vs Paribar), while Paribar, 3-Month, and 5-Year schemes pay only 5% TDS instead of 10%.`,
        bodyBn: `মোট বিনিয়োগ ৫,০০,০০০ টাকার মধ্যে থাকায় পেনশনার সঞ্চয়পত্রে ০% উৎস কর (পরিবার সঞ্চয়পত্রের তুলনায় মাসে ${formatBDT(monthlyDiff, { decimals: 0, locale: "bn" })} বেশি) এবং অন্যান্য সঞ্চয়পত্রে ১০%-এর বদলে মাত্র ৫% উৎস কর কাটা হবে।`,
      });
    } else {
      smartInsights.push({
        id: "tax-tier-high",
        tone: "warning",
        titleEn: "10% Source Tax Applies Above ৳5 Lakh",
        titleBn: "৫ লক্ষ টাকার বেশি বিনিয়োগে ১০% উৎস কর",
        bodyEn: `Your cumulative investment (${formatBDT(cumulativeTotal)}) crosses ৳5,00,000, so NBR deducts 10% source tax on profit across all 4 Sanchayapatra schemes.`,
        bodyBn: `আপনার মোট বিনিয়োগ (${formatBDT(cumulativeTotal, { locale: "bn" })}) ৫,০০,০০০ টাকা অতিক্রম করায় ৪টি সঞ্চয়পত্রের সবকটিতেই মুনাফার ওপর ১০% উৎস কর কাটা হবে।`,
      });
    }

    if (appliedTier === "tier2") {
      smartInsights.push({
        id: "slab-tier-2",
        tone: "info",
        titleEn: "Above ৳7.5 Lakh Profit Slab Active",
        titleBn: "৭.৫ লক্ষ টাকার ওপরের মুনাফা স্ল্যাব প্রযোজ্য",
        bodyEn:
          "National Savings Directorate applies the second profit slab (11.80% / 11.77% at maturity) when cumulative holdings exceed ৳7,50,000.",
        bodyBn:
          "মোট সঞ্চয়পত্র বিনিয়োগ ৭,৫০,০০০ টাকার বেশি হওয়ায় দ্বিতীয় ধাপের মুনাফার হার (মেয়াদান্তে ১১.৮০% / ১১.৭৭%) প্রযোজ্য হয়েছে।",
      });
    } else if (cumulativeTotal >= 600000) {
      const headroom = config.slabCutoffBdt - cumulativeTotal;
      smartInsights.push({
        id: "slab-near-cutoff",
        tone: "info",
        titleEn: "Still Inside Top Profit Slab (≤ ৳7.5 Lakh)",
        titleBn: "সর্বোচ্চ মুনাফা স্ল্যাবে আছেন (≤ ৭.৫ লক্ষ টাকা)",
        bodyEn: `You are earning the highest tier-1 profit rates. You have ${formatBDT(headroom)} remaining before crossing the ৳7,50,000 slab threshold.`,
        bodyBn: `আপনি প্রথম ধাপের সর্বোচ্চ মুনাফা পাচ্ছেন। ৭,৫০,০০০ টাকার স্ল্যাব সীমা অতিক্রম করতে আরও ${formatBDT(headroom, { locale: "bn" })} সুযোগ রয়েছে।`,
      });
    }

    const exceeded = schemes.filter((s) => s.exceedsSingleLimit);
    if (exceeded.length > 0) {
      const namesEn = exceeded.map((s) => s.nameEn).join(", ");
      const namesBn = exceeded.map((s) => s.nameBn).join(", ");
      smartInsights.push({
        id: "single-limit-warning",
        tone: "warning",
        titleEn: "Single-Name Investment Limit Exceeded",
        titleBn: "একক নামে বিনিয়োগের সর্বোচ্চ সীমা অতিক্রম করেছে",
        bodyEn: `Cumulative total (${formatBDT(cumulativeTotal)}) exceeds the single-name statutory limit for: ${namesEn}. (3-Month & 5-Year allow up to ৳60 Lakh in joint names.)`,
        bodyBn: `মোট বিনিয়োগ (${formatBDT(cumulativeTotal, { locale: "bn" })}) একক নামের সর্বোচ্চ সীমা অতিক্রম করেছে: ${namesBn}। (৩-মাসিক ও ৫-বছর মেয়াদী সঞ্চয়পত্রে যুগ্ম নামে ৬০ লক্ষ টাকা পর্যন্ত বিনিয়োগ করা যায়।)`,
      });
    }
  }

  return {
    investmentAmount,
    existingHoldings,
    cumulativeTotal,
    appliedTier,
    schemes,
    highestMonthlySchemeId,
    smartInsights,
  };
}

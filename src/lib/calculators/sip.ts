import type { CalculatorResultBase, SmartInsight } from "./types";
import { formatBDT, toBanglaDigits } from "@/lib/formatters";

export interface SipInput {
  monthlyInvestment: number;
  annualReturnRate: number;
  years: number;
  /** Optional annual increase % in monthly SIP */
  annualStepUpPercent?: number;
  /** Optional annual inflation % to compute today's purchasing power */
  inflationRate?: number;
}

export interface SipYearRow {
  year: number;
  monthlyContribution: number;
  totalInvested: number;
  estimatedReturns: number;
  totalValue: number;
}

export interface SipResult extends CalculatorResultBase {
  monthlyInvestment: number;
  annualReturnRate: number;
  years: number;
  totalInvested: number;
  estimatedReturns: number;
  futureValue: number;
  inflationAdjustedValue: number | null;
  investedSharePercent: number;
  returnsSharePercent: number;
  yearlySchedule: SipYearRow[];
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function calculateSip(input: SipInput): SipResult {
  const monthlyInvestment = Math.round(
    clamp(input.monthlyInvestment, 0, 50_000_000)
  );
  const annualReturnRate = clamp(input.annualReturnRate, 0, 40);
  const years = Math.round(clamp(input.years, 0, 50));
  const stepUp = clamp(input.annualStepUpPercent ?? 0, 0, 50);
  const inflation = clamp(input.inflationRate ?? 0, 0, 25);

  if (monthlyInvestment <= 0 || years <= 0) {
    return {
      monthlyInvestment,
      annualReturnRate,
      years,
      totalInvested: 0,
      estimatedReturns: 0,
      futureValue: 0,
      inflationAdjustedValue: null,
      investedSharePercent: 0,
      returnsSharePercent: 0,
      yearlySchedule: [],
      smartInsights: [],
    };
  }

  const monthlyRate = annualReturnRate / 1200;
  let balance = 0;
  let totalInvested = 0;
  let currentMonthly = monthlyInvestment;
  const yearlySchedule: SipYearRow[] = [];

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      // Annuity-due: contribution added at start of month, then grows
      totalInvested += currentMonthly;
      balance = (balance + currentMonthly) * (1 + monthlyRate);
    }

    yearlySchedule.push({
      year: y,
      monthlyContribution: currentMonthly,
      totalInvested,
      estimatedReturns: Math.max(0, balance - totalInvested),
      totalValue: balance,
    });

    if (stepUp > 0) {
      currentMonthly = currentMonthly * (1 + stepUp / 100);
    }
  }

  const futureValue = balance;
  const estimatedReturns = Math.max(0, futureValue - totalInvested);
  const investedSharePercent =
    futureValue > 0 ? (totalInvested / futureValue) * 100 : 100;
  const returnsSharePercent = Math.max(0, 100 - investedSharePercent);

  const inflationAdjustedValue =
    inflation > 0
      ? futureValue / Math.pow(1 + inflation / 100, years)
      : null;

  const smartInsights: SmartInsight[] = [];

  if (estimatedReturns > totalInvested) {
    const multiple = futureValue / totalInvested;
    smartInsights.push({
      id: "compounding-power",
      tone: "positive",
      titleEn: "Compounding Does the Heavy Lifting",
      titleBn: "চক্রবৃদ্ধি মুনাফার শক্তি",
      bodyEn: `Your money grows ${multiple.toFixed(1)}× over ${years} years — ${returnsSharePercent.toFixed(0)}% of your final corpus (${formatBDT(estimatedReturns)}) comes purely from returns.`,
      bodyBn: `${toBanglaDigits(years)} বছরে আপনার বিনিয়োগ ${toBanglaDigits(multiple.toFixed(1))} গুণ হবে — মোট মূলধনের ${toBanglaDigits(returnsSharePercent.toFixed(0))}% (${formatBDT(estimatedReturns, { locale: "bn" })}) আসবে শুধু মুনাফা থেকে।`,
    });
  }

  if (inflationAdjustedValue !== null) {
    smartInsights.push({
      id: "inflation-reality",
      tone: "info",
      titleEn: "Inflation-Adjusted Purchasing Power",
      titleBn: "মূল্যস্ফীতি বাদে প্রকৃত ক্রয়ক্ষমতা",
      bodyEn: `At ${inflation.toFixed(1)}% annual inflation, ${formatBDT(futureValue)} in ${years} years has the purchasing power of roughly ${formatBDT(inflationAdjustedValue)} in today's Taka.`,
      bodyBn: `বার্ষিক ${toBanglaDigits(inflation.toFixed(1))}% মূল্যস্ফীতি ধরলে ${toBanglaDigits(years)} বছর পরের ${formatBDT(futureValue, { locale: "bn" })} আজকের প্রায় ${formatBDT(inflationAdjustedValue, { locale: "bn" })}-এর সমান ক্রয়ক্ষমতা রাখবে।`,
    });
  }

  return {
    monthlyInvestment,
    annualReturnRate,
    years,
    totalInvested,
    estimatedReturns,
    futureValue,
    inflationAdjustedValue,
    investedSharePercent,
    returnsSharePercent,
    yearlySchedule,
    smartInsights,
  };
}

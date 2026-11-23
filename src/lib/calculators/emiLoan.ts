import type { CalculatorResultBase, SmartInsight } from "./types";
import { formatBDT, toBanglaDigits } from "@/lib/formatters";

export interface EmiLoanInput {
  principal: number;
  annualInterestRate: number;
  tenureYears: number;
  extraMonthlyPayment?: number;
}

export interface EmiYearRow {
  year: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface EmiPrepaymentComparison {
  extraMonthly: number;
  newTenureMonths: number;
  monthsSaved: number;
  newTotalInterest: number;
  interestSaved: number;
}

export interface EmiLoanResult extends CalculatorResultBase {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  principalSharePercent: number;
  interestSharePercent: number;
  yearlySchedule: EmiYearRow[];
  prepayment: EmiPrepaymentComparison | null;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function simulateSchedule(
  principal: number,
  monthlyRate: number,
  monthlyPayment: number,
  maxMonths: number
): {
  months: number;
  totalInterest: number;
  yearlySchedule: EmiYearRow[];
} {
  let balance = principal;
  let totalInterest = 0;
  let month = 0;
  const yearlySchedule: EmiYearRow[] = [];

  let yearPrincipal = 0;
  let yearInterest = 0;

  while (balance > 0.01 && month < maxMonths + 12) {
    month++;
    const interest = balance * monthlyRate;
    let principalPart = monthlyPayment - interest;

    if (principalPart <= 0) {
      break;
    }

    if (principalPart > balance) {
      principalPart = balance;
    }

    balance = Math.max(0, balance - principalPart);
    totalInterest += interest;
    yearPrincipal += principalPart;
    yearInterest += interest;

    if (month % 12 === 0 || balance <= 0.01) {
      yearlySchedule.push({
        year: Math.ceil(month / 12),
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        closingBalance: balance,
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  return { months: month, totalInterest, yearlySchedule };
}

export function calculateEmiLoan(input: EmiLoanInput): EmiLoanResult {
  const principal = Math.round(clamp(input.principal, 0, 500_000_000));
  const annualInterestRate = clamp(input.annualInterestRate, 0, 50);
  const tenureMonths = Math.round(clamp(input.tenureYears, 0, 40) * 12);
  const extraMonthly = Math.round(
    clamp(input.extraMonthlyPayment ?? 0, 0, 50_000_000)
  );

  if (principal <= 0 || tenureMonths <= 0) {
    return {
      principal,
      annualInterestRate,
      tenureMonths,
      monthlyEmi: 0,
      totalInterest: 0,
      totalPayable: 0,
      principalSharePercent: 0,
      interestSharePercent: 0,
      yearlySchedule: [],
      prepayment: null,
      smartInsights: [],
    };
  }

  const monthlyRate = annualInterestRate / 1200;
  const monthlyEmi =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const totalPayable = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalPayable - principal);
  const principalSharePercent =
    totalPayable > 0 ? (principal / totalPayable) * 100 : 100;
  const interestSharePercent = Math.max(0, 100 - principalSharePercent);

  const baseSim = simulateSchedule(
    principal,
    monthlyRate,
    monthlyEmi,
    tenureMonths
  );

  let prepayment: EmiPrepaymentComparison | null = null;
  if (extraMonthly > 0) {
    const prepaySim = simulateSchedule(
      principal,
      monthlyRate,
      monthlyEmi + extraMonthly,
      tenureMonths
    );
    const monthsSaved = Math.max(0, tenureMonths - prepaySim.months);
    const interestSaved = Math.max(0, totalInterest - prepaySim.totalInterest);
    prepayment = {
      extraMonthly,
      newTenureMonths: prepaySim.months,
      monthsSaved,
      newTotalInterest: prepaySim.totalInterest,
      interestSaved,
    };
  }

  const smartInsights: SmartInsight[] = [];

  if (prepayment && prepayment.interestSaved > 0) {
    smartInsights.push({
      id: "prepayment-savings",
      tone: "positive",
      titleEn: "Prepayment Cuts Interest & Tenure",
      titleBn: "অতিরিক্ত পরিশোধে সুদ ও মেয়াদ কমবে",
      bodyEn: `Paying ${formatBDT(prepayment.extraMonthly)} extra per month saves ${formatBDT(prepayment.interestSaved)} in interest and finishes your loan ${prepayment.monthsSaved} months earlier.`,
      bodyBn: `প্রতি মাসে ${formatBDT(prepayment.extraMonthly, { locale: "bn" })} অতিরিক্ত পরিশোধ করলে মোট ${formatBDT(prepayment.interestSaved, { locale: "bn" })} সুদ বাঁচবে এবং লোন ${toBanglaDigits(prepayment.monthsSaved)} মাস আগেই শেষ হবে।`,
    });
  } else if (annualInterestRate > 0 && tenureMonths >= 24) {
    const sampleExtra = Math.max(1000, Math.round((monthlyEmi * 0.1) / 500) * 500);
    const tipSim = simulateSchedule(
      principal,
      monthlyRate,
      monthlyEmi + sampleExtra,
      tenureMonths
    );
    const savedInt = Math.max(0, totalInterest - tipSim.totalInterest);
    const savedMo = Math.max(0, tenureMonths - tipSim.months);
    if (savedInt > 0 && savedMo > 0) {
      smartInsights.push({
        id: "prepayment-tip",
        tone: "info",
        titleEn: "10% Extra Monthly Payment Tip",
        titleBn: "মাসে ১০% বেশি পরিশোধের সুবিধা",
        bodyEn: `Adding just ${formatBDT(sampleExtra)}/month toward principal would cut ${savedMo} months off your loan and save roughly ${formatBDT(savedInt)} in interest.`,
        bodyBn: `প্রতি মাসে মাত্র ${formatBDT(sampleExtra, { locale: "bn" })} অতিরিক্ত জমা দিলে লোন ${toBanglaDigits(savedMo)} মাস আগে শেষ হবে এবং প্রায় ${formatBDT(savedInt, { locale: "bn" })} সুদ সাশ্রয় হবে।`,
      });
    }
  }

  if (interestSharePercent >= 45) {
    smartInsights.push({
      id: "high-interest-ratio",
      tone: "warning",
      titleEn: "High Total Interest Share",
      titleBn: "মোট সুদের অনুপাত বেশি",
      bodyEn: `Interest makes up ${interestSharePercent.toFixed(0)}% of your total repayment (${formatBDT(totalInterest)}). Comparing a slightly shorter tenure or lower bank rate can save lakhs of Taka.`,
      bodyBn: `মোট পরিশোধের ${toBanglaDigits(interestSharePercent.toFixed(0))}% শুধু সুদ (${formatBDT(totalInterest, { locale: "bn" })})। মেয়াদ কমালে বা কম সুদের ব্যাংক বেছে নিলে বড় অঙ্কের টাকা বাঁচবে।`,
    });
  }

  return {
    principal,
    annualInterestRate,
    tenureMonths,
    monthlyEmi,
    totalInterest,
    totalPayable,
    principalSharePercent,
    interestSharePercent,
    yearlySchedule: baseSim.yearlySchedule,
    prepayment,
    smartInsights,
  };
}

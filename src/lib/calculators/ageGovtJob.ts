import type { GovtJobAgeLimitConfig } from "@/data/rates.schema";
import type { CalculatorResultBase, SmartInsight } from "./types";
import { toBanglaDigits } from "@/lib/formatters";

export interface AgeGovtJobInput {
  /** ISO YYYY-MM-DD */
  birthDate: string;
  /** ISO YYYY-MM-DD */
  targetDate: string;
  /** Optional custom maximum job age limit (defaults to statutory 32) */
  customMaxAgeYears?: number;
  /** Optional custom minimum job age limit (defaults to 18) */
  customMinAgeYears?: number;
}

export interface AgeDuration {
  years: number;
  months: number;
  days: number;
}

export interface AgeGovtJobResult extends CalculatorResultBase {
  valid: boolean;
  errorEn?: string;
  errorBn?: string;
  age: AgeDuration;
  totalDaysLived: number;
  totalWeeksLived: number;
  totalMonthsLived: number;
  daysUntilNextBirthday: number;
  isBirthdayToday: boolean;
  jobEligibility: {
    minYears: number;
    maxYears: number;
    status: "eligible" | "too-young" | "over-limit";
    remainingUntilMax: AgeDuration | null;
    overLimitBy: AgeDuration | null;
  };
}

function parseIsoUtc(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return dt;
}

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function diffYmd(from: Date, to: Date): AgeDuration {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  let days = to.getUTCDate() - from.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonthYear =
      to.getUTCMonth() === 0 ? to.getUTCFullYear() - 1 : to.getUTCFullYear();
    const prevMonthIndex = to.getUTCMonth() === 0 ? 11 : to.getUTCMonth() - 1;
    days += daysInUtcMonth(prevMonthYear, prevMonthIndex);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function addYearsUtc(date: Date, yearsToAdd: number): Date {
  const targetYear = date.getUTCFullYear() + yearsToAdd;
  const month = date.getUTCMonth();
  const maxDay = daysInUtcMonth(targetYear, month);
  const day = Math.min(date.getUTCDate(), maxDay);
  return new Date(Date.UTC(targetYear, month, day));
}

export function calculateAgeAndGovtJob(
  input: AgeGovtJobInput,
  config: GovtJobAgeLimitConfig
): AgeGovtJobResult {
  const minYears = Math.max(
    1,
    Math.min(60, Math.round(input.customMinAgeYears ?? config.minYears))
  );
  const maxYears = Math.max(
    minYears,
    Math.min(80, Math.round(input.customMaxAgeYears ?? config.generalMaxYears))
  );

  const dob = parseIsoUtc(input.birthDate);
  const target = parseIsoUtc(input.targetDate);

  const invalid = (errorEn: string, errorBn: string): AgeGovtJobResult => ({
    valid: false,
    errorEn,
    errorBn,
    age: { years: 0, months: 0, days: 0 },
    totalDaysLived: 0,
    totalWeeksLived: 0,
    totalMonthsLived: 0,
    daysUntilNextBirthday: 0,
    isBirthdayToday: false,
    jobEligibility: {
      minYears,
      maxYears,
      status: "too-young",
      remainingUntilMax: null,
      overLimitBy: null,
    },
    smartInsights: [],
  });

  if (!dob || !target) {
    return invalid(
      "Please pick valid dates.",
      "অনুগ্রহ করে সঠিক তারিখ নির্বাচন করুন।"
    );
  }

  if (dob.getTime() > target.getTime()) {
    return invalid(
      "Birth date must be on or before the target date.",
      "জন্ম তারিখ অবশ্যই নির্ধারিত তারিখের আগে হতে হবে।"
    );
  }

  const age = diffYmd(dob, target);
  const totalDaysLived = Math.round(
    (target.getTime() - dob.getTime()) / 86_400_000
  );
  const totalWeeksLived = Math.floor(totalDaysLived / 7);
  const totalMonthsLived = age.years * 12 + age.months;

  // Next birthday
  const isBirthdayToday =
    dob.getUTCMonth() === target.getUTCMonth() &&
    dob.getUTCDate() === target.getUTCDate();

  let nextBirthdayYear = target.getUTCFullYear();
  let nextBdayDay = Math.min(
    dob.getUTCDate(),
    daysInUtcMonth(nextBirthdayYear, dob.getUTCMonth())
  );
  let nextBday = new Date(
    Date.UTC(nextBirthdayYear, dob.getUTCMonth(), nextBdayDay)
  );
  if (nextBday.getTime() < target.getTime()) {
    nextBirthdayYear += 1;
    nextBdayDay = Math.min(
      dob.getUTCDate(),
      daysInUtcMonth(nextBirthdayYear, dob.getUTCMonth())
    );
    nextBday = new Date(
      Date.UTC(nextBirthdayYear, dob.getUTCMonth(), nextBdayDay)
    );
  }
  const daysUntilNextBirthday = isBirthdayToday
    ? 0
    : Math.round((nextBday.getTime() - target.getTime()) / 86_400_000);

  // BD Govt Job / BCS Eligibility
  const minCutoffDate = addYearsUtc(dob, minYears);
  const maxCutoffDate = addYearsUtc(dob, maxYears);

  let status: "eligible" | "too-young" | "over-limit";
  let remainingUntilMax: AgeDuration | null = null;
  let overLimitBy: AgeDuration | null = null;

  if (target.getTime() < minCutoffDate.getTime()) {
    status = "too-young";
    remainingUntilMax = diffYmd(target, maxCutoffDate);
  } else if (target.getTime() <= maxCutoffDate.getTime()) {
    status = "eligible";
    remainingUntilMax = diffYmd(target, maxCutoffDate);
  } else {
    status = "over-limit";
    overLimitBy = diffYmd(maxCutoffDate, target);
  }

  const smartInsights: SmartInsight[] = [];

  if (status === "eligible" && remainingUntilMax) {
    smartInsights.push({
      id: "govt-job-eligible",
      tone: "positive",
      titleEn: `Eligible for BD Govt Jobs & BCS (${minYears}–${maxYears} Years)`,
      titleBn: `সরকারি চাকরি ও বিসিএস-এর জন্য যোগ্য (${toBanglaDigits(minYears)}–${toBanglaDigits(maxYears)} বছর)`,
      bodyEn: `On ${input.targetDate}, your exact age (${age.years}y ${age.months}m ${age.days}d) is within the ${maxYears}-year limit, with ${remainingUntilMax.years}y ${remainingUntilMax.months}m ${remainingUntilMax.days}d remaining before reaching ${maxYears}.`,
      bodyBn: `${input.targetDate} তারিখে আপনার বয়স (${toBanglaDigits(age.years)} বছর ${toBanglaDigits(age.months)} মাস ${toBanglaDigits(age.days)} দিন) ${toBanglaDigits(maxYears)} বছরের সীমার মধ্যে রয়েছে। সর্বোচ্চ সীমায় পৌঁছাতে আরও ${toBanglaDigits(remainingUntilMax.years)} বছর ${toBanglaDigits(remainingUntilMax.months)} মাস ${toBanglaDigits(remainingUntilMax.days)} দিন বাকি।`,
    });
  } else if (status === "over-limit" && overLimitBy) {
    smartInsights.push({
      id: "govt-job-over",
      tone: "warning",
      titleEn: `Exceeds ${maxYears}-Year Maximum Age Limit`,
      titleBn: `${toBanglaDigits(maxYears)} বছরের সর্বোচ্চ বয়সসীমা অতিক্রম করেছে`,
      bodyEn: `Your age on ${input.targetDate} exceeds the ${maxYears}-year limit by ${overLimitBy.years}y ${overLimitBy.months}m ${overLimitBy.days}d. Check whether a specific departmental or experience-based circular allows a higher age ceiling.`,
      bodyBn: `${input.targetDate} তারিখে আপনার বয়স ${toBanglaDigits(maxYears)} বছরের সীমার চেয়ে ${toBanglaDigits(overLimitBy.years)} বছর ${toBanglaDigits(overLimitBy.months)} মাস ${toBanglaDigits(overLimitBy.days)} দিন বেশি। অভিজ্ঞতাভিত্তিক বা বিভাগীয় সার্কুলারে বাড়তি বয়সসীমা আছে কিনা যাচাই করুন।`,
    });
  } else if (status === "too-young") {
    smartInsights.push({
      id: "govt-job-young",
      tone: "info",
      titleEn: `Below Minimum Entry Age (${minYears} Years)`,
      titleBn: `ন্যূনতম বয়সসীমার (${toBanglaDigits(minYears)} বছর) নিচে`,
      bodyEn: `Minimum age for direct BD government job entry is ${minYears} years (and ${config.bcsMinYears} years for BCS).`,
      bodyBn: `বাংলাদেশ সরকারি চাকরিতে আবেদনের ন্যূনতম বয়স ${toBanglaDigits(minYears)} বছর (এবং বিসিএস-এর জন্য ${toBanglaDigits(config.bcsMinYears)} বছর)।`,
    });
  }

  return {
    valid: true,
    age,
    totalDaysLived,
    totalWeeksLived,
    totalMonthsLived,
    daysUntilNextBirthday,
    isBirthdayToday,
    jobEligibility: {
      minYears,
      maxYears,
      status,
      remainingUntilMax,
      overLimitBy,
    },
    smartInsights,
  };
}

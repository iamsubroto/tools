import type { CalculatorResultBase, SmartInsight } from "./types";
import { toBanglaDigits } from "@/lib/formatters";

export interface BmiInput {
  heightCm: number;
  weightKg: number;
}

export type BmiCategoryTone = "info" | "positive" | "warning" | "danger";

export interface BmiCategoryInfo {
  labelEn: string;
  labelBn: string;
  tone: BmiCategoryTone;
}

export interface BmiResult extends CalculatorResultBase {
  valid: boolean;
  heightCm: number;
  weightKg: number;
  bmi: number;
  whoCategory: BmiCategoryInfo;
  asianCategory: BmiCategoryInfo;
  /** Healthy weight range in kg for WHO (18.5 - 24.9) */
  whoHealthyRangeKg: { min: number; max: number };
  /** Healthy weight range in kg for South Asian cut-offs (18.5 - 22.9) */
  asianHealthyRangeKg: { min: number; max: number };
  /** Normalized 0..100 position for visual BMI bar (BMI 14..38) */
  barPositionPercent: number;
}

export function feetInchesToCm(feet: number, inches: number): number {
  const safeFt = Number.isFinite(feet) && feet > 0 ? feet : 0;
  const safeIn = Number.isFinite(inches) && inches >= 0 ? inches : 0;
  return (safeFt * 12 + safeIn) * 2.54;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const safeCm = Number.isFinite(cm) && cm > 0 ? cm : 0;
  const totalInches = safeCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches - feet * 12) * 10) / 10;
  if (inches >= 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

function classifyWho(bmi: number): BmiCategoryInfo {
  if (bmi < 18.5)
    return { labelEn: "Underweight", labelBn: "কম ওজন", tone: "info" };
  if (bmi < 25)
    return { labelEn: "Normal", labelBn: "স্বাভাবিক", tone: "positive" };
  if (bmi < 30)
    return { labelEn: "Overweight", labelBn: "অতিরিক্ত ওজন", tone: "warning" };
  return { labelEn: "Obese", labelBn: "স্থূলতা", tone: "danger" };
}

function classifyAsian(bmi: number): BmiCategoryInfo {
  if (bmi < 18.5)
    return { labelEn: "Underweight", labelBn: "কম ওজন", tone: "info" };
  if (bmi < 23)
    return { labelEn: "Normal", labelBn: "স্বাভাবিক", tone: "positive" };
  if (bmi < 27.5)
    return { labelEn: "Overweight", labelBn: "অতিরিক্ত ওজন", tone: "warning" };
  return { labelEn: "High risk (Obese)", labelBn: "উচ্চ ঝুঁকি (স্থূলতা)", tone: "danger" };
}

export function calculateBmi(input: BmiInput): BmiResult {
  const heightCm =
    Number.isFinite(input.heightCm) && input.heightCm > 0
      ? Math.min(input.heightCm, 275)
      : 0;
  const weightKg =
    Number.isFinite(input.weightKg) && input.weightKg > 0
      ? Math.min(input.weightKg, 400)
      : 0;

  if (heightCm <= 0 || weightKg <= 0) {
    return {
      valid: false,
      heightCm,
      weightKg,
      bmi: 0,
      whoCategory: { labelEn: "–", labelBn: "–", tone: "info" },
      asianCategory: { labelEn: "–", labelBn: "–", tone: "info" },
      whoHealthyRangeKg: { min: 0, max: 0 },
      asianHealthyRangeKg: { min: 0, max: 0 },
      barPositionPercent: 0,
      smartInsights: [],
    };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const whoCategory = classifyWho(bmi);
  const asianCategory = classifyAsian(bmi);

  const whoHealthyRangeKg = {
    min: 18.5 * heightM * heightM,
    max: 24.9 * heightM * heightM,
  };
  const asianHealthyRangeKg = {
    min: 18.5 * heightM * heightM,
    max: 22.9 * heightM * heightM,
  };

  const barPositionPercent = Math.min(
    100,
    Math.max(0, ((bmi - 14) / (38 - 14)) * 100)
  );

  const smartInsights: SmartInsight[] = [];

  if (bmi >= 23 && bmi < 25) {
    smartInsights.push({
      id: "asian-cutoff-diff",
      tone: "info",
      titleEn: "Why South Asian Cut-Offs Are Stricter",
      titleBn: "দক্ষিণ এশীয় বিএমআই সীমা কেন তুলনামূলক কম",
      bodyEn: `Your BMI (${bmi.toFixed(1)}) is Normal under global WHO ranges (<25) but falls in the Overweight range (≥23) under South Asian guidelines, because South Asians tend to carry higher body-fat risk at lower BMIs.`,
      bodyBn: `আপনার বিএমআই (${toBanglaDigits(bmi.toFixed(1))}) বৈশ্বিক WHO মানদণ্ডে স্বাভাবিক হলেও দক্ষিণ এশীয় মানদণ্ডে (≥২৩) অতিরিক্ত ওজনের সীমায় পড়ে।`,
    });
  } else {
    smartInsights.push({
      id: "healthy-weight-band",
      tone: asianCategory.tone === "positive" ? "positive" : "info",
      titleEn: "Reference Healthy Weight Range",
      titleBn: "স্বাভাবিক ওজনের রেফারেন্স সীমা",
      bodyEn: `For your height (${heightCm.toFixed(0)} cm), the South Asian healthy BMI range (18.5–22.9) corresponds to ${asianHealthyRangeKg.min.toFixed(1)}–${asianHealthyRangeKg.max.toFixed(1)} kg (WHO global: up to ${whoHealthyRangeKg.max.toFixed(1)} kg).`,
      bodyBn: `আপনার উচ্চতা (${toBanglaDigits(heightCm.toFixed(0))} সেমি) অনুযায়ী দক্ষিণ এশীয় স্বাভাবিক ওজনের সীমা ${toBanglaDigits(asianHealthyRangeKg.min.toFixed(1))}–${toBanglaDigits(asianHealthyRangeKg.max.toFixed(1))} কেজি (WHO সীমা: সর্বোচ্চ ${toBanglaDigits(whoHealthyRangeKg.max.toFixed(1))} কেজি)।`,
    });
  }

  return {
    valid: true,
    heightCm,
    weightKg,
    bmi,
    whoCategory,
    asianCategory,
    whoHealthyRangeKg,
    asianHealthyRangeKg,
    barPositionPercent,
    smartInsights,
  };
}

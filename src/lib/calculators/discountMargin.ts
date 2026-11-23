import type { CalculatorResultBase, SmartInsight } from "./types";
import { formatBDT, toBanglaDigits } from "@/lib/formatters";

export interface DiscountInput {
  originalPrice: number;
  discountPercent: number;
  extraDiscountPercent?: number;
  vatPercent?: number;
}

export interface DiscountResult extends CalculatorResultBase {
  originalPrice: number;
  discountPercent: number;
  extraDiscountPercent: number;
  vatPercent: number;
  firstDiscountAmount: number;
  extraDiscountAmount: number;
  totalSavings: number;
  effectiveDiscountPercent: number;
  priceAfterDiscount: number;
  vatAmount: number;
  finalPayable: number;
}

export interface MarginInput {
  sellingPrice: number;
  productCost: number;
  deliveryAndPackaging: number;
  codChargePercent: number;
  adCostPerOrder: number;
}

export interface MarginResult extends CalculatorResultBase {
  sellingPrice: number;
  totalCost: number;
  codFee: number;
  netProfit: number;
  profitMarginPercent: number;
  markupPercent: number;
  breakEvenPrice: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function calculateDiscount(input: DiscountInput): DiscountResult {
  const originalPrice = clamp(input.originalPrice, 0, 1_000_000_000);
  const discountPercent = clamp(input.discountPercent, 0, 100);
  const extraDiscountPercent = clamp(input.extraDiscountPercent ?? 0, 0, 100);
  const vatPercent = clamp(input.vatPercent ?? 0, 0, 100);

  const firstDiscountAmount = originalPrice * (discountPercent / 100);
  const afterFirst = originalPrice - firstDiscountAmount;
  const extraDiscountAmount = afterFirst * (extraDiscountPercent / 100);
  const priceAfterDiscount = Math.max(0, afterFirst - extraDiscountAmount);
  const totalSavings = originalPrice - priceAfterDiscount;
  const effectiveDiscountPercent =
    originalPrice > 0 ? (totalSavings / originalPrice) * 100 : 0;

  const vatAmount = priceAfterDiscount * (vatPercent / 100);
  const finalPayable = priceAfterDiscount + vatAmount;

  const smartInsights: SmartInsight[] = [];
  if (originalPrice > 0 && extraDiscountPercent > 0) {
    const naiveSum = discountPercent + extraDiscountPercent;
    smartInsights.push({
      id: "stacked-discount",
      tone: "info",
      titleEn: "Stacked Discounts Don't Add Linearly",
      titleBn: "ডাবল ডিসকাউন্ট সরাসরি যোগ হয় না",
      bodyEn: `${discountPercent}% + extra ${extraDiscountPercent}% equals an effective ${effectiveDiscountPercent.toFixed(1)}% discount (not ${naiveSum.toFixed(0)}%), saving you ${formatBDT(totalSavings, { decimals: 0 })}.`,
      bodyBn: `${toBanglaDigits(discountPercent)}% + অতিরিক্ত ${toBanglaDigits(extraDiscountPercent)}% মিলে প্রকৃত ছাড় ${toBanglaDigits(effectiveDiscountPercent.toFixed(1))}% (${toBanglaDigits(naiveSum.toFixed(0))}% নয়), মোট সাশ্রয় ${formatBDT(totalSavings, { decimals: 0, locale: "bn" })}।`,
    });
  }

  return {
    originalPrice,
    discountPercent,
    extraDiscountPercent,
    vatPercent,
    firstDiscountAmount,
    extraDiscountAmount,
    totalSavings,
    effectiveDiscountPercent,
    priceAfterDiscount,
    vatAmount,
    finalPayable,
    smartInsights,
  };
}

export function calculateOrderMargin(input: MarginInput): MarginResult {
  const sellingPrice = clamp(input.sellingPrice, 0, 1_000_000_000);
  const productCost = clamp(input.productCost, 0, 1_000_000_000);
  const deliveryAndPackaging = clamp(input.deliveryAndPackaging, 0, 10_000_000);
  const codChargePercent = clamp(input.codChargePercent, 0, 50);
  const adCostPerOrder = clamp(input.adCostPerOrder, 0, 10_000_000);

  const codFee = sellingPrice * (codChargePercent / 100);
  const fixedCosts = productCost + deliveryAndPackaging + adCostPerOrder;
  const totalCost = fixedCosts + codFee;
  const netProfit = sellingPrice - totalCost;
  const profitMarginPercent =
    sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const markupPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const breakEvenPrice =
    codChargePercent < 100 ? fixedCosts / (1 - codChargePercent / 100) : fixedCosts;

  const smartInsights: SmartInsight[] = [];
  if (sellingPrice > 0) {
    if (netProfit < 0) {
      smartInsights.push({
        id: "negative-margin",
        tone: "warning",
        titleEn: "Selling at a Net Loss",
        titleBn: "প্রতি অর্ডারে লোকসান হচ্ছে",
        bodyEn: `You lose ${formatBDT(Math.abs(netProfit), { decimals: 0 })} per order. Raise your price above ${formatBDT(Math.ceil(breakEvenPrice))} or reduce ad/delivery costs to break even.`,
        bodyBn: `প্রতি অর্ডারে আপনার ${formatBDT(Math.abs(netProfit), { decimals: 0, locale: "bn" })} লোকসান হচ্ছে। লাভ করতে বিক্রয়মূল্য কমপক্ষে ${formatBDT(Math.ceil(breakEvenPrice), { locale: "bn" })} রাখুন অথবা বিজ্ঞাপন/ডেলিভারি খরচ কমান।`,
      });
    } else if (profitMarginPercent < 15) {
      smartInsights.push({
        id: "thin-margin",
        tone: "info",
        titleEn: "Thin Margin — Watch Return Rates",
        titleBn: "লাভের মার্জিন কম — রিটার্ন খরচ খেয়াল রাখুন",
        bodyEn: `A ${profitMarginPercent.toFixed(1)}% margin leaves tight buffer for F-commerce courier return charges. Aim for 20%+ margin when running paid Facebook ads.`,
        bodyBn: `${toBanglaDigits(profitMarginPercent.toFixed(1))}% মার্জিনে রিটার্ন অর্ডারের কুরিয়ার খরচ সামলানো কঠিন হতে পারে। ফেসবুক অ্যাড চালালে ২০%+ মার্জিন রাখা নিরাপদ।`,
      });
    } else {
      smartInsights.push({
        id: "healthy-margin",
        tone: "positive",
        titleEn: "Healthy Unit Economics",
        titleBn: "ভালো লাভের মার্জিন",
        bodyEn: `Each delivered order earns ${formatBDT(netProfit, { decimals: 0 })} net profit (${profitMarginPercent.toFixed(1)}% margin), safely above your ${formatBDT(Math.ceil(breakEvenPrice))} break-even price.`,
        bodyBn: `প্রতি সফল ডেলিভারিতে নিট লাভ ${formatBDT(netProfit, { decimals: 0, locale: "bn" })} (${toBanglaDigits(profitMarginPercent.toFixed(1))}% মার্জিন), যা ব্রেক-ইভেন মূল্যের (${formatBDT(Math.ceil(breakEvenPrice), { locale: "bn" })}) চেয়ে নিরাপদ দূরত্বে।`,
      });
    }
  }

  return {
    sellingPrice,
    totalCost,
    codFee,
    netProfit,
    profitMarginPercent,
    markupPercent,
    breakEvenPrice,
    smartInsights,
  };
}

import type { CalculatorResultBase, SmartInsight } from "./types";
import { formatBDT, toBanglaDigits } from "@/lib/formatters";

export interface VatAitInput {
  amount: number;
  /** VAT rate as percentage, e.g., 15 for 15% */
  vatRatePercent: number;
  /** Optional AIT withholding rate as percentage, e.g., 5 for 5% */
  aitRatePercent?: number;
}

export interface VatAitResult extends CalculatorResultBase {
  amount: number;
  vatRatePercent: number;
  aitRatePercent: number;
  /** When amount is EXCLUSIVE of VAT (Add VAT) */
  exclusive: {
    baseAmount: number;
    vatAmount: number;
    totalWithVat: number;
    aitAmount: number;
    netVendorPayableAfterVdsAit: number;
    totalTreasuryChallan: number;
  };
  /** When amount ALREADY INCLUDES VAT (Remove / Extract VAT) */
  inclusive: {
    grossAmount: number;
    baseWithoutVat: number;
    vatInside: number;
    aitAmount: number;
    netVendorPayableAfterVdsAit: number;
    totalTreasuryChallan: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function calculateVatAit(input: VatAitInput): VatAitResult {
  const amount = clamp(input.amount, 0, 1_000_000_000);
  const vatRatePercent = clamp(input.vatRatePercent, 0, 100);
  const aitRatePercent = clamp(input.aitRatePercent ?? 0, 0, 100);

  // 1) Exclusive (Add VAT on top of base amount)
  const exVat = amount * (vatRatePercent / 100);
  const exTotal = amount + exVat;
  const exAit = amount * (aitRatePercent / 100);
  const exChallan = exVat + exAit;
  const exVendorNet = Math.max(0, exTotal - exChallan);

  // 2) Inclusive (Extract VAT already included inside gross amount)
  const inBase =
    vatRatePercent === 0 ? amount : amount / (1 + vatRatePercent / 100);
  const inVat = amount - inBase;
  const inAit = inBase * (aitRatePercent / 100);
  const inChallan = inVat + inAit;
  const inVendorNet = Math.max(0, amount - inChallan);

  const smartInsights: SmartInsight[] = [];

  if (amount > 0 && aitRatePercent > 0) {
    smartInsights.push({
      id: "vds-ait-split",
      tone: "info",
      titleEn: "VDS & AIT Withholding Summary (B2B / Procurement)",
      titleBn: "ভিডিএস ও এআইটি কর্তন সারসংক্ষেপ",
      bodyEn: `On an exclusive bill of ${formatBDT(amount)}, if you deduct both ${vatRatePercent}% VDS (${formatBDT(exVat)}) and ${aitRatePercent}% AIT (${formatBDT(exAit)}), deposit ${formatBDT(exChallan)} to NBR treasury challan and pay ${formatBDT(exVendorNet)} net to the vendor.`,
      bodyBn: `${formatBDT(amount, { locale: "bn" })} মূল বিলে ${toBanglaDigits(vatRatePercent)}% ভিডিএস (${formatBDT(exVat, { locale: "bn" })}) এবং ${toBanglaDigits(aitRatePercent)}% এআইটি (${formatBDT(exAit, { locale: "bn" })}) কাটলে মোট ${formatBDT(exChallan, { locale: "bn" })} সরকারি চালানে জমা দিয়ে বিক্রেতাকে নিট ${formatBDT(exVendorNet, { locale: "bn" })} পরিশোধ করতে হবে।`,
    });
  } else if (amount > 0 && vatRatePercent === 15) {
    smartInsights.push({
      id: "mushak-reminder",
      tone: "positive",
      titleEn: "Input VAT Credit Eligible at 15%",
      titleBn: "১৫% ভ্যাটে রেয়াত (Input Credit) সুবিধা",
      bodyEn:
        "Under Bangladesh's VAT & SD Act, standard 15% VAT invoices accompanied by a valid Mushak-6.3 tax invoice are generally eligible for Input Tax Credit.",
      bodyBn:
        "বাংলাদেশ ভ্যাট আইন অনুযায়ী বৈধ মূসক-৬.৩ চালান থাকলে ১৫% স্ট্যান্ডার্ড ভ্যাটের ক্ষেত্রে সাধারণত উপকরণ কর রেয়াত (Input Tax Credit) নেওয়া যায়।",
    });
  }

  return {
    amount,
    vatRatePercent,
    aitRatePercent,
    exclusive: {
      baseAmount: amount,
      vatAmount: exVat,
      totalWithVat: exTotal,
      aitAmount: exAit,
      netVendorPayableAfterVdsAit: exVendorNet,
      totalTreasuryChallan: exChallan,
    },
    inclusive: {
      grossAmount: amount,
      baseWithoutVat: inBase,
      vatInside: inVat,
      aitAmount: inAit,
      netVendorPayableAfterVdsAit: inVendorNet,
      totalTreasuryChallan: inChallan,
    },
    smartInsights,
  };
}

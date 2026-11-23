const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

/**
 * Formats a number using South Asian (Lakh / Crore) grouping:
 * e.g., 500000 -> "5,00,000", 12500000 -> "1,25,00,000"
 */
export function formatSouthAsianNumber(
  value: number,
  options?: { decimals?: number; locale?: "en" | "bn" }
): string {
  const decimals = options?.decimals ?? 0;
  const locale = options?.locale ?? "en";
  const safeValue = Number.isFinite(value) ? value : 0;
  const isNegative = safeValue < 0;
  const abs = Math.abs(safeValue);
  const fixed = abs.toFixed(decimals);
  const [intPart, fracPart] = fixed.split(".");

  let grouped = intPart;
  if (intPart.length > 3) {
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    grouped =
      remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }

  const formatted =
    (isNegative ? "-" : "") +
    (fracPart !== undefined ? `${grouped}.${fracPart}` : grouped);

  return locale === "bn" ? toBanglaDigits(formatted) : formatted;
}

export function formatBDT(
  value: number,
  options?: { decimals?: number; locale?: "en" | "bn" }
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const isNegative = safeValue < 0;
  const formatted = formatSouthAsianNumber(Math.abs(safeValue), options);
  return `${isNegative ? "-" : ""}৳${formatted}`;
}

export function formatPercent(
  decimalRate: number,
  options?: { decimals?: number; locale?: "en" | "bn" }
): string {
  const decimals = options?.decimals ?? 2;
  const locale = options?.locale ?? "en";
  const safeValue = Number.isFinite(decimalRate) ? decimalRate * 100 : 0;
  const text = `${safeValue.toFixed(decimals)}%`;
  return locale === "bn" ? toBanglaDigits(text) : text;
}

/**
 * Human-readable South Asian summary in words (Crore / Lakh / Thousand)
 */
export function formatBDTInWords(
  value: number,
  locale: "en" | "bn" = "en"
): string {
  const amount = Math.round(Math.max(0, Number.isFinite(value) ? value : 0));
  if (amount === 0) {
    return locale === "bn" ? "০ টাকা" : "Zero Taka";
  }

  const crore = Math.floor(amount / 10_000_000);
  const lakh = Math.floor((amount % 10_000_000) / 100_000);
  const thousand = Math.floor((amount % 100_000) / 1_000);
  const rest = amount % 1_000;

  const parts: string[] = [];
  if (locale === "bn") {
    if (crore > 0) parts.push(`${toBanglaDigits(crore)} কোটি`);
    if (lakh > 0) parts.push(`${toBanglaDigits(lakh)} লক্ষ`);
    if (thousand > 0) parts.push(`${toBanglaDigits(thousand)} হাজার`);
    if (rest > 0) parts.push(toBanglaDigits(rest));
    return `${parts.join(" ")} টাকা`;
  }

  if (crore > 0) parts.push(`${crore} Crore`);
  if (lakh > 0) parts.push(`${lakh} Lakh`);
  if (thousand > 0) parts.push(`${thousand} Thousand`);
  if (rest > 0) parts.push(String(rest));
  return `${parts.join(" ")} Taka`;
}

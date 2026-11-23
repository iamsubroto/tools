import { describe, expect, it } from "vitest";
import {
  formatBDT,
  formatBDTInWords,
  formatPercent,
  formatSouthAsianNumber,
  toBanglaDigits,
} from "./formatters";

describe("formatters", () => {
  it("formats South Asian Lakh/Crore numbers accurately", () => {
    expect(formatSouthAsianNumber(0)).toBe("0");
    expect(formatSouthAsianNumber(999)).toBe("999");
    expect(formatSouthAsianNumber(1000)).toBe("1,000");
    expect(formatSouthAsianNumber(100000)).toBe("1,00,000");
    expect(formatSouthAsianNumber(750000)).toBe("7,50,000");
    expect(formatSouthAsianNumber(12500000)).toBe("1,25,00,000");
  });

  it("formats BDT with currency sign and Bangla digits", () => {
    expect(formatBDT(500000)).toBe("৳5,00,000");
    expect(formatBDT(4722.29, { decimals: 2 })).toBe("৳4,722.29");
    expect(formatBDT(500000, { locale: "bn" })).toBe("৳৫,০০,০০০");
    expect(toBanglaDigits("11.98%")).toBe("১১.৯৮%");
  });

  it("formats percentages accurately", () => {
    expect(formatPercent(0.1193)).toBe("11.93%");
    expect(formatPercent(0.05, { decimals: 0 })).toBe("5%");
    expect(formatPercent(0.1, { decimals: 0, locale: "bn" })).toBe("১০%");
  });

  it("formats BDT in words in English and Bangla", () => {
    expect(formatBDTInWords(0)).toBe("Zero Taka");
    expect(formatBDTInWords(500000, "en")).toBe("5 Lakh Taka");
    expect(formatBDTInWords(750000, "en")).toBe("7 Lakh 50 Thousand Taka");
    expect(formatBDTInWords(500000, "bn")).toBe("৫ লক্ষ টাকা");
  });
});

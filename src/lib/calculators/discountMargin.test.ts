import { describe, expect, it } from "vitest";
import { calculateDiscount, calculateOrderMargin } from "./discountMargin";

describe("calculateDiscount", () => {
  it("calculates simple discount accurately", () => {
    const res = calculateDiscount({ originalPrice: 2500, discountPercent: 20 });
    expect(res.totalSavings).toBeCloseTo(500, 2);
    expect(res.finalPayable).toBeCloseTo(2000, 2);
    expect(res.effectiveDiscountPercent).toBeCloseTo(20, 2);
  });

  it("handles stacked discount and VAT accurately", () => {
    // 1000 - 20% = 800; 800 - 10% = 720 (28% effective discount); +5% VAT = 756
    const res = calculateDiscount({
      originalPrice: 1000,
      discountPercent: 20,
      extraDiscountPercent: 10,
      vatPercent: 5,
    });
    expect(res.priceAfterDiscount).toBeCloseTo(720, 2);
    expect(res.effectiveDiscountPercent).toBeCloseTo(28, 2);
    expect(res.vatAmount).toBeCloseTo(36, 2);
    expect(res.finalPayable).toBeCloseTo(756, 2);
  });

  it("clamps invalid/negative values safely", () => {
    const res = calculateDiscount({ originalPrice: -500, discountPercent: 150 });
    expect(res.originalPrice).toBe(0);
    expect(res.discountPercent).toBe(100);
    expect(res.finalPayable).toBe(0);
  });
});

describe("calculateOrderMargin", () => {
  it("calculates F-commerce net profit, margin, and break-even price", () => {
    // Sell 1500, Cost 700, Delivery/Pkg 120, COD 1% (15), Ad 200 -> Total 1035, Profit 465
    const res = calculateOrderMargin({
      sellingPrice: 1500,
      productCost: 700,
      deliveryAndPackaging: 120,
      codChargePercent: 1,
      adCostPerOrder: 200,
    });
    expect(res.codFee).toBeCloseTo(15, 2);
    expect(res.totalCost).toBeCloseTo(1035, 2);
    expect(res.netProfit).toBeCloseTo(465, 2);
    expect(res.profitMarginPercent).toBeCloseTo(31, 2);
    expect(res.breakEvenPrice).toBeCloseTo(1020 / 0.99, 1);
  });

  it("flags negative profit margin clearly", () => {
    const res = calculateOrderMargin({
      sellingPrice: 500,
      productCost: 450,
      deliveryAndPackaging: 100,
      codChargePercent: 1,
      adCostPerOrder: 100,
    });
    expect(res.netProfit).toBeLessThan(0);
    expect(res.smartInsights.some((i) => i.id === "negative-margin")).toBe(true);
  });
});

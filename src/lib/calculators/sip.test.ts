import { describe, expect, it } from "vitest";
import { calculateSip } from "./sip";

describe("calculateSip", () => {
  it("handles zero and negative inputs safely", () => {
    const zero = calculateSip({
      monthlyInvestment: 0,
      annualReturnRate: 12,
      years: 10,
    });
    expect(zero.futureValue).toBe(0);
    expect(zero.yearlySchedule).toHaveLength(0);

    const neg = calculateSip({
      monthlyInvestment: -5000,
      annualReturnRate: -10,
      years: -5,
    });
    expect(neg.futureValue).toBe(0);
  });

  it("handles 0% return accurately", () => {
    const res = calculateSip({
      monthlyInvestment: 5000,
      annualReturnRate: 0,
      years: 5,
    });
    expect(res.totalInvested).toBe(300000);
    expect(res.futureValue).toBeCloseTo(300000, 2);
    expect(res.estimatedReturns).toBeCloseTo(0, 2);
  });

  it("matches exact SIP annuity-due formula for ৳5,000/mo @ 12% for 10 years", () => {
    const res = calculateSip({
      monthlyInvestment: 5000,
      annualReturnRate: 12,
      years: 10,
    });
    // m * ((1+0.01)^120 - 1) / 0.01 * 1.01 = 1,161,695.38
    expect(res.totalInvested).toBe(600000);
    expect(res.futureValue).toBeCloseTo(1161695.38, 0);
    expect(res.estimatedReturns).toBeCloseTo(561695.38, 0);
    expect(res.yearlySchedule).toHaveLength(10);
  });

  it("supports annual step-up and inflation adjustment", () => {
    const base = calculateSip({
      monthlyInvestment: 5000,
      annualReturnRate: 12,
      years: 10,
    });
    const stepped = calculateSip({
      monthlyInvestment: 5000,
      annualReturnRate: 12,
      years: 10,
      annualStepUpPercent: 10,
      inflationRate: 6,
    });
    expect(stepped.futureValue).toBeGreaterThan(base.futureValue);
    expect(stepped.inflationAdjustedValue).not.toBeNull();
    expect(stepped.inflationAdjustedValue!).toBeLessThan(stepped.futureValue);
  });
});

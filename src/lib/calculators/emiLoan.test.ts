import { describe, expect, it } from "vitest";
import { calculateEmiLoan } from "./emiLoan";

describe("calculateEmiLoan", () => {
  it("handles zero and negative values safely", () => {
    const res = calculateEmiLoan({
      principal: 0,
      annualInterestRate: 11.5,
      tenureYears: 5,
    });
    expect(res.monthlyEmi).toBe(0);
    expect(res.totalPayable).toBe(0);
    expect(res.yearlySchedule).toHaveLength(0);

    const neg = calculateEmiLoan({
      principal: -500000,
      annualInterestRate: -5,
      tenureYears: -2,
    });
    expect(neg.monthlyEmi).toBe(0);
  });

  it("handles 0% interest rate accurately", () => {
    const res = calculateEmiLoan({
      principal: 120000,
      annualInterestRate: 0,
      tenureYears: 1,
    });
    expect(res.monthlyEmi).toBeCloseTo(10000, 2);
    expect(res.totalInterest).toBeCloseTo(0, 2);
    expect(res.totalPayable).toBeCloseTo(120000, 2);
    expect(res.principalSharePercent).toBeCloseTo(100, 2);
  });

  it("computes standard ৳10 Lakh @ 11.5% for 5 years matching reducing-balance formula", () => {
    const res = calculateEmiLoan({
      principal: 1000000,
      annualInterestRate: 11.5,
      tenureYears: 5,
    });
    // Standard EMI = 21,992.61
    expect(res.monthlyEmi).toBeCloseTo(21992.61, 1);
    expect(res.totalPayable).toBeCloseTo(res.monthlyEmi * 60, 1);
    expect(res.totalInterest).toBeCloseTo(res.totalPayable - 1000000, 1);
    expect(res.yearlySchedule).toHaveLength(5);
    expect(res.yearlySchedule[4].closingBalance).toBeCloseTo(0, 1);
  });

  it("computes extra monthly prepayment interest and months saved", () => {
    const res = calculateEmiLoan({
      principal: 1000000,
      annualInterestRate: 12,
      tenureYears: 5,
      extraMonthlyPayment: 5000,
    });
    expect(res.prepayment).not.toBeNull();
    expect(res.prepayment!.monthsSaved).toBeGreaterThan(10);
    expect(res.prepayment!.interestSaved).toBeGreaterThan(50000);
    expect(res.smartInsights.some((i) => i.id === "prepayment-savings")).toBe(
      true
    );
  });
});

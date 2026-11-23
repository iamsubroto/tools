import { describe, expect, it } from "vitest";
import rawRates from "@/data/rates.json";
import { ratesSchema } from "@/data/rates.schema";
import { calculateAllSanchayapatra } from "./sanchayapatra";

const config = ratesSchema.parse(rawRates).sanchayapatra;

describe("calculateAllSanchayapatra", () => {
  it("handles zero and negative amounts safely", () => {
    const zeroRes = calculateAllSanchayapatra({ investmentAmount: 0 }, config);
    expect(zeroRes.investmentAmount).toBe(0);
    expect(zeroRes.schemes).toHaveLength(4);
    for (const s of zeroRes.schemes) {
      expect(s.netMonthly).toBe(0);
      expect(s.netQuarterly).toBe(0);
      expect(s.totalNetProfit).toBe(0);
    }

    const negRes = calculateAllSanchayapatra(
      { investmentAmount: -100000, existingHoldings: -50000 },
      config
    );
    expect(negRes.investmentAmount).toBe(0);
    expect(negRes.existingHoldings).toBe(0);
  });

  it("applies 0% tax for Pensioner and 5% tax for others at exact ৳5,00,000 boundary", () => {
    const res = calculateAllSanchayapatra(
      { investmentAmount: 500000 },
      config
    );
    expect(res.appliedTier).toBe("tier1");

    const pensioner = res.schemes.find((s) => s.id === "pensioner")!;
    const paribar = res.schemes.find((s) => s.id === "paribar")!;
    const threeMonth = res.schemes.find((s) => s.id === "threeMonth")!;
    const fiveYear = res.schemes.find((s) => s.id === "fiveYear")!;

    // Pensioner: 5,00,000 * 11.98% = 59,900/yr, 0% tax -> 4,991.67/month
    expect(pensioner.annualRate).toBe(0.1198);
    expect(pensioner.taxRate).toBe(0);
    expect(pensioner.netAnnual).toBeCloseTo(59900, 2);
    expect(pensioner.netMonthly).toBeCloseTo(59900 / 12, 2);

    // Paribar: 5,00,000 * 11.93% = 59,650/yr, 5% tax = 2,982.5 -> net 56,667.5/yr
    expect(paribar.annualRate).toBe(0.1193);
    expect(paribar.taxRate).toBe(0.05);
    expect(paribar.netAnnual).toBeCloseTo(56667.5, 2);
    expect(paribar.netMonthly).toBeCloseTo(56667.5 / 12, 2);

    // 3-Month: 5,00,000 * 11.82% = 59,100/yr, 5% tax -> net 56,145/yr -> 14,036.25 per 3 months, 4,678.75/month
    expect(threeMonth.annualRate).toBe(0.1182);
    expect(threeMonth.taxRate).toBe(0.05);
    expect(threeMonth.netQuarterly).toBeCloseTo(56145 / 4, 2);
    expect(threeMonth.netMonthly).toBeCloseTo(56145 / 12, 2);
    expect(threeMonth.netQuarterly).toBeCloseTo(threeMonth.netMonthly * 3, 2);

    // 5-Year: 5,00,000 * 11.83% = 59,150/yr, 5% tax -> net 56,192.5/yr
    expect(fiveYear.annualRate).toBe(0.1183);
    expect(fiveYear.taxRate).toBe(0.05);
    expect(fiveYear.totalNetProfit).toBeCloseTo(56192.5 * 5, 2);
  });

  it("jumps source tax to 10% across all schemes at ৳5,00,001 while staying in Tier 1", () => {
    const res = calculateAllSanchayapatra(
      { investmentAmount: 500001 },
      config
    );
    expect(res.appliedTier).toBe("tier1");
    for (const s of res.schemes) {
      expect(s.taxRate).toBe(0.1);
    }
  });

  it("stays in Tier 1 at exact ৳7,50,000 and switches to Tier 2 at ৳7,50,001", () => {
    const atCutoff = calculateAllSanchayapatra(
      { investmentAmount: 750000 },
      config
    );
    expect(atCutoff.appliedTier).toBe("tier1");
    expect(atCutoff.schemes.find((s) => s.id === "paribar")!.annualRate).toBe(
      0.1193
    );

    const aboveCutoff = calculateAllSanchayapatra(
      { investmentAmount: 750001 },
      config
    );
    expect(aboveCutoff.appliedTier).toBe("tier2");
    expect(
      aboveCutoff.schemes.find((s) => s.id === "paribar")!.annualRate
    ).toBe(0.118);
    expect(
      aboveCutoff.schemes.find((s) => s.id === "threeMonth")!.annualRate
    ).toBe(0.1177);
  });

  it("accounts for existing cumulative holdings when determining slab and tax", () => {
    // Investing 2,00,000 when user already holds 6,00,000 -> total 8,00,000 -> Tier 2 & 10% tax
    const res = calculateAllSanchayapatra(
      { investmentAmount: 200000, existingHoldings: 600000 },
      config
    );
    expect(res.cumulativeTotal).toBe(800000);
    expect(res.appliedTier).toBe("tier2");

    const paribar = res.schemes.find((s) => s.id === "paribar")!;
    expect(paribar.annualRate).toBe(0.118);
    expect(paribar.taxRate).toBe(0.1);
    // Profit is calculated only on the new 2,00,000 investment
    expect(paribar.grossAnnual).toBeCloseTo(200000 * 0.118, 2);
  });

  it("flags single-name statutory limits when exceeded", () => {
    const res = calculateAllSanchayapatra(
      { investmentAmount: 3500000 },
      config
    );
    expect(
      res.schemes.find((s) => s.id === "threeMonth")!.exceedsSingleLimit
    ).toBe(true);
    expect(
      res.schemes.find((s) => s.id === "fiveYear")!.exceedsSingleLimit
    ).toBe(true);
    expect(
      res.schemes.find((s) => s.id === "paribar")!.exceedsSingleLimit
    ).toBe(false);
    expect(
      res.schemes.find((s) => s.id === "pensioner")!.exceedsSingleLimit
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { calculateVatAit } from "./vatAit";

describe("calculateVatAit", () => {
  it("handles zero and negative amounts safely", () => {
    const res = calculateVatAit({ amount: 0, vatRatePercent: 15 });
    expect(res.exclusive.totalWithVat).toBe(0);
    expect(res.inclusive.baseWithoutVat).toBe(0);

    const neg = calculateVatAit({ amount: -1000, vatRatePercent: -15 });
    expect(neg.amount).toBe(0);
    expect(neg.vatRatePercent).toBe(0);
  });

  it("calculates exclusive and inclusive 15% VAT with exact round-trip accuracy", () => {
    const ex = calculateVatAit({ amount: 10000, vatRatePercent: 15 });
    expect(ex.exclusive.vatAmount).toBeCloseTo(1500, 2);
    expect(ex.exclusive.totalWithVat).toBeCloseTo(11500, 2);

    const inc = calculateVatAit({ amount: 11500, vatRatePercent: 15 });
    expect(inc.inclusive.baseWithoutVat).toBeCloseTo(10000, 2);
    expect(inc.inclusive.vatInside).toBeCloseTo(1500, 2);
  });

  it("handles 0% VAT cleanly without division issues", () => {
    const res = calculateVatAit({ amount: 5000, vatRatePercent: 0 });
    expect(res.exclusive.vatAmount).toBe(0);
    expect(res.exclusive.totalWithVat).toBe(5000);
    expect(res.inclusive.baseWithoutVat).toBe(5000);
    expect(res.inclusive.vatInside).toBe(0);
  });

  it("calculates VDS + AIT withholding accurately on exclusive & inclusive bills", () => {
    // Base 1,00,000 + 15% VAT (15,000) = 1,15,000 gross; 5% AIT on base = 5,000
    // Treasury challan = 20,000; Net payable to vendor = 95,000
    const res = calculateVatAit({
      amount: 100000,
      vatRatePercent: 15,
      aitRatePercent: 5,
    });
    expect(res.exclusive.vatAmount).toBeCloseTo(15000, 2);
    expect(res.exclusive.aitAmount).toBeCloseTo(5000, 2);
    expect(res.exclusive.totalTreasuryChallan).toBeCloseTo(20000, 2);
    expect(res.exclusive.netVendorPayableAfterVdsAit).toBeCloseTo(95000, 2);
  });
});

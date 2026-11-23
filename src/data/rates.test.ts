import { describe, expect, it } from "vitest";
import rawRates from "./rates.json";
import { ratesSchema } from "./rates.schema";

describe("rates.json schema validation", () => {
  it("conforms strictly to ratesSchema", () => {
    const parsed = ratesSchema.safeParse(rawRates);
    expect(parsed.success).toBe(true);
  });

  it("contains all 4 Bangladesh Sanchayapatra schemes with valid year-wise schedules", () => {
    const parsed = ratesSchema.parse(rawRates);
    const { schemes } = parsed.sanchayapatra;
    expect(schemes.paribar.tier1.yearWiseRates).toHaveLength(
      schemes.paribar.termYears
    );
    expect(schemes.pensioner.tier1.yearWiseRates).toHaveLength(
      schemes.pensioner.termYears
    );
    expect(schemes.threeMonth.tier1.yearWiseRates).toHaveLength(
      schemes.threeMonth.termYears
    );
    expect(schemes.fiveYear.tier1.yearWiseRates).toHaveLength(
      schemes.fiveYear.termYears
    );
  });
});

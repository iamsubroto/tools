import { describe, expect, it } from "vitest";
import rawRates from "@/data/rates.json";
import { ratesSchema } from "@/data/rates.schema";
import { calculateAgeAndGovtJob } from "./ageGovtJob";

const config = ratesSchema.parse(rawRates).govtJobAgeLimit;

describe("calculateAgeAndGovtJob", () => {
  it("computes exact years, months, days and leap-year DOB safely", () => {
    const res = calculateAgeAndGovtJob(
      { birthDate: "2000-02-29", targetDate: "2026-03-01" },
      config
    );
    expect(res.valid).toBe(true);
    expect(res.age).toEqual({ years: 26, months: 0, days: 0 });
    expect(res.jobEligibility.status).toBe("eligible");
  });

  it("checks exact 32-year BD Govt Job cutoff boundary (eligible on birthday, over 1 day later)", () => {
    const onCutoff = calculateAgeAndGovtJob(
      { birthDate: "1994-07-01", targetDate: "2026-07-01" },
      config
    );
    expect(onCutoff.valid).toBe(true);
    expect(onCutoff.age).toEqual({ years: 32, months: 0, days: 0 });
    expect(onCutoff.jobEligibility.status).toBe("eligible");

    const oneDayOver = calculateAgeAndGovtJob(
      { birthDate: "1994-07-01", targetDate: "2026-07-02" },
      config
    );
    expect(oneDayOver.age).toEqual({ years: 32, months: 0, days: 1 });
    expect(oneDayOver.jobEligibility.status).toBe("over-limit");
    expect(oneDayOver.jobEligibility.overLimitBy).toEqual({
      years: 0,
      months: 0,
      days: 1,
    });
  });

  it("handles too-young and birthDate > targetDate errors", () => {
    const young = calculateAgeAndGovtJob(
      { birthDate: "2012-01-01", targetDate: "2026-01-01" },
      config
    );
    expect(young.jobEligibility.status).toBe("too-young");

    const invalid = calculateAgeAndGovtJob(
      { birthDate: "2027-01-01", targetDate: "2026-01-01" },
      config
    );
    expect(invalid.valid).toBe(false);
  });
});

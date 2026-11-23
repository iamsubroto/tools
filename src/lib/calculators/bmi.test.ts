import { describe, expect, it } from "vitest";
import { calculateBmi, cmToFeetInches, feetInchesToCm } from "./bmi";

describe("calculateBmi", () => {
  it("handles zero and negative inputs safely", () => {
    expect(calculateBmi({ heightCm: 0, weightKg: 65 }).valid).toBe(false);
    expect(calculateBmi({ heightCm: -170, weightKg: 65 }).valid).toBe(false);
    expect(calculateBmi({ heightCm: 170, weightKg: 0 }).valid).toBe(false);
  });

  it("computes BMI and distinguishes WHO vs South Asian categories accurately", () => {
    // 170 cm, 65 kg -> BMI 22.49 (Normal in both WHO and Asian)
    const normal = calculateBmi({ heightCm: 170, weightKg: 65 });
    expect(normal.valid).toBe(true);
    expect(normal.bmi).toBeCloseTo(22.49, 2);
    expect(normal.whoCategory.labelEn).toBe("Normal");
    expect(normal.asianCategory.labelEn).toBe("Normal");

    // 170 cm, 70 kg -> BMI 24.22 (Normal in WHO, Overweight in Asian)
    const borderline = calculateBmi({ heightCm: 170, weightKg: 70 });
    expect(borderline.whoCategory.labelEn).toBe("Normal");
    expect(borderline.asianCategory.labelEn).toBe("Overweight");
    expect(
      borderline.smartInsights.some((i) => i.id === "asian-cutoff-diff")
    ).toBe(true);
  });

  it("converts feet/inches and cm accurately", () => {
    const cm = feetInchesToCm(5, 7);
    expect(cm).toBeCloseTo(170.18, 1);
    const back = cmToFeetInches(cm);
    expect(back.feet).toBe(5);
    expect(back.inches).toBeCloseTo(7, 0);
  });
});

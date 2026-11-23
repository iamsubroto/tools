import { describe, expect, it } from "vitest";
import { calculatePercentage } from "./percentage";

describe("calculatePercentage", () => {
  it("computes all 4 core percentage operations accurately", () => {
    const res = calculatePercentage({ percentA: 15, baseB: 2000 });
    expect(res.percentOfBase).toBeCloseTo(300, 4);
    expect(res.aIsWhatPercentOfB).toBeCloseTo(0.75, 4);
    expect(res.increasedByA).toBeCloseTo(2300, 4);
    expect(res.decreasedByA).toBeCloseTo(1700, 4);
  });

  it("handles division by zero cleanly", () => {
    const res = calculatePercentage({
      percentA: 20,
      baseB: 0,
      changeFrom: 0,
      changeTo: 100,
    });
    expect(res.percentOfBase).toBe(0);
    expect(res.aIsWhatPercentOfB).toBeNull();
    expect(res.changePercent).toBeNull();
  });

  it("computes percentage increase and decrease accurately", () => {
    const up = calculatePercentage({
      percentA: 10,
      baseB: 100,
      changeFrom: 1000,
      changeTo: 1250,
    });
    expect(up.changeDifference).toBe(250);
    expect(up.changePercent).toBeCloseTo(25, 4);

    const down = calculatePercentage({
      percentA: 10,
      baseB: 100,
      changeFrom: 200,
      changeTo: 150,
    });
    expect(down.changeDifference).toBe(-50);
    expect(down.changePercent).toBeCloseTo(-25, 4);
  });
});

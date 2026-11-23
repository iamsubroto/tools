import type { CalculatorResultBase, SmartInsight } from "./types";

export interface PercentageInput {
  percentA: number;
  baseB: number;
  changeFrom?: number;
  changeTo?: number;
}

export interface PercentageResult extends CalculatorResultBase {
  percentA: number;
  baseB: number;
  /** A% of B */
  percentOfBase: number;
  /** A is what % of B (null if B === 0) */
  aIsWhatPercentOfB: number | null;
  /** B increased by A% */
  increasedByA: number;
  /** B decreased by A% */
  decreasedByA: number;
  /** Percentage change from X to Y */
  changeFrom: number;
  changeTo: number;
  changeDifference: number;
  changePercent: number | null;
}

function safeNum(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

export function calculatePercentage(input: PercentageInput): PercentageResult {
  const percentA = safeNum(input.percentA);
  const baseB = safeNum(input.baseB);
  const changeFrom = safeNum(input.changeFrom ?? 1000);
  const changeTo = safeNum(input.changeTo ?? 1250);

  const percentOfBase = (percentA * baseB) / 100;
  const aIsWhatPercentOfB = baseB !== 0 ? (percentA / baseB) * 100 : null;
  const increasedByA = baseB * (1 + percentA / 100);
  const decreasedByA = baseB * (1 - percentA / 100);

  const changeDifference = changeTo - changeFrom;
  const changePercent =
    changeFrom !== 0 ? (changeDifference / Math.abs(changeFrom)) * 100 : null;

  const smartInsights: SmartInsight[] = [];

  if (percentA > 0 && baseB > 0) {
    const recoveryPct = (percentA / (100 - percentA)) * 100;
    if (percentA < 100 && percentA >= 10) {
      smartInsights.push({
        id: "asymmetry-tip",
        tone: "info",
        titleEn: "Percentage Drop vs Recovery Tip",
        titleBn: "শতাংশ কমার পর আগের অবস্থানে ফিরতে বেশি বাড়াতে হয়",
        bodyEn: `A ${percentA}% decrease reduces ${baseB} to ${decreasedByA.toFixed(2).replace(/\.00$/, "")}. To get back to ${baseB}, you need a ${recoveryPct.toFixed(1)}% increase—not ${percentA}%.`,
        bodyBn: `কোনো সংখ্যা ${percentA}% কমার পর আবার আগের মানে ফিরতে ${percentA}% নয়, বরং ${recoveryPct.toFixed(1)}% বাড়াতে হয়।`,
      });
    }
  }

  return {
    percentA,
    baseB,
    percentOfBase,
    aIsWhatPercentOfB,
    increasedByA,
    decreasedByA,
    changeFrom,
    changeTo,
    changeDifference,
    changePercent,
    smartInsights,
  };
}

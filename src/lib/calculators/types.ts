export type InsightTone = "positive" | "info" | "warning";

export interface SmartInsight {
  id: string;
  tone: InsightTone;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
}

export interface CalculatorResultBase {
  smartInsights: SmartInsight[];
}

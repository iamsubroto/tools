import { z } from "zod";

const sanchayapatraTierSchema = z.object({
  maturityRate: z.number().min(0).max(1),
  yearWiseRates: z.array(z.number().min(0).max(1)).min(1),
});

const sanchayapatraSchemeSchema = z.object({
  id: z.enum(["paribar", "pensioner", "threeMonth", "fiveYear"]),
  nameEn: z.string().min(1),
  nameBn: z.string().min(1),
  termYears: z.number().int().positive(),
  payoutFrequency: z.enum(["monthly", "quarterly", "maturity"]),
  payoutsPerYear: z.number().int().positive(),
  maxSingleLimit: z.number().positive(),
  eligibilityEn: z.string().min(1),
  eligibilityBn: z.string().min(1),
  taxRateUpToCutoff: z.number().min(0).max(1),
  taxRateAboveCutoff: z.number().min(0).max(1),
  tier1: sanchayapatraTierSchema,
  tier2: sanchayapatraTierSchema,
});

const vatPresetSchema = z.object({
  rate: z.number().min(0).max(100),
  labelEn: z.string().min(1),
  labelBn: z.string().min(1),
  usageEn: z.string().min(1),
  usageBn: z.string().min(1),
});

const loanPresetSchema = z.object({
  id: z.enum(["home", "car", "personal"]),
  labelEn: z.string().min(1),
  labelBn: z.string().min(1),
  amount: z.number().positive(),
  annualRate: z.number().min(0).max(50),
  tenureYears: z.number().positive().max(40),
});

export const ratesSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().min(1),
    lastGlobalAudit: z.string().min(1),
  }),
  sanchayapatra: z.object({
    lastUpdated: z.string().min(1),
    effectiveFrom: z.string().min(1),
    reviewCadence: z.string().min(1),
    officialSource: z.string().min(1),
    officialSourceUrl: z.string().url(),
    slabCutoffBdt: z.number().positive(),
    taxCutoffBdt: z.number().positive(),
    schemes: z.object({
      paribar: sanchayapatraSchemeSchema,
      pensioner: sanchayapatraSchemeSchema,
      threeMonth: sanchayapatraSchemeSchema,
      fiveYear: sanchayapatraSchemeSchema,
    }),
  }),
  vatBd: z.object({
    lastUpdated: z.string().min(1),
    officialSource: z.string().min(1),
    officialSourceUrl: z.string().url(),
    standardRate: z.number().min(0).max(100),
    presets: z.array(vatPresetSchema).min(1),
    aitPresets: z.array(z.number().min(0).max(100)).min(1),
  }),
  loanPresetsBd: z.object({
    lastUpdated: z.string().min(1),
    officialSource: z.string().min(1),
    officialSourceUrl: z.string().url(),
    presets: z.array(loanPresetSchema).min(1),
  }),
});

export type RatesConfig = z.infer<typeof ratesSchema>;
export type SanchayapatraConfig = RatesConfig["sanchayapatra"];
export type SanchayapatraSchemeConfig = z.infer<
  typeof sanchayapatraSchemeSchema
>;
export type VatBdConfig = RatesConfig["vatBd"];
export type LoanPresetsBdConfig = RatesConfig["loanPresetsBd"];

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
});

export type RatesConfig = z.infer<typeof ratesSchema>;
export type SanchayapatraConfig = RatesConfig["sanchayapatra"];
export type SanchayapatraSchemeConfig = z.infer<
  typeof sanchayapatraSchemeSchema
>;

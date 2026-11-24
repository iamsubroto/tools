import { z } from "zod";

export const divisionSchema = z.object({
  id: z.string().min(1),
  nameEn: z.string().min(1),
  nameBn: z.string().min(1),
  codeRange: z.string().min(1),
});

export const districtSchema = z.object({
  id: z.string().min(1),
  divisionId: z.string().min(1),
  nameEn: z.string().min(1),
  nameBn: z.string().min(1),
  aliases: z.array(z.string()),
  headCode: z.string().regex(/^\d{4}$/, "Head postcode must be 4 digits"),
});

export const postcodeEntrySchema = z.object({
  code: z.string().regex(/^\d{4}$/, "Postcode must be 4 digits"),
  districtId: z.string().min(1),
  upazilaEn: z.string().min(1),
  upazilaBn: z.string().min(1),
  postOfficeEn: z.string().min(1),
  postOfficeBn: z.string().min(1),
});

export const postcodesDatasetSchema = z.object({
  meta: z.object({
    lastUpdated: z.string().min(1),
    officialSource: z.string().min(1),
    officialSourceUrl: z.string().url(),
    totalDivisions: z.number().int().positive(),
    totalDistricts: z.number().int().positive(),
    totalPostcodes: z.number().int().positive(),
  }),
  divisions: z.array(divisionSchema).min(1),
  districts: z.array(districtSchema).min(1),
  postcodes: z.array(postcodeEntrySchema).min(1),
});

export type DivisionRecord = z.infer<typeof divisionSchema>;
export type DistrictRecord = z.infer<typeof districtSchema>;
export type PostcodeRecord = z.infer<typeof postcodeEntrySchema>;
export type PostcodesDataset = z.infer<typeof postcodesDatasetSchema>;

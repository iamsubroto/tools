import { describe, expect, it } from "vitest";
import rawPostcodes from "./postcodes.json";
import { postcodesDatasetSchema } from "./postcodes.schema";

describe("postcodes.json schema & referential integrity", () => {
  it("conforms strictly to postcodesDatasetSchema", () => {
    const parsed = postcodesDatasetSchema.safeParse(rawPostcodes);
    expect(parsed.success).toBe(true);
  });

  it("covers all 8 divisions and all 64 districts of Bangladesh", () => {
    const data = postcodesDatasetSchema.parse(rawPostcodes);
    expect(data.divisions).toHaveLength(8);
    expect(data.districts).toHaveLength(64);
    expect(data.meta.totalDivisions).toBe(data.divisions.length);
    expect(data.meta.totalDistricts).toBe(data.districts.length);
    expect(data.meta.totalPostcodes).toBe(data.postcodes.length);
    expect(data.postcodes.length).toBeGreaterThanOrEqual(1300);
  });

  it("maintains valid divisionId and districtId references with unique 4-digit codes", () => {
    const data = postcodesDatasetSchema.parse(rawPostcodes);
    const divisionIds = new Set(data.divisions.map((d) => d.id));
    const districtIds = new Set(data.districts.map((d) => d.id));
    const seenCodes = new Set<string>();

    for (const district of data.districts) {
      expect(divisionIds.has(district.divisionId)).toBe(true);
    }

    for (const entry of data.postcodes) {
      expect(districtIds.has(entry.districtId)).toBe(true);
      expect(seenCodes.has(entry.code)).toBe(false);
      seenCodes.add(entry.code);
    }

    // Every district must have at least one postcode
    const districtsWithCodes = new Set(data.postcodes.map((p) => p.districtId));
    expect(districtsWithCodes.size).toBe(64);
  });

  it("includes key divisional GPO and landmark postcodes accurately", () => {
    const data = postcodesDatasetSchema.parse(rawPostcodes);
    const byCode = new Map(data.postcodes.map((p) => [p.code, p]));

    expect(byCode.get("1000")?.districtId).toBe("dhaka");
    expect(byCode.get("1212")?.districtId).toBe("dhaka");
    expect(byCode.get("4000")?.districtId).toBe("chattogram");
    expect(byCode.get("3100")?.districtId).toBe("sylhet");
    expect(byCode.get("9000")?.districtId).toBe("khulna");
    expect(byCode.get("6000")?.districtId).toBe("rajshahi");
    expect(byCode.get("8200")?.districtId).toBe("barishal");
    expect(byCode.get("5400")?.districtId).toBe("rangpur");
    expect(byCode.get("2200")?.districtId).toBe("mymensingh");
    // Verified anomaly fixes
    expect(byCode.get("3893")?.districtId).toBe("sunamganj");
    expect(byCode.get("1333")?.districtId).toBe("munshiganj");
  });
});

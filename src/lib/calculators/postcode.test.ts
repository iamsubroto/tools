import { describe, expect, it } from "vitest";
import rawPostcodes from "@/data/postcodes.json";
import { postcodesDatasetSchema } from "@/data/postcodes.schema";
import {
  buildPostcodeIndex,
  buildPostcodesCsv,
  filterPostcodes,
  formatPostalAddress,
  getDistrictsForDivision,
  getPostalZoneInfo,
  getUpazilasForDistrict,
  lookupExactPostcode,
  toAsciiDigits,
} from "./postcode";

const dataset = postcodesDatasetSchema.parse(rawPostcodes);
const index = buildPostcodeIndex(dataset);

describe("Bangladesh Postcode search & cascading filter engine", () => {
  it("converts Bangla digits to ASCII digits cleanly", () => {
    expect(toAsciiDigits("১২১২")).toBe("1212");
    expect(toAsciiDigits("৯০০০")).toBe("9000");
    expect(toAsciiDigits("ঢাকা ১২৩০")).toBe("ঢাকা 1230");
  });

  it("filters districts by division and returns all 64 when no division is selected", () => {
    expect(getDistrictsForDivision(index)).toHaveLength(64);
    expect(getDistrictsForDivision(index, "dhaka")).toHaveLength(13);
    expect(getDistrictsForDivision(index, "chattogram")).toHaveLength(11);
    expect(getDistrictsForDivision(index, "khulna")).toHaveLength(10);
    expect(getDistrictsForDivision(index, "sylhet")).toHaveLength(4);
    expect(getDistrictsForDivision(index, "mymensingh")).toHaveLength(4);
  });

  it("cascades Zila -> Upazilas and returns all postcodes for Zila or narrowed Upazila", () => {
    const dhakaUpazilas = getUpazilasForDistrict(index, "dhaka");
    expect(dhakaUpazilas.length).toBeGreaterThan(15);

    const savarSummary = dhakaUpazilas.find((u) => u.upazilaEn === "Savar");
    expect(savarSummary).toBeDefined();
    expect(savarSummary!.count).toBeGreaterThan(5);

    const allDhaka = filterPostcodes(index, { districtId: "dhaka" });
    const onlySavar = filterPostcodes(index, {
      districtId: "dhaka",
      upazilaEn: "Savar",
    });

    expect(allDhaka.length).toBeGreaterThan(onlySavar.length);
    expect(onlySavar.length).toBe(savarSummary!.count);
    expect(onlySavar.every((e) => e.upazilaEn === "Savar")).toBe(true);
  });

  it("supports reverse lookup for 4-digit postcodes in both English and Bangla digits", () => {
    const enMatch = lookupExactPostcode(index, "1212");
    const bnMatch = lookupExactPostcode(index, "১২১২");
    expect(enMatch).not.toBeNull();
    expect(bnMatch).not.toBeNull();
    expect(enMatch!.match.districtId).toBe("dhaka");
    expect(enMatch!.match.code).toBe(bnMatch!.match.code);
    expect(enMatch!.zone.prefix).toBe("1xxx");

    expect(lookupExactPostcode(index, "9999")).toBeNull();
    expect(lookupExactPostcode(index, "12")).toBeNull();
  });

  it("matches old official spellings (aliases) and Bangla queries seamlessly", () => {
    const ctg = filterPostcodes(index, { query: "Chittagong" });
    expect(ctg.length).toBeGreaterThan(30);
    expect(ctg.every((e) => e.districtId === "chattogram")).toBe(true);

    const comilla = filterPostcodes(index, { query: "Comilla" });
    expect(comilla.length).toBeGreaterThan(20);
    expect(comilla.some((e) => e.districtId === "cumilla")).toBe(true);

    const jessore = filterPostcodes(index, { query: "Jessore" });
    expect(jessore.some((e) => e.districtId === "jashore")).toBe(true);

    const bogra = filterPostcodes(index, { query: "Bogra" });
    expect(bogra.some((e) => e.districtId === "bogura")).toBe(true);

    const banglaQuery = filterPostcodes(index, { query: "গুলশান" });
    expect(banglaQuery.some((e) => e.code === "1212")).toBe(true);
  });

  it("supports multi-word search and saved-only filtering", () => {
    const multi = filterPostcodes(index, { query: "dhaka savar" });
    expect(multi.length).toBeGreaterThan(5);
    expect(
      multi.every((e) => e.districtId === "dhaka" && e.upazilaEn === "Savar")
    ).toBe(true);

    const saved = filterPostcodes(index, {
      savedOnly: true,
      savedCodes: new Set(["1000", "4000"]),
    });
    expect(saved.map((e) => e.code)).toEqual(["1000", "4000"]);
  });

  it("formats postal addresses in EN/BN and generates UTF-8 BOM CSV safely", () => {
    const gulshan = index.byCode.get("1212")!;
    expect(formatPostalAddress(gulshan, "en")).toContain("1212, Bangladesh");
    expect(formatPostalAddress(gulshan, "bn")).toContain("১২১২, বাংলাদেশ");

    const csv = buildPostcodesCsv([gulshan]);
    expect(csv.startsWith("\uFEFFPostcode,Post Office (EN)")).toBe(true);
    expect(csv).toContain("1212");

    expect(getPostalZoneInfo("9000").prefix).toBe("9xxx");
    expect(getPostalZoneInfo("4000").prefix).toBe("4xxx");
  });
});

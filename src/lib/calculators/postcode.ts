import type {
  DistrictRecord,
  DivisionRecord,
  PostcodesDataset,
} from "@/data/postcodes.schema";
import { toBanglaDigits } from "@/lib/formatters";

export interface EnrichedPostcode {
  code: string;
  codeBn: string;
  postOfficeEn: string;
  postOfficeBn: string;
  upazilaEn: string;
  upazilaBn: string;
  districtId: string;
  districtEn: string;
  districtBn: string;
  divisionId: string;
  divisionEn: string;
  divisionBn: string;
  searchBlob: string;
}

export interface UpazilaSummary {
  upazilaEn: string;
  upazilaBn: string;
  count: number;
}

export interface DistrictSummary extends DistrictRecord {
  divisionEn: string;
  divisionBn: string;
  postcodeCount: number;
  upazilaCount: number;
}

export interface PostcodeFilterInput {
  divisionId?: string;
  districtId?: string;
  upazilaEn?: string;
  query?: string;
  savedOnly?: boolean;
  savedCodes?: ReadonlySet<string>;
}

export interface PostalZoneInfo {
  prefix: string;
  regionEn: string;
  regionBn: string;
}

const BN_TO_ASCII: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export function toAsciiDigits(input: string): string {
  return input.replace(/[০-৯]/g, (ch) => BN_TO_ASCII[ch] ?? ch);
}

export function normalizeQuery(input: string): string {
  return toAsciiDigits(input)
    .toLowerCase()
    .replace(/['’.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface PostcodeIndex {
  meta: PostcodesDataset["meta"];
  divisions: DivisionRecord[];
  divisionsById: Map<string, DivisionRecord>;
  districts: DistrictSummary[];
  districtsById: Map<string, DistrictSummary>;
  entries: EnrichedPostcode[];
  byCode: Map<string, EnrichedPostcode>;
  byDistrict: Map<string, EnrichedPostcode[]>;
  upazilasByDistrict: Map<string, UpazilaSummary[]>;
}

export function buildPostcodeIndex(dataset: PostcodesDataset): PostcodeIndex {
  const divisionsById = new Map<string, DivisionRecord>();
  for (const div of dataset.divisions) {
    divisionsById.set(div.id, div);
  }

  const rawDistrictById = new Map<string, DistrictRecord>();
  for (const dist of dataset.districts) {
    rawDistrictById.set(dist.id, dist);
  }

  const entries: EnrichedPostcode[] = [];
  const byCode = new Map<string, EnrichedPostcode>();
  const byDistrict = new Map<string, EnrichedPostcode[]>();
  const upazilaCounterByDistrict = new Map<
    string,
    Map<string, { upazilaEn: string; upazilaBn: string; count: number }>
  >();

  for (const raw of dataset.postcodes) {
    const dist = rawDistrictById.get(raw.districtId);
    if (!dist) continue;
    const div = divisionsById.get(dist.divisionId);
    if (!div) continue;

    const codeBn = toBanglaDigits(raw.code);
    const searchParts = [
      raw.code,
      codeBn,
      raw.postOfficeEn,
      raw.postOfficeBn,
      raw.upazilaEn,
      raw.upazilaBn,
      dist.nameEn,
      dist.nameBn,
      ...dist.aliases,
      div.nameEn,
      div.nameBn,
    ];

    const enriched: EnrichedPostcode = {
      code: raw.code,
      codeBn,
      postOfficeEn: raw.postOfficeEn,
      postOfficeBn: raw.postOfficeBn,
      upazilaEn: raw.upazilaEn,
      upazilaBn: raw.upazilaBn,
      districtId: dist.id,
      districtEn: dist.nameEn,
      districtBn: dist.nameBn,
      divisionId: div.id,
      divisionEn: div.nameEn,
      divisionBn: div.nameBn,
      searchBlob: normalizeQuery(searchParts.join(" ")),
    };

    entries.push(enriched);
    byCode.set(enriched.code, enriched);

    let distList = byDistrict.get(dist.id);
    if (!distList) {
      distList = [];
      byDistrict.set(dist.id, distList);
    }
    distList.push(enriched);

    let upaMap = upazilaCounterByDistrict.get(dist.id);
    if (!upaMap) {
      upaMap = new Map();
      upazilaCounterByDistrict.set(dist.id, upaMap);
    }
    const existingUpa = upaMap.get(raw.upazilaEn);
    if (existingUpa) {
      existingUpa.count += 1;
    } else {
      upaMap.set(raw.upazilaEn, {
        upazilaEn: raw.upazilaEn,
        upazilaBn: raw.upazilaBn,
        count: 1,
      });
    }
  }

  const upazilasByDistrict = new Map<string, UpazilaSummary[]>();
  for (const [distId, map] of upazilaCounterByDistrict.entries()) {
    const list = [...map.values()].sort((a, b) =>
      a.upazilaEn.localeCompare(b.upazilaEn)
    );
    upazilasByDistrict.set(distId, list);
  }

  const districts: DistrictSummary[] = dataset.districts
    .map((dist) => {
      const div = divisionsById.get(dist.divisionId)!;
      const distEntries = byDistrict.get(dist.id) ?? [];
      const distUpas = upazilasByDistrict.get(dist.id) ?? [];
      return {
        ...dist,
        divisionEn: div.nameEn,
        divisionBn: div.nameBn,
        postcodeCount: distEntries.length,
        upazilaCount: distUpas.length,
      };
    })
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  const districtsById = new Map<string, DistrictSummary>();
  for (const dist of districts) {
    districtsById.set(dist.id, dist);
  }

  return {
    meta: dataset.meta,
    divisions: dataset.divisions,
    divisionsById,
    districts,
    districtsById,
    entries,
    byCode,
    byDistrict,
    upazilasByDistrict,
  };
}

export function getDistrictsForDivision(
  index: PostcodeIndex,
  divisionId?: string
): DistrictSummary[] {
  if (!divisionId) return index.districts;
  return index.districts.filter((d) => d.divisionId === divisionId);
}

export function getUpazilasForDistrict(
  index: PostcodeIndex,
  districtId?: string
): UpazilaSummary[] {
  if (!districtId) return [];
  return index.upazilasByDistrict.get(districtId) ?? [];
}

export function lookupExactPostcode(
  index: PostcodeIndex,
  rawQuery: string
): {
  match: EnrichedPostcode;
  siblings: EnrichedPostcode[];
  zone: PostalZoneInfo;
} | null {
  const cleaned = toAsciiDigits(rawQuery).trim();
  if (!/^\d{4}$/.test(cleaned)) return null;
  const match = index.byCode.get(cleaned);
  if (!match) return null;

  const distEntries = index.byDistrict.get(match.districtId) ?? [];
  const siblings = distEntries.filter(
    (e) => e.upazilaEn === match.upazilaEn && e.code !== match.code
  );
  return {
    match,
    siblings,
    zone: getPostalZoneInfo(match.code),
  };
}

export function filterPostcodes(
  index: PostcodeIndex,
  input: PostcodeFilterInput
): EnrichedPostcode[] {
  const {
    divisionId = "",
    districtId = "",
    upazilaEn = "",
    query = "",
    savedOnly = false,
    savedCodes,
  } = input;

  let pool: EnrichedPostcode[];
  if (districtId) {
    pool = index.byDistrict.get(districtId) ?? [];
  } else {
    pool = index.entries;
  }

  if (divisionId && !districtId) {
    pool = pool.filter((e) => e.divisionId === divisionId);
  }

  if (upazilaEn) {
    pool = pool.filter((e) => e.upazilaEn === upazilaEn);
  }

  if (savedOnly) {
    if (!savedCodes || savedCodes.size === 0) return [];
    pool = pool.filter((e) => savedCodes.has(e.code));
  }

  const normalized = normalizeQuery(query);
  if (!normalized) return pool;

  const tokens = normalized.split(" ").filter(Boolean);
  const scored: Array<{ entry: EnrichedPostcode; score: number }> = [];

  for (const entry of pool) {
    let matchesAll = true;
    for (const token of tokens) {
      if (!entry.searchBlob.includes(token)) {
        matchesAll = false;
        break;
      }
    }
    if (!matchesAll) continue;

    // Relevance boost: exact code > code prefix > post office startsWith > upazila startsWith > district match
    let score = 0;
    if (entry.code === normalized) score += 100;
    else if (entry.code.startsWith(normalized)) score += 60;
    if (normalizeQuery(entry.postOfficeEn).startsWith(normalized)) score += 40;
    else if (entry.postOfficeBn.includes(query.trim())) score += 35;
    if (normalizeQuery(entry.upazilaEn).startsWith(normalized)) score += 25;
    if (normalizeQuery(entry.districtEn).startsWith(normalized)) score += 15;

    scored.push({ entry, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.entry.code.localeCompare(b.entry.code)
  );
  return scored.map((s) => s.entry);
}

export function getPostalZoneInfo(code: string): PostalZoneInfo {
  const prefix = toAsciiDigits(code).trim()[0] ?? "";
  switch (prefix) {
    case "1":
      return {
        prefix: "1xxx",
        regionEn: "Dhaka Metro & Central Region",
        regionBn: "ঢাকা মেট্রো ও মধ্যাঞ্চল",
      };
    case "2":
      return {
        prefix: "2xxx",
        regionEn: "Mymensingh & Kishoreganj Region",
        regionBn: "ময়মনসিংহ ও কিশোরগঞ্জ অঞ্চল",
      };
    case "3":
      return {
        prefix: "3xxx",
        regionEn: "Sylhet, Cumilla & Noakhali Region",
        regionBn: "সিলেট, কুমিল্লা ও নোয়াখালী অঞ্চল",
      };
    case "4":
      return {
        prefix: "4xxx",
        regionEn: "Chattogram & Hill Tracts Region",
        regionBn: "চট্টগ্রাম ও পার্বত্য অঞ্চল",
      };
    case "5":
      return {
        prefix: "5xxx",
        regionEn: "Rangpur & Bogura Northern Region",
        regionBn: "রংপুর ও বগুড়া উত্তরাঞ্চল",
      };
    case "6":
      return {
        prefix: "6xxx",
        regionEn: "Rajshahi & Pabna Region",
        regionBn: "রাজশাহী ও পাবনা অঞ্চল",
      };
    case "7":
      return {
        prefix: "7xxx",
        regionEn: "Kushtia, Jashore & Faridpur Region",
        regionBn: "কুষ্টিয়া, যশোর ও ফরিদপুর অঞ্চল",
      };
    case "8":
      return {
        prefix: "8xxx",
        regionEn: "Barishal & Southern Delta Region",
        regionBn: "বরিশাল ও দক্ষিণাঞ্চল",
      };
    case "9":
      return {
        prefix: "9xxx",
        regionEn: "Khulna, Bagerhat & Satkhira Region",
        regionBn: "খুলনা, বাগেরহাট ও সাতক্ষীরা অঞ্চল",
      };
    default:
      return {
        prefix: "BD",
        regionEn: "Bangladesh Postal Network",
        regionBn: "বাংলাদেশ ডাক বিভাগ",
      };
  }
}

export function formatPostalAddress(
  entry: EnrichedPostcode,
  locale: "en" | "bn" = "en"
): string {
  if (locale === "bn") {
    return `${entry.postOfficeBn}, ${entry.upazilaBn}, ${entry.districtBn} - ${entry.codeBn}, বাংলাদেশ`;
  }
  return `${entry.postOfficeEn}, ${entry.upazilaEn}, ${entry.districtEn} - ${entry.code}, Bangladesh`;
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildPostcodesCsv(entries: EnrichedPostcode[]): string {
  const header = [
    "Postcode",
    "Post Office (EN)",
    "Post Office (BN)",
    "Upazila / Thana (EN)",
    "Upazila / Thana (BN)",
    "Zila / District (EN)",
    "Zila / District (BN)",
    "Division (EN)",
    "Division (BN)",
  ];
  const rows = entries.map((e) =>
    [
      e.code,
      e.postOfficeEn,
      e.postOfficeBn,
      e.upazilaEn,
      e.upazilaBn,
      e.districtEn,
      e.districtBn,
      e.divisionEn,
      e.divisionBn,
    ]
      .map(escapeCsvCell)
      .join(",")
  );
  // UTF-8 BOM so Microsoft Excel renders Bangla cleanly on Windows
  return "\uFEFF" + [header.join(","), ...rows].join("\r\n");
}

"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  ChevronDown,
  Compass,
  Copy,
  Download,
  LayoutGrid,
  List,
  MapPin,
  Printer,
  RotateCcw,
  Search,
  Share2,
  X,
} from "lucide-react";
import rawPostcodes from "@/data/postcodes.json";
import { postcodesDatasetSchema } from "@/data/postcodes.schema";
import {
  buildPostcodeIndex,
  buildPostcodesCsv,
  filterPostcodes,
  formatPostalAddress,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  lookupExactPostcode,
  normalizeQuery,
  type EnrichedPostcode,
} from "@/lib/calculators/postcode";
import { formatSouthAsianNumber, toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

const DATASET = postcodesDatasetSchema.parse(rawPostcodes);
const POSTCODE_INDEX = buildPostcodeIndex(DATASET);

const SAVED_STORAGE_KEY = "toolsbd_saved_postcodes_v1";
const SAVED_EVENT = "toolsbd-saved-postcodes-change";
const URL_EVENT = "toolsbd-postcode-url-change";
const PAGE_STEP = 60;

// ── External Stores (React 19 useSyncExternalStore, zero useEffect setState) ──

function subscribeSaved(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(SAVED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SAVED_EVENT, callback);
  };
}

function getSavedSnapshot(): string {
  try {
    return window.localStorage.getItem(SAVED_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerSavedSnapshot(): string {
  return "[]";
}

function subscribeUrlSearch(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_EVENT, callback);
  };
}

function getUrlSearchSnapshot(): string {
  return window.location.search;
}

function getServerUrlSearchSnapshot(): string {
  return "";
}

function writeUrlParams(next: {
  division?: string;
  zila?: string;
  upazila?: string;
  q?: string;
}) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (next.division) params.set("division", next.division);
  if (next.zila) params.set("zila", next.zila);
  if (next.upazila) params.set("upazila", next.upazila);
  if (next.q) params.set("q", next.q);
  const qs = params.toString();
  const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", nextUrl);
  window.dispatchEvent(new Event(URL_EVENT));
}

// ── Popular Quick Picks ──────────────────────────────────────────────────────

interface QuickPick {
  labelEn: string;
  labelBn: string;
  params: { division?: string; zila?: string; upazila?: string; q?: string };
}

const POPULAR_PICKS: QuickPick[] = [
  { labelEn: "Dhaka", labelBn: "ঢাকা", params: { zila: "dhaka" } },
  { labelEn: "Gulshan 1212", labelBn: "গুলশান ১২১২", params: { q: "1212" } },
  {
    labelEn: "Dhanmondi 1209",
    labelBn: "ধানমন্ডি ১২০৯",
    params: { q: "1209" },
  },
  { labelEn: "Uttara 1230", labelBn: "উত্তরা ১২৩০", params: { q: "1230" } },
  {
    labelEn: "Savar",
    labelBn: "সাভার",
    params: { zila: "dhaka", upazila: "Savar" },
  },
  {
    labelEn: "Chattogram",
    labelBn: "চট্টগ্রাম",
    params: { zila: "chattogram" },
  },
  { labelEn: "Sylhet", labelBn: "সিলেট", params: { zila: "sylhet" } },
  { labelEn: "Khulna", labelBn: "খুলনা", params: { zila: "khulna" } },
];

const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white";

export function PostcodeFinderClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = (en: string, bn: string) => (isBn ? bn : en);
  const num = (v: number) => formatSouthAsianNumber(v, { locale });
  const fmtCode = (code: string) => (isBn ? toBanglaDigits(code) : code);

  const searchInputId = useId();
  const zilaComboId = useId();
  const zilaListId = useId();
  const upazilaSelectId = useId();

  // URL-synced filter state
  const urlSearch = useSyncExternalStore(
    subscribeUrlSearch,
    getUrlSearchSnapshot,
    getServerUrlSearchSnapshot
  );

  const filters = useMemo(() => {
    const params = new URLSearchParams(urlSearch);
    const rawDiv = params.get("division") ?? "";
    const rawZila = params.get("zila") ?? "";
    const rawUpazila = params.get("upazila") ?? "";
    const rawQ = params.get("q") ?? "";

    const validZila = POSTCODE_INDEX.districtsById.has(rawZila) ? rawZila : "";
    const validDiv = POSTCODE_INDEX.divisionsById.has(rawDiv) ? rawDiv : "";
    const validUpazila =
      validZila &&
      getUpazilasForDistrict(POSTCODE_INDEX, validZila).some(
        (u) => u.upazilaEn === rawUpazila
      )
        ? rawUpazila
        : "";

    return {
      divisionId: validZila
        ? POSTCODE_INDEX.districtsById.get(validZila)!.divisionId
        : validDiv,
      districtId: validZila,
      upazilaEn: validUpazila,
      query: rawQ,
    };
  }, [urlSearch]);

  // Saved/bookmarked postcodes via localStorage external store
  const savedJson = useSyncExternalStore(
    subscribeSaved,
    getSavedSnapshot,
    getServerSavedSnapshot
  );

  const savedCodes = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(savedJson);
      if (Array.isArray(parsed)) {
        return new Set(
          parsed.filter((item): item is string => typeof item === "string")
        );
      }
    } catch {
      // Ignore invalid JSON
    }
    return new Set<string>();
  }, [savedJson]);

  const toggleSaved = (code: string) => {
    const next = new Set(savedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    try {
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...next]));
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch {
      // Ignore storage quota / private mode
    }
  };

  // Local UI state
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [savedOnly, setSavedOnly] = useState(false);
  const [browseAllPostcodes, setBrowseAllPostcodes] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_STEP);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [zilaOpen, setZilaOpen] = useState(false);
  const [zilaSearch, setZilaSearch] = useState("");
  const [zilaHighlightIdx, setZilaHighlightIdx] = useState(0);

  const zilaComboRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!zilaOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        zilaComboRef.current &&
        !zilaComboRef.current.contains(event.target as Node)
      ) {
        setZilaOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [zilaOpen]);

  // Derived cascading lists
  const availableDistricts = useMemo(
    () =>
      getDistrictsForDivision(
        POSTCODE_INDEX,
        filters.districtId ? "" : filters.divisionId
      ),
    [filters.divisionId, filters.districtId]
  );

  const filteredZilaOptions = useMemo(() => {
    const q = normalizeQuery(zilaSearch);
    const base = filters.divisionId && !q
      ? getDistrictsForDivision(POSTCODE_INDEX, filters.divisionId)
      : POSTCODE_INDEX.districts;
    if (!q) return base;
    return base.filter((d) => {
      const hay = normalizeQuery(
        [d.nameEn, d.nameBn, d.divisionEn, d.divisionBn, d.headCode, ...d.aliases].join(" ")
      );
      return hay.includes(q);
    });
  }, [zilaSearch, filters.divisionId]);

  const selectedDistrict = filters.districtId
    ? POSTCODE_INDEX.districtsById.get(filters.districtId) ?? null
    : null;

  const upazilas = useMemo(
    () => getUpazilasForDistrict(POSTCODE_INDEX, filters.districtId),
    [filters.districtId]
  );

  const exactLookup = useMemo(
    () => lookupExactPostcode(POSTCODE_INDEX, filters.query),
    [filters.query]
  );

  const matchingPostcodes = useMemo(
    () =>
      filterPostcodes(POSTCODE_INDEX, {
        divisionId: filters.divisionId,
        districtId: filters.districtId,
        upazilaEn: filters.upazilaEn,
        query: filters.query,
        savedOnly,
        savedCodes,
      }),
    [
      filters.divisionId,
      filters.districtId,
      filters.upazilaEn,
      filters.query,
      savedOnly,
      savedCodes,
    ]
  );

  const hasActiveFilter =
    Boolean(filters.districtId) ||
    Boolean(filters.query.trim()) ||
    savedOnly ||
    browseAllPostcodes;

  const showDistrictExplorer = !hasActiveFilter;

  const visiblePostcodes = useMemo(
    () => matchingPostcodes.slice(0, visibleLimit),
    [matchingPostcodes, visibleLimit]
  );

  // Actions
  const flashCopy = (key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1800);
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopy(key);
    } catch {
      // Ignore clipboard failures
    }
  };

  const selectDivision = (divisionId: string) => {
    setSavedOnly(false);
    setVisibleLimit(PAGE_STEP);
    writeUrlParams({
      division: divisionId,
      zila: "",
      upazila: "",
      q: filters.query,
    });
  };

  const selectZila = (districtId: string, scrollToResults = false) => {
    setSavedOnly(false);
    setZilaOpen(false);
    setZilaSearch("");
    setVisibleLimit(PAGE_STEP);
    const dist = POSTCODE_INDEX.districtsById.get(districtId);
    writeUrlParams({
      division: dist?.divisionId ?? "",
      zila: districtId,
      upazila: "",
      q: "",
    });
    if (scrollToResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const selectUpazila = (upazilaEn: string) => {
    setSavedOnly(false);
    setVisibleLimit(PAGE_STEP);
    writeUrlParams({
      division: filters.divisionId,
      zila: filters.districtId,
      upazila: upazilaEn,
      q: filters.query,
    });
  };

  const setSearchQuery = (q: string) => {
    setSavedOnly(false);
    setVisibleLimit(PAGE_STEP);
    writeUrlParams({
      division: filters.divisionId,
      zila: filters.districtId,
      upazila: filters.upazilaEn,
      q,
    });
  };

  const applyQuickPick = (pick: QuickPick) => {
    setSavedOnly(false);
    setBrowseAllPostcodes(false);
    setVisibleLimit(PAGE_STEP);
    const dist = pick.params.zila
      ? POSTCODE_INDEX.districtsById.get(pick.params.zila)
      : undefined;
    writeUrlParams({
      division: pick.params.division ?? dist?.divisionId ?? "",
      zila: pick.params.zila ?? "",
      upazila: pick.params.upazila ?? "",
      q: pick.params.q ?? "",
    });
  };

  const handleReset = () => {
    setSavedOnly(false);
    setBrowseAllPostcodes(false);
    setZilaSearch("");
    setZilaOpen(false);
    setVisibleLimit(PAGE_STEP);
    writeUrlParams({});
  };

  const handleExportCsv = () => {
    if (matchingPostcodes.length === 0) return;
    const csv = buildPostcodesCsv(matchingPostcodes);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const suffix = filters.upazilaEn
      ? `${filters.districtId}-${filters.upazilaEn.toLowerCase().replace(/\s+/g, "-")}`
      : filters.districtId || filters.divisionId || "bangladesh";
    a.href = url;
    a.download = `postcodes-${suffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareLink = () => {
    if (typeof window === "undefined") return;
    void copyText(window.location.href, "share");
  };

  const divisionDistrictsCount = (divId: string) =>
    POSTCODE_INDEX.districts.filter((d) => d.divisionId === divId).length;

  return (
    <div className="space-y-6">
      {/* ── Main Search & Cascading Selector Card ── */}
      <section className={`${cardClass} p-5 sm:p-6 print:hidden`}>
        {/* Row 1: Universal Instant Search & Reverse Lookup */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={searchInputId}
              className="text-sm font-semibold text-slate-900 dark:text-white"
            >
              {t(
                "Instant search or 4-digit reverse postcode lookup",
                "যেকোনো পোস্ট কোড (৪ অঙ্ক), ডাকঘর, উপজেলা বা জেলা খুঁজুন"
              )}
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t(
                "Supports English, বাংলা & old spellings (Chittagong, Comilla, Jessore)",
                "ইংরেজি, বাংলা ও ১২১২ — সবভাবেই খোঁজা যাবে"
              )}
            </span>
          </div>

          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              inputMode="search"
              value={filters.query}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                "Type postcode (e.g. 1212, 4000, ৯০০০), post office, upazila, or zila…",
                "পোস্ট কোড (যেমন ১২১২, ৪০০০, 9000), ডাকঘর, উপজেলা বা জেলার নাম লিখুন…"
              )}
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-11 pr-11 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t("Clear search", "সার্চ মুছুন")}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Popular Quick-Pick Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("Quick picks:", "জনপ্রিয়:")}
            </span>
            {POPULAR_PICKS.map((pick) => {
              const active =
                (pick.params.q && filters.query === pick.params.q) ||
                (!pick.params.q &&
                  pick.params.zila === filters.districtId &&
                  (pick.params.upazila ?? "") === filters.upazilaEn &&
                  !filters.query);
              return (
                <button
                  key={pick.labelEn}
                  type="button"
                  onClick={() => applyQuickPick(pick)}
                  className={`inline-flex min-h-[32px] items-center rounded-full border px-3 text-xs font-medium transition-colors ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
                  }`}
                >
                  {isBn ? pick.labelBn : pick.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-slate-100 dark:border-slate-800" />

        {/* Row 2: Step-by-Step Cascading Selector — Step 1: Zila -> Step 2: Upazila / Thana */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Step 1: Searchable Zila (District) Combobox */}
          <div ref={zilaComboRef} className="relative">
            <label
              htmlFor={zilaComboId}
              className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                {isBn ? "১" : "1"}
              </span>
              {t("Select Zila (District)", "জেলা (Zila) নির্বাচন করুন")}
              <span className="ml-auto text-xs font-normal tabular-nums text-slate-500 dark:text-slate-400">
                {t("64 Districts", "৬৪টি জেলা")}
              </span>
            </label>

            <div className="relative mt-2">
              <MapPin
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <input
                id={zilaComboId}
                type="text"
                role="combobox"
                aria-expanded={zilaOpen}
                aria-controls={zilaListId}
                aria-autocomplete="list"
                autoComplete="off"
                value={
                  zilaOpen
                    ? zilaSearch
                    : selectedDistrict
                      ? isBn
                        ? `${selectedDistrict.nameBn} (${selectedDistrict.nameEn})`
                        : `${selectedDistrict.nameEn} (${selectedDistrict.nameBn})`
                      : ""
                }
                onFocus={() => {
                  setZilaOpen(true);
                  setZilaSearch("");
                  setZilaHighlightIdx(0);
                }}
                onChange={(e) => {
                  setZilaOpen(true);
                  setZilaSearch(e.target.value);
                  setZilaHighlightIdx(0);
                }}
                onKeyDown={(e) => {
                  if (!zilaOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
                    setZilaOpen(true);
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setZilaHighlightIdx((idx) =>
                      Math.min(idx + 1, Math.max(0, filteredZilaOptions.length - 1))
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setZilaHighlightIdx((idx) => Math.max(0, idx - 1));
                  } else if (e.key === "Enter" && filteredZilaOptions[zilaHighlightIdx]) {
                    e.preventDefault();
                    selectZila(filteredZilaOptions[zilaHighlightIdx].id);
                  } else if (e.key === "Escape") {
                    setZilaOpen(false);
                    setZilaSearch("");
                  }
                }}
                placeholder={t(
                  "Search or choose a Zila (e.g. Dhaka, Khulna, Sylhet)…",
                  "জেলা খুঁজুন বা বাছাই করুন (যেমন ঢাকা, খুলনা, সিলেট)…"
                )}
                className={`h-12 w-full rounded-xl border pl-10 pr-16 text-[15px] font-medium transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:bg-slate-950 dark:text-white ${
                  selectedDistrict
                    ? "border-emerald-500/70 bg-emerald-50/30 text-slate-900 dark:border-emerald-500/50 dark:bg-emerald-950/20"
                    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700"
                }`}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                {selectedDistrict && (
                  <button
                    type="button"
                    onClick={() => selectZila("")}
                    aria-label={t("Clear Zila", "জেলা মুছুন")}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setZilaOpen((o) => !o);
                    setZilaSearch("");
                  }}
                  aria-label={t("Toggle Zila list", "জেলার তালিকা খুলুন")}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${zilaOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            {zilaOpen && (
              <ul
                id={zilaListId}
                role="listbox"
                className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                {filteredZilaOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-sm text-slate-500">
                    {t("No matching Zila found", "কোনো জেলা পাওয়া যায়নি")}
                  </li>
                ) : (
                  filteredZilaOptions.map((dist, idx) => {
                    const isSelected = dist.id === filters.districtId;
                    const isHighlighted = idx === zilaHighlightIdx;
                    return (
                      <li key={dist.id} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onMouseEnter={() => setZilaHighlightIdx(idx)}
                          onClick={() => selectZila(dist.id)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : isHighlighted
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                                : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-semibold">
                              {isBn ? dist.nameBn : dist.nameEn}
                            </span>
                            <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">
                              {isBn ? dist.nameEn : dist.nameBn}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {isBn ? dist.divisionBn : dist.divisionEn}
                            </span>
                            <span>{num(dist.postcodeCount)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>

          {/* Step 2: Dynamic Upazila / Thana Selector */}
          <div>
            <label
              htmlFor={upazilaSelectId}
              className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
                  selectedDistrict
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {isBn ? "২" : "2"}
              </span>
              {t("Filter by Upazila / Thana", "উপজেলা / থানা বাছাই করুন")}
              {selectedDistrict && (
                <span className="ml-auto text-xs font-normal tabular-nums text-emerald-700 dark:text-emerald-400">
                  {num(upazilas.length)} {t("upazilas / thanas", "টি উপজেলা / থানা")}
                </span>
              )}
            </label>

            <div className="relative mt-2">
              <Building2
                className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
                  selectedDistrict
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                }`}
                aria-hidden="true"
              />
              <select
                id={upazilaSelectId}
                disabled={!selectedDistrict}
                value={filters.upazilaEn}
                onChange={(e) => selectUpazila(e.target.value)}
                className={`h-12 w-full appearance-none rounded-xl border pl-10 pr-10 text-[15px] font-medium transition-colors focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 ${
                  selectedDistrict
                    ? "cursor-pointer border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    : "cursor-not-allowed border-slate-200 bg-slate-100/80 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500"
                }`}
              >
                {!selectedDistrict ? (
                  <option value="">
                    {t(
                      "First choose a Zila to unlock Upazilas…",
                      "উপজেলা দেখতে প্রথমে একটি জেলা নির্বাচন করুন…"
                    )}
                  </option>
                ) : (
                  <>
                    <option value="">
                      {t(
                        `All Upazilas in ${selectedDistrict.nameEn} (${selectedDistrict.postcodeCount} postcodes)`,
                        `${selectedDistrict.nameBn}-এর সব উপজেলা (${num(selectedDistrict.postcodeCount)}টি পোস্ট কোড)`
                      )}
                    </option>
                    {upazilas.map((u) => (
                      <option key={u.upazilaEn} value={u.upazilaEn}>
                        {isBn
                          ? `${u.upazilaBn} (${u.upazilaEn}) — ${num(u.count)}টি`
                          : `${u.upazilaEn} (${u.upazilaBn}) — ${u.count}`}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Row 3: 8-Division Filter Strip */}
        <div className="mt-5">
          <div
            role="tablist"
            aria-label={t("Filter by Division", "বিভাগ অনুযায়ী দেখুন")}
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!filters.divisionId && !savedOnly}
              onClick={() => selectDivision("")}
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                !filters.divisionId && !savedOnly
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {t("All Divisions", "সব বিভাগ")}
              <span className="tabular-nums opacity-65">{num(64)}</span>
            </button>

            {POSTCODE_INDEX.divisions.map((div) => {
              const isActive = filters.divisionId === div.id && !savedOnly;
              return (
                <button
                  key={div.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectDivision(div.id)}
                  className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-200"
                  }`}
                >
                  {isBn ? div.nameBn : div.nameEn}
                  <span className="tabular-nums opacity-70">
                    {num(divisionDistrictsCount(div.id))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Exact 4-Digit Reverse Lookup Spotlight Card ── */}
      {exactLookup && (
        <section
          aria-label={t("Exact postcode match", "সঠিক পোস্ট কোডের তথ্য")}
          className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-950/20 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">
                  {t("Postcode", "পোস্ট কোড")}
                </span>
                <span className="mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">
                  {fmtCode(exactLookup.match.code)}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Compass className="h-3 w-3" aria-hidden="true" />
                    {exactLookup.zone.prefix} ·{" "}
                    {isBn ? exactLookup.zone.regionBn : exactLookup.zone.regionEn}
                  </span>
                </div>
                <h2 className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">
                  {isBn
                    ? exactLookup.match.postOfficeBn
                    : exactLookup.match.postOfficeEn}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {isBn
                    ? exactLookup.match.postOfficeEn
                    : exactLookup.match.postOfficeBn}
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {t("Upazila/Thana:", "উপজেলা/থানা:")}
                  </strong>{" "}
                  {isBn
                    ? `${exactLookup.match.upazilaBn} (${exactLookup.match.upazilaEn})`
                    : `${exactLookup.match.upazilaEn} (${exactLookup.match.upazilaBn})`}
                  {" · "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {t("Zila:", "জেলা:")}
                  </strong>{" "}
                  {isBn
                    ? exactLookup.match.districtBn
                    : exactLookup.match.districtEn}
                  {" · "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {t("Division:", "বিভাগ:")}
                  </strong>{" "}
                  {isBn
                    ? exactLookup.match.divisionBn
                    : exactLookup.match.divisionEn}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={() =>
                  void copyText(
                    fmtCode(exactLookup.match.code),
                    `spot-code-${exactLookup.match.code}`
                  )
                }
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                {copiedKey === `spot-code-${exactLookup.match.code}` ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copiedKey === `spot-code-${exactLookup.match.code}`
                  ? t("Copied!", "কপি হয়েছে!")
                  : t("Copy code", "কোড কপি")}
              </button>
              <button
                type="button"
                onClick={() =>
                  void copyText(
                    formatPostalAddress(exactLookup.match, locale),
                    `spot-addr-${exactLookup.match.code}`
                  )
                }
                className={ghostBtn}
              >
                {copiedKey === `spot-addr-${exactLookup.match.code}` ? (
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copiedKey === `spot-addr-${exactLookup.match.code}`
                  ? t("Address copied", "ঠিকানা কপি")
                  : t("Copy address", "ঠিকানা কপি")}
              </button>
              <button
                type="button"
                onClick={() => selectZila(exactLookup.match.districtId)}
                className={ghostBtn}
              >
                {t(
                  `All in ${exactLookup.match.districtEn}`,
                  `${exactLookup.match.districtBn}-এর সব কোড`
                )}
              </button>
            </div>
          </div>

          {exactLookup.siblings.length > 0 && (
            <div className="mt-4 border-t border-emerald-200/70 pt-3 dark:border-emerald-500/20">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                {t(
                  `Other postcodes in ${exactLookup.match.upazilaEn} Upazila:`,
                  `${exactLookup.match.upazilaBn} উপজেলার অন্যান্য পোস্ট কোড:`
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {exactLookup.siblings.map((sib) => (
                  <button
                    key={sib.code}
                    type="button"
                    onClick={() => setSearchQuery(sib.code)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-800 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400/60 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
                  >
                    <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {fmtCode(sib.code)}
                    </span>
                    <span>{isBn ? sib.postOfficeBn : sib.postOfficeEn}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Results Header & Action Toolbar ── */}
      <div ref={resultsRef} className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {showDistrictExplorer ? (
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                {filters.divisionId
                  ? t(
                      `${POSTCODE_INDEX.divisionsById.get(filters.divisionId)?.nameEn} Division — Pick a Zila (${availableDistricts.length} Districts)`,
                      `${POSTCODE_INDEX.divisionsById.get(filters.divisionId)?.nameBn} বিভাগ — একটি জেলা বাছাই করুন (${num(availableDistricts.length)}টি জেলা)`
                    )
                  : t(
                      "Browse All 64 Zilas (Click any Zila to see its Upazilas & Postcodes)",
                      "বাংলাদেশের ৬৪ জেলা (উপজেলা ও পোস্ট কোড দেখতে যেকোনো জেলায় ক্লিক করুন)"
                    )}
              </h2>
            ) : (
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                  {savedOnly
                    ? t("Saved Postcodes", "সংরক্ষিত পোস্ট কোড")
                    : selectedDistrict
                      ? filters.upazilaEn
                        ? `${isBn ? selectedDistrict.nameBn : selectedDistrict.nameEn} → ${
                            isBn
                              ? upazilas.find((u) => u.upazilaEn === filters.upazilaEn)?.upazilaBn ??
                                filters.upazilaEn
                              : filters.upazilaEn
                          }`
                        : t(
                            `All Postcodes in ${selectedDistrict.nameEn} Zila`,
                            `${selectedDistrict.nameBn} জেলার সব পোস্ট কোড`
                          )
                      : filters.query.trim()
                        ? t(
                            `Search results for "${filters.query.trim()}"`,
                            `"${filters.query.trim()}"-এর ফলাফল`
                          )
                        : t("All Bangladesh Postcodes", "বাংলাদেশের সব পোস্ট কোড")}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {t(
                    `Showing ${matchingPostcodes.length} ${matchingPostcodes.length === 1 ? "postcode" : "postcodes"}`,
                    `মোট ${num(matchingPostcodes.length)}টি পোস্ট কোড পাওয়া গেছে`
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Saved toggle */}
            <button
              type="button"
              onClick={() => {
                setSavedOnly((prev) => !prev);
                setVisibleLimit(PAGE_STEP);
              }}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-colors ${
                savedOnly
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
              }`}
            >
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              {t("Saved", "সংরক্ষিত")}
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums dark:bg-white/10">
                {num(savedCodes.size)}
              </span>
            </button>

            {showDistrictExplorer ? (
              <button
                type="button"
                onClick={() => setBrowseAllPostcodes(true)}
                className={ghostBtn}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                {t(
                  `View all ${POSTCODE_INDEX.entries.length} postcodes`,
                  `সব ${num(POSTCODE_INDEX.entries.length)}টি পোস্ট কোড`
                )}
              </button>
            ) : (
              <>
                {/* Cards / Table switcher */}
                <div
                  role="group"
                  aria-label={t("Display mode", "দেখার ধরন")}
                  className="inline-flex h-10 rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    aria-pressed={viewMode === "cards"}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                      viewMode === "cards"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{t("Cards", "কার্ড")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    aria-pressed={viewMode === "table"}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                      viewMode === "table"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{t("Table", "টেবিল")}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className={ghostBtn}
                  title={t("Copy shareable link", "লিংক কপি করুন")}
                >
                  {copiedKey === "share" ? (
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {copiedKey === "share" ? t("Link copied", "লিংক কপি") : t("Share", "শেয়ার")}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={matchingPostcodes.length === 0}
                  className={`${ghostBtn} disabled:opacity-40`}
                  title={t("Download filtered postcodes as CSV", "সিএসভি ডাউনলোড করুন")}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className={ghostBtn}
                  title={t("Print list", "প্রিন্ট করুন")}
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">{t("Print", "প্রিন্ট")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className={ghostBtn}
                  title={t("Reset filters", "রিসেট করুন")}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>{t("Reset", "রিসেট")}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Upazila Quick-Filter Chips (whenever a Zila is chosen!) ── */}
        {selectedDistrict && upazilas.length > 0 && !savedOnly && (
          <div className={`${cardClass} p-4 print:hidden`}>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t(
                  `Upazilas / Thanas in ${selectedDistrict.nameEn} (${upazilas.length})`,
                  `${selectedDistrict.nameBn}-এর উপজেলা / থানা (${num(upazilas.length)}টি)`
                )}
              </span>
              {filters.upazilaEn && (
                <button
                  type="button"
                  onClick={() => selectUpazila("")}
                  className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {t("Show all in Zila", "জেলার সব দেখুন")}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => selectUpazila("")}
                className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                  !filters.upazilaEn
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-200"
                }`}
              >
                {t("All Upazilas", "সব উপজেলা")}
                <span className="tabular-nums opacity-75">
                  {num(selectedDistrict.postcodeCount)}
                </span>
              </button>
              {upazilas.map((upa) => {
                const active = filters.upazilaEn === upa.upazilaEn;
                return (
                  <button
                    key={upa.upazilaEn}
                    type="button"
                    onClick={() => selectUpazila(active ? "" : upa.upazilaEn)}
                    className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-200"
                    }`}
                  >
                    <span>{isBn ? upa.upazilaBn : upa.upazilaEn}</span>
                    <span className="tabular-nums opacity-65">
                      {num(upa.count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Mode A: 64-District Interactive Directory ── */}
        {showDistrictExplorer ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {availableDistricts.map((dist) => (
              <button
                key={dist.id}
                type="button"
                onClick={() => selectZila(dist.id, true)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-slate-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
                      {isBn ? dist.nameBn : dist.nameEn}
                    </h3>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {isBn ? dist.nameEn : dist.nameBn}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                    {fmtCode(dist.headCode)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>{isBn ? dist.divisionBn : dist.divisionEn}</span>
                  <span className="tabular-nums">
                    {num(dist.upazilaCount)} {t("upazilas", "উপজেলা")} ·{" "}
                    <strong className="font-semibold text-slate-700 dark:text-slate-200">
                      {num(dist.postcodeCount)}
                    </strong>{" "}
                    {t("codes", "কোড")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : matchingPostcodes.length === 0 ? (
          /* Empty State */
          <div className={`${cardClass} p-10 text-center`}>
            <MapPin
              className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              {savedOnly
                ? t("No saved postcodes yet", "এখনো কোনো পোস্ট কোড সংরক্ষণ করা হয়নি")
                : t("No matching postcodes found", "কোনো পোস্ট কোড পাওয়া যায়নি")}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {savedOnly
                ? t(
                    "Click the bookmark icon on any postcode card to save it here for instant access.",
                    "দ্রুত ব্যবহারের জন্য যেকোনো পোস্ট কোডের বুকমার্ক আইকনে ক্লিক করে সংরক্ষণ করুন।"
                  )
                : t(
                    "Try clearing your Upazila filter, checking the spelling, or searching by 4-digit code or District name.",
                    "বানান যাচাই করুন, উপজেলা ফিল্টার মুছুন অথবা ৪-অঙ্কের কোড বা জেলার নাম দিয়ে খুঁজুন।"
                  )}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("Reset all filters", "সব ফিল্টার রিসেট করুন")}
            </button>
          </div>
        ) : viewMode === "cards" ? (
          /* ── Mode B1: Modern Card Grid ── */
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePostcodes.map((entry) => (
              <PostcodeCard
                key={entry.code}
                entry={entry}
                isBn={isBn}
                fmtCode={fmtCode}
                isSaved={savedCodes.has(entry.code)}
                copiedKey={copiedKey}
                onCopyCode={() =>
                  void copyText(fmtCode(entry.code), `code-${entry.code}`)
                }
                onCopyAddress={() =>
                  void copyText(
                    formatPostalAddress(entry, locale),
                    `addr-${entry.code}`
                  )
                }
                onToggleSave={() => toggleSaved(entry.code)}
                onSelectUpazila={() => {
                  writeUrlParams({
                    division: entry.divisionId,
                    zila: entry.districtId,
                    upazila: entry.upazilaEn,
                    q: "",
                  });
                  setSavedOnly(false);
                }}
                onSelectZila={() => selectZila(entry.districtId)}
              />
            ))}
          </div>
        ) : (
          /* ── Mode B2: Compact Scannable Table ── */
          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <th className="px-4 py-3">{t("Postcode", "পোস্ট কোড")}</th>
                    <th className="px-4 py-3">{t("Post Office", "ডাকঘর")}</th>
                    <th className="px-4 py-3">{t("Upazila / Thana", "উপজেলা / থানা")}</th>
                    <th className="px-4 py-3">{t("Zila", "জেলা")}</th>
                    <th className="px-4 py-3">{t("Division", "বিভাগ")}</th>
                    <th className="px-4 py-3 text-right print:hidden">
                      {t("Actions", "অ্যাকশন")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visiblePostcodes.map((entry) => {
                    const isSaved = savedCodes.has(entry.code);
                    const codeCopied = copiedKey === `code-${entry.code}`;
                    const addrCopied = copiedKey === `addr-${entry.code}`;
                    return (
                      <tr
                        key={entry.code}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              void copyText(fmtCode(entry.code), `code-${entry.code}`)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-800 ring-1 ring-inset ring-emerald-600/15 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                            title={t("Click to copy postcode", "কোড কপি করতে ক্লিক করুন")}
                          >
                            {fmtCode(entry.code)}
                            {codeCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-55" aria-hidden="true" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {isBn ? entry.postOfficeBn : entry.postOfficeEn}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {isBn ? entry.postOfficeEn : entry.postOfficeBn}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {isBn ? entry.upazilaBn : entry.upazilaEn}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          <button
                            type="button"
                            onClick={() => selectZila(entry.districtId)}
                            className="hover:text-emerald-700 hover:underline dark:hover:text-emerald-400"
                          >
                            {isBn ? entry.districtBn : entry.districtEn}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {isBn ? entry.divisionBn : entry.divisionEn}
                        </td>
                        <td className="px-4 py-3 text-right print:hidden">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                void copyText(
                                  formatPostalAddress(entry, locale),
                                  `addr-${entry.code}`
                                )
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              {addrCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              {addrCopied ? t("Copied", "কপি") : t("Address", "ঠিকানা")}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSaved(entry.code)}
                              aria-label={
                                isSaved
                                  ? t("Remove bookmark", "সংরক্ষণ মুছুন")
                                  : t("Save postcode", "সংরক্ষণ করুন")
                              }
                              className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
                                isSaved
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                                  : "border-slate-200 text-slate-400 hover:text-slate-700 dark:border-slate-700 dark:hover:text-slate-200"
                              }`}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Bookmark className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Load More Pagination */}
        {!showDistrictExplorer && matchingPostcodes.length > visibleLimit && (
          <div className="flex justify-center pt-2 print:hidden">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + PAGE_STEP)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
            >
              {t(
                `Show more (${matchingPostcodes.length - visibleLimit} remaining)`,
                `আরও দেখুন (বাকি ${num(matchingPostcodes.length - visibleLimit)}টি)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Individual Postcode Result Card ──────────────────────────────────────────

interface PostcodeCardProps {
  entry: EnrichedPostcode;
  isBn: boolean;
  fmtCode: (code: string) => string;
  isSaved: boolean;
  copiedKey: string | null;
  onCopyCode: () => void;
  onCopyAddress: () => void;
  onToggleSave: () => void;
  onSelectUpazila: () => void;
  onSelectZila: () => void;
}

function PostcodeCard({
  entry,
  isBn,
  fmtCode,
  isSaved,
  copiedKey,
  onCopyCode,
  onCopyAddress,
  onToggleSave,
  onSelectUpazila,
  onSelectZila,
}: PostcodeCardProps) {
  const codeCopied = copiedKey === `code-${entry.code}`;
  const addrCopied = copiedKey === `addr-${entry.code}`;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
              {isBn ? entry.postOfficeBn : entry.postOfficeEn}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isBn ? entry.postOfficeEn : entry.postOfficeBn}
            </p>
          </div>

          <button
            type="button"
            onClick={onCopyCode}
            title={isBn ? "পোস্ট কোড কপি করুন" : "Click to copy postcode"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-base font-extrabold tabular-nums transition-colors ${
              codeCopied
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25 dark:hover:bg-emerald-500/25"
            }`}
          >
            <span>{fmtCode(entry.code)}</span>
            {codeCopied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Location Breadcrumb Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={onSelectUpazila}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
          >
            <Building2 className="h-3 w-3 opacity-65" aria-hidden="true" />
            {isBn ? entry.upazilaBn : entry.upazilaEn}
          </button>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <button
            type="button"
            onClick={onSelectZila}
            className="font-medium text-slate-600 hover:text-emerald-700 hover:underline dark:text-slate-300 dark:hover:text-emerald-400"
          >
            {isBn ? entry.districtBn : entry.districtEn}
          </button>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            {isBn ? entry.divisionBn : entry.divisionEn}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 print:hidden dark:border-slate-800">
        <button
          type="button"
          onClick={onCopyAddress}
          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {addrCopied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {addrCopied
            ? isBn
              ? "ঠিকানা কপি হয়েছে"
              : "Address copied"
            : isBn
              ? "পূর্ণ ঠিকানা কপি"
              : "Copy full address"}
        </button>

        <button
          type="button"
          onClick={onToggleSave}
          aria-label={
            isSaved
              ? isBn
                ? "সংরক্ষণ মুছুন"
                : "Remove from saved"
              : isBn
                ? "পোস্ট কোড সংরক্ষণ করুন"
                : "Save postcode"
          }
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
            isSaved
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:hover:text-slate-200"
          }`}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Bookmark className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}

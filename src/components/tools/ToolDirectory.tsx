"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  type ToolCategory,
  type ToolDefinition,
} from "@/config/tools";
import { useLanguage } from "@/i18n/LanguageContext";
import { ToolCard } from "./ToolCard";

interface ToolDirectoryProps {
  tools: ToolDefinition[];
}

export function ToolDirectory({ tools }: ToolDirectoryProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory | "all">("all");

  const q = query.trim().toLowerCase();

  const matchesQuery = (tool: ToolDefinition) =>
    q === "" ||
    tool.titleEn.toLowerCase().includes(q) ||
    tool.titleBn.includes(q) ||
    tool.shortDescEn.toLowerCase().includes(q) ||
    tool.keywords.some((k) => k.toLowerCase().includes(q));

  const searched = tools.filter(matchesQuery);
  const filtered = searched.filter(
    (t) => category === "all" || t.category === category
  );

  const liveTools = filtered.filter((t) => t.status === "live");
  const plannedTools = filtered.filter((t) => t.status === "planned");

  const countFor = (c: ToolCategory | "all") =>
    c === "all"
      ? searched.length
      : searched.filter((t) => t.category === c).length;

  const chipBase =
    "inline-flex min-h-[38px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";
  const chipActive =
    "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900";
  const chipIdle =
    "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700";

  return (
    <div>
      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isBn
              ? "টুল খুঁজুন… যেমন: সঞ্চয়পত্র, ইএমআই, ভ্যাট, বয়স, বিএমআই"
              : "Search tools… e.g. sanchayapatra, emi, vat, age, bmi"
          }
          aria-label={isBn ? "টুল খুঁজুন" : "Search tools"}
          className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-[15px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={isBn ? "মুছুন" : "Clear search"}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div
        role="tablist"
        aria-label={isBn ? "ক্যাটাগরি" : "Categories"}
        className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={category === "all"}
          onClick={() => setCategory("all")}
          className={`${chipBase} ${category === "all" ? chipActive : chipIdle}`}
        >
          {isBn ? "সব টুলস" : "All tools"}
          <span className="tabular-nums opacity-60">{countFor("all")}</span>
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={`${chipBase} ${category === c ? chipActive : chipIdle}`}
          >
            <span className={`h-2 w-2 rounded-full ${CATEGORIES[c].dotClass}`} />
            {isBn ? CATEGORIES[c].labelBn : CATEGORIES[c].labelEn}
            <span className="tabular-nums opacity-60">{countFor(c)}</span>
          </button>
        ))}
      </div>

      {/* Live Tools Section (Always First & Clearly Separated) */}
      {liveTools.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {isBn ? "চালু টুলস" : "Live tools"}
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                {liveTools.length}
              </span>
            </h3>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((tool) => (
              <li key={tool.slug}>
                <ToolCard tool={tool} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coming Soon Section */}
      {plannedTools.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBn ? "শীঘ্রই আসছে" : "Coming soon"}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {plannedTools.length}
              </span>
            </h3>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plannedTools.map((tool) => (
              <li key={tool.slug}>
                <ToolCard tool={tool} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {liveTools.length === 0 && plannedTools.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-900 dark:text-white">
            {isBn ? "কোনো টুল পাওয়া যায়নি" : "No tools match your search"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {isBn ? "অন্য শব্দ দিয়ে চেষ্টা করুন।" : "Try a different keyword or category."}
          </p>
        </div>
      )}
    </div>
  );
}

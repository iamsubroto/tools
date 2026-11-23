import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, type ToolDefinition } from "@/config/tools";
import { ToolIcon } from "./ToolIcon";

interface ToolCardProps {
  tool: ToolDefinition;
  locale?: "en" | "bn";
}

export function ToolCard({ tool, locale = "en" }: ToolCardProps) {
  const isBn = locale === "bn";
  const isLive = tool.status === "live";
  const category = CATEGORIES[tool.category];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <ToolIcon icon={tool.icon} category={tool.category} />
        {isLive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {isBn ? "চালু" : "Live"}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {isBn ? "শীঘ্রই আসছে" : "Coming soon"}
          </span>
        )}
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">
          {isBn ? tool.titleBn : tool.titleEn}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          {isBn ? tool.shortDescBn : tool.shortDescEn}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${category.dotClass}`} />
          {isBn ? category.labelBn : category.labelEn}
        </span>
        {isLive && (
          <ArrowUpRight
            className="h-4 w-4 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );

  if (!isLive) {
    return (
      <div
        aria-disabled="true"
        className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 opacity-75 dark:border-slate-800 dark:bg-slate-900/40"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/${tool.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      {body}
    </Link>
  );
}

import Link from "next/link";
import { Calculator, Lock, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { CATEGORIES, CATEGORY_ORDER, TOOLS } from "@/config/tools";

export function Footer() {
  const liveTools = TOOLS.filter((t) => t.status === "live");

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white print:hidden dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Calculator className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className="text-[17px] font-bold tracking-tight">
                Tools<span className="text-emerald-600 dark:text-emerald-400">BD</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {siteConfig.tagline}. Every calculation runs in your browser —
              no signup, no data stored.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 dark:border-slate-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                Official rates
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 dark:border-slate-800">
                <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                100% private
              </span>
            </div>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Live tools
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {liveTools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/${t.slug}`}
                    className="text-slate-500 transition-colors hover:text-emerald-600 dark:text-slate-400"
                  >
                    {t.titleEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Categories
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
              {CATEGORY_ORDER.map((c) => (
                <li key={c} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${CATEGORIES[c].dotClass}`} />
                  {CATEGORIES[c].labelEn}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <strong className="font-semibold text-slate-700 dark:text-slate-300">Disclaimer:</strong>{" "}
            Rates are sourced from official Bangladesh authorities (NSD, NBR, BERC,
            Bangladesh Bank) and reviewed periodically. Results are estimates for
            planning — confirm final figures with your bank or National Savings
            office before investing.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            © 2026 {siteConfig.name}. Free public utility for Bangladesh &amp; NRBs.
          </p>
        </div>
      </div>
    </footer>
  );
}

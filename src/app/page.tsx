import Link from "next/link";
import { ArrowRight, BadgeCheck, Languages, Lock, Zap } from "lucide-react";
import { TOOLS } from "@/config/tools";
import { ToolDirectory } from "@/components/tools/ToolDirectory";

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Official Bangladesh rates",
    body: "Every rate is sourced from NSD, NBR, BERC or Bangladesh Bank and shows its last-updated date.",
  },
  {
    icon: Lock,
    title: "Private by design",
    body: "Calculations run entirely in your browser. No signup, no tracking of your numbers.",
  },
  {
    icon: Languages,
    title: "Bangla & English",
    body: "Switch languages anytime. Amounts use Lakh/Crore formatting with in-words display.",
  },
  {
    icon: Zap,
    title: "Fast on any phone",
    body: "Built for budget Android phones and slow connections — instant results as you type.",
  },
];

export default function HomePage() {
  const liveCount = TOOLS.filter((t) => t.status === "live").length;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Free · No signup · Updated for FY 2025-26
            </span>

            <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              Everyday calculators,{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                built for Bangladesh.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
              Savings certificates, tax, loans, bills, land and more — accurate
              results using official rates, in seconds.
            </p>
            <p className="mt-2 font-bangla text-[15px] text-slate-500 dark:text-slate-500">
              সঞ্চয়পত্র, আয়কর, লোন, বিদ্যুৎ বিল, জমি — সব হিসাব এক জায়গায়, বিনামূল্যে।
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#tools"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Browse all tools
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sanchayapatra-calculator"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Try Sanchayapatra Calculator
              </Link>
            </div>
          </div>

          <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-800">
            {[
              { k: `${TOOLS.length}`, v: "Tools planned" },
              { k: `${liveCount}`, v: "Live now" },
              { k: "2", v: "Languages" },
              { k: "0", v: "Data stored" },
            ].map((s) => (
              <div key={s.v} className="bg-white px-5 py-4 dark:bg-slate-900">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.v}</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {s.k}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Tool Directory */}
      <section id="tools" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                All tools
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Pick a calculator to get started. New tools are added every week.
              </p>
            </div>
          </div>
          <ToolDirectory tools={TOOLS} />
        </div>
      </section>

      {/* Trust Features */}
      <section className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Why people trust Tools BD
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <f.icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

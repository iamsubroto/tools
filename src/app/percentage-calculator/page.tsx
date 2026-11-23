import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { PercentageCalculatorClient } from "@/components/calculators/PercentageCalculatorClient";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { ToolCard } from "@/components/tools/ToolCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { AdSlot } from "@/components/monetization/AdSlot";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildWebApplicationSchema,
  type FaqItem,
} from "@/lib/schema";

const SLUG = "percentage-calculator";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "Percentage Calculator (Percent Of, Increase, Decrease & Change)",
  description:
    "Calculate X% of a number, what percent A is of B, percentage increase or decrease, and percentage change instantly in English and Bangla.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Percentage Calculator — Tools BD",
    description:
      "Fast all-in-one percentage calculator showing percent of, ratio, increase, decrease, and percentage change at once.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Percentage Calculator — Tools BD",
    description:
      "Calculate percent of, percentage increase/decrease, and percentage change instantly.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "How do I calculate X% of a number?",
    answerEn:
      "Multiply the base number by X and divide by 100. For example, 15% of 2,000 = (15 × 2,000) ÷ 100 = 300.",
    questionBn: "কোনো সংখ্যার কত শতাংশ কীভাবে বের করব?",
    answerBn:
      "মূল সংখ্যাকে শতাংশ দিয়ে গুণ করে ১০০ দিয়ে ভাগ করুন। যেমন ২,০০০-এর ১৫% = (১৫ × ২,০০০) ÷ ১০০ = ৩০০।",
  },
  {
    questionEn: "How do I find percentage increase or decrease between two numbers?",
    answerEn:
      "Subtract the old value from the new value, divide by the old value, and multiply by 100: ((New − Old) ÷ Old) × 100. A positive result is an increase; a negative result is a decrease.",
    questionBn: "দুটি সংখ্যার মধ্যে শতকরা বৃদ্ধি বা হ্রাস কীভাবে হিসাব করব?",
    answerBn:
      "নতুন মান থেকে পুরনো মান বিয়োগ করে পুরনো মান দিয়ে ভাগ করুন এবং ১০০ দিয়ে গুণ করুন: ((নতুন − পুরনো) ÷ পুরনো) × ১০০।",
  },
  {
    questionEn: "Why does a 20% drop require a 25% gain to recover?",
    answerEn:
      "Because percentages always apply to the current base. If ৳100 drops 20%, it becomes ৳80. Adding 20% of ৳80 only adds ৳16 (giving ৳96). You need 25% of ৳80 (৳20) to get back to ৳100.",
    questionBn: "২০% কমার পর আগের অবস্থানে ফিরতে কেন ২৫% বাড়াতে হয়?",
    answerBn:
      "১০০ টাকা ২০% কমে ৮০ টাকা হয়। ৮০ টাকার ২০% হলো মাত্র ১৬ টাকা (৯৬ টাকা)। আবার ১০০ টাকায় ফিরতে ৮০ টাকার ২৫% অর্থাৎ ২০ টাকা বাড়াতে হয়।",
  },
];

export default function PercentageCalculatorPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Percentage Calculator",
          description:
            "Calculate X% of a number, ratio percentage, percentage increase/decrease, and percentage change instantly.",
          slug: SLUG,
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={buildFaqSchema(FAQS)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Daily Utilities", path: "/#tools" },
          { name: tool.titleEn, path: `/${SLUG}` },
        ])}
      />

      <section className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="print:hidden">
            <ol className="flex flex-wrap items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Home</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
              <li>
                <Link href="/#tools" className="hover:text-slate-900 dark:hover:text-white">Daily Utilities</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
              <li aria-current="page" className="font-medium text-slate-900 dark:text-white">{tool.titleEn}</li>
            </ol>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                Percentage Calculator
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                শতাংশ ক্যালকুলেটর (শতকরা হার, বৃদ্ধি ও হ্রাস)
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              All 5 Percentage Modes Live
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PercentageCalculatorClient />

        <AdSlot slotId="percentage-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Percentage formulas
              </h2>
              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p>A% of B = (A × B) ÷ 100</p>
                <p>A is what % of B = (A ÷ B) × 100</p>
                <p>Increase = B × (1 + A ÷ 100)</p>
                <p>Decrease = B × (1 − A ÷ 100)</p>
                <p>% Change = ((New − Old) ÷ Old) × 100</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Everyday Bangladesh uses
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li className="border-l-2 border-emerald-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">Salary increment:</strong>{" "}
                  From ৳40,000 to ৳46,000 is a <strong className="text-slate-900 dark:text-white">+15%</strong> raise.
                </li>
                <li className="border-l-2 border-sky-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">Exam marks:</strong>{" "}
                  Scoring 680 out of 800 equals <strong className="text-slate-900 dark:text-white">85%</strong>.
                </li>
                <li className="border-l-2 border-amber-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">Commission / tips:</strong>{" "}
                  5% commission on ৳1,20,000 sales is <strong className="text-slate-900 dark:text-white">৳6,000</strong>.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Frequently asked questions
            </h2>
            <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {FAQS.map((faq) => (
                <details key={faq.questionEn} className="group">
                  <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 select-none hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <span>
                      <span className="block text-[15px] font-semibold text-slate-900 dark:text-white">
                        {faq.questionEn}
                      </span>
                      <span className="mt-0.5 block font-bangla text-[13px] text-slate-500">{faq.questionBn}</span>
                    </span>
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="space-y-2 px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    <p>{faq.answerEn}</p>
                    <p className="font-bangla text-slate-500">{faq.answerBn}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Related tools</h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.slug}><ToolCard tool={r} /></li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </>
  );
}

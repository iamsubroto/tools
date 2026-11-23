import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { SipCalculatorClient } from "@/components/calculators/SipCalculatorClient";
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

const SLUG = "sip-calculator";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "SIP & Compound Interest Calculator Bangladesh (Step-Up & Inflation)",
  description:
    "Project monthly SIP mutual fund and savings compounding in BDT with annual step-up growth, inflation-adjusted purchasing power, and yearly breakdown.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "SIP & Compound Interest Calculator Bangladesh",
    description:
      "Calculate how monthly SIP investments grow with compounding, step-up contributions, and inflation adjustment in BDT.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "SIP & Compound Interest Calculator Bangladesh",
    description:
      "Calculate monthly SIP compounding growth with step-up and inflation adjustment in BDT.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "What is a SIP and how does it work in Bangladesh?",
    answerEn:
      "A Systematic Investment Plan (SIP) lets you invest a fixed amount every month—such as ৳5,000—into open-end mutual funds, unit funds, or disciplined savings plans offered by asset managers in Bangladesh. Monthly compounding builds long-term wealth while averaging out market ups and downs.",
    questionBn: "এসআইপি (SIP) কী এবং বাংলাদেশে কীভাবে কাজ করে?",
    answerBn:
      "সিস্টেম্যাটিক ইনভেস্টমেন্ট প্ল্যান (SIP)-এ আপনি প্রতি মাসে নির্দিষ্ট পরিমাণ টাকা (যেমন ৫,০০০ টাকা) মিউচুয়াল ফান্ড বা সঞ্চয় পরিকল্পনায় জমা করেন। চক্রবৃদ্ধি মুনাফার মাধ্যমে দীর্ঘমেয়াদে বড় তহবিল গড়ে ওঠে।",
  },
  {
    questionEn: "How is SIP future value calculated?",
    answerEn:
      "Standard SIP calculations use the monthly annuity-due formula: FV = M × [((1 + i)^n − 1) ÷ i] × (1 + i), where M is the monthly deposit, i is the monthly rate of return (annual % ÷ 12 ÷ 100), and n is the total number of months.",
    questionBn: "এসআইপি-র ভবিষ্যৎ মূল্য কীভাবে হিসাব করা হয়?",
    answerBn:
      "মাসিক চক্রবৃদ্ধি সূত্রে FV = M × [((1 + i)^n − 1) ÷ i] × (1 + i) ব্যবহার করা হয়, যেখানে M মাসিক জমা, i মাসিক রিটার্নের হার এবং n মোট মাসের সংখ্যা।",
  },
  {
    questionEn: "Why should I check inflation-adjusted value?",
    answerEn:
      "Inflation reduces what Taka can buy in the future. If your SIP grows to ৳25 Lakh in 15 years while inflation averages 6%–8% in Bangladesh, the inflation-adjusted value shows what that corpus equals in today's purchasing power so you can set realistic goals.",
    questionBn: "মূল্যস্ফীতি সমন্বিত প্রকৃত মান দেখা কেন জরুরি?",
    answerBn:
      "মূল্যস্ফীতির কারণে ভবিষ্যতে টাকার ক্রয়ক্ষমতা কমে যায়। আজকের টাকার হিসেবে আপনার ভবিষ্যৎ তহবিলের প্রকৃত মান কত হবে তা জানলে সঠিক লক্ষ্য নির্ধারণ সহজ হয়।",
  },
  {
    questionEn: "What is an annual Step-Up SIP?",
    answerEn:
      "A Step-Up SIP increases your monthly deposit by a fixed percentage (for example 10%) each year as your salary grows. Even a modest 10% annual step-up can increase your final corpus by 40%–60% over 10–15 years.",
    questionBn: "বার্ষিক স্টেপ-আপ এসআইপি কী?",
    answerBn:
      "আয় বৃদ্ধির সাথে প্রতি বছর আপনার মাসিক জমা নির্দিষ্ট হারে (যেমন ১০%) বাড়ালে তাকে স্টেপ-আপ এসআইপি বলে। এতে ১০–১৫ বছরে চূড়ান্ত মূলধন অনেক বেশি বাড়ে।",
  },
];

export default function SipCalculatorPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "SIP & Compound Interest Calculator Bangladesh",
          description:
            "Project monthly SIP compounding growth in BDT with annual step-up and inflation adjustment.",
          slug: SLUG,
          applicationCategory: "FinanceApplication",
        })}
      />
      <JsonLd data={buildFaqSchema(FAQS)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Finance & Banking", path: "/#tools" },
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
                <Link href="/#tools" className="hover:text-slate-900 dark:hover:text-white">Finance &amp; Banking</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
              <li aria-current="page" className="font-medium text-slate-900 dark:text-white">{tool.titleEn}</li>
            </ol>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                SIP &amp; Compound Interest Calculator
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                এসআইপি ও চক্রবৃদ্ধি মুনাফা ক্যালকুলেটর
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Monthly Compounding · Step-Up &amp; Inflation
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SipCalculatorClient />

        <AdSlot slotId="sip-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                How SIP compounding works
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Each monthly deposit starts earning returns immediately, and those returns
                earn further returns every month. Time in the market has a far bigger impact
                than trying to time the market.
              </p>
              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p>i = Annual Return % ÷ 12 ÷ 100</p>
                <p>n = Years × 12</p>
                <p>FV = M × [((1+i)^n − 1) ÷ i] × (1+i)</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked Bangladesh examples
              </h2>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li className="border-l-2 border-emerald-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">৳5,000/month @ 12% for 10 years:</strong>{" "}
                  You invest ৳6,00,000 total, and your estimated corpus reaches{" "}
                  <strong className="text-slate-900 dark:text-white">৳11,61,695</strong> (৳5,61,695 in returns).
                </li>
                <li className="border-l-2 border-sky-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">Same ৳5,000/month for 20 years:</strong>{" "}
                  You invest ৳12,00,000, yet compounding grows it to nearly{" "}
                  <strong className="text-slate-900 dark:text-white">৳50 Lakh</strong> — showing why starting early matters most.
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

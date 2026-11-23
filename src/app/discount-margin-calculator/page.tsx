import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { DiscountMarginCalculatorClient } from "@/components/calculators/DiscountMarginCalculatorClient";
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

const SLUG = "discount-margin-calculator";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "Discount & F-Commerce Profit Margin Calculator Bangladesh",
  description:
    "Calculate final sale prices, stacked coupon discounts, and real Bangladesh F-commerce net profit margin after delivery, COD charge, and ad spend.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Discount & Profit Margin Calculator — Tools BD",
    description:
      "Instantly calculate sale savings, double discounts, and real F-commerce order profit margin in BDT.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Discount & Profit Margin Calculator Bangladesh",
    description:
      "Calculate sale price after discount, coupon stacking, and real SME/F-commerce net profit.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "How do stacked (double) discounts work in shopping sales?",
    answerEn:
      "When a store offers '20% off + an extra 10% coupon', the second discount applies to the already-reduced price, not the original price. On ৳1,000, 20% off gives ৳800, then 10% off ৳800 gives ৳720 — an effective 28% discount (not 30%).",
    questionBn: "ডাবল বা অতিরিক্ত কুপন ডিসকাউন্ট কীভাবে হিসাব হয়?",
    answerBn:
      "২০% ছাড়ের ওপর আরও ১০% কুপন থাকলে দ্বিতীয় ছাড় প্রথম ছাড়ের পরের দামের ওপর হিসাব হয়। ১,০০০ টাকায় ২০% ছাড়ে ৮০০ টাকা এবং তার ওপর ১০% ছাড়ে ৭২০ টাকা — অর্থাৎ প্রকৃত ছাড় ২৮%, ৩০% নয়।",
  },
  {
    questionEn: "What is the difference between Profit Margin and Markup?",
    answerEn:
      "Profit Margin is net profit divided by the Selling Price, while Markup is net profit divided by Total Cost. For example, buying at ৳800 and selling at ৳1,000 yields ৳200 profit — a 20% Profit Margin but a 25% Markup.",
    questionBn: "প্রফিট মার্জিন (Margin) ও মার্কআপ (Markup)-এর পার্থক্য কী?",
    answerBn:
      "মার্জিন হিসাব হয় বিক্রয়মূল্যের ওপর (লাভ ÷ বিক্রয়মূল্য) আর মার্কআপ হিসাব হয় খরচের ওপর (লাভ ÷ মোট খরচ)। ৮০০ টাকায় কিনে ১,০০০ টাকায় বিক্রি করলে লাভ ২০০ টাকা — মার্জিন ২০%, মার্কআপ ২৫%।",
  },
  {
    questionEn: "Why do Bangladesh F-commerce sellers miscalculate order profit?",
    answerEn:
      "Many small Facebook sellers subtract only product cost from selling price and forget 1% courier COD charges, packaging, inside/outside Dhaka delivery subsidies, and Facebook ad cost per order. Including all 4 reveals your true break-even selling price.",
    questionBn: "বাংলাদেশের এফ-কমার্স ব্যবসায়ীরা কেন অনেক সময় প্রকৃত লাভ ভুল হিসাব করেন?",
    answerBn:
      "শুধু ক্রয়মূল্য বাদ দিলে প্রকৃত লাভ বোঝা যায় না। কুরিয়ার সিওডি চার্জ (১%), প্যাকেজিং, ডেলিভারি ভর্তুকি এবং প্রতি অর্ডারের ফেসবুক বিজ্ঞাপন খরচ বাদ দিয়ে হিসাব করলেই আসল নিট লাভ পাওয়া যায়।",
  },
];

export default function DiscountMarginCalculatorPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Discount & Profit Margin Calculator Bangladesh",
          description:
            "Calculate final sale prices, stacked discounts, and Bangladesh F-commerce net order profit margin.",
          slug: SLUG,
          applicationCategory: "FinanceApplication",
        })}
      />
      <JsonLd data={buildFaqSchema(FAQS)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tax & Business", path: "/#tools" },
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
                <Link href="/#tools" className="hover:text-slate-900 dark:hover:text-white">Tax &amp; Business</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
              <li aria-current="page" className="font-medium text-slate-900 dark:text-white">{tool.titleEn}</li>
            </ol>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                Discount &amp; Profit Margin Calculator
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                ডিসকাউন্ট ও এফ-কমার্স লাভের মার্জিন ক্যালকুলেটর
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Stacked Coupons · F-Commerce COD &amp; Ad Margin
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DiscountMarginCalculatorClient />

        <AdSlot slotId="discount-margin-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Key formulas
              </h2>
              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p>Sale Price = Price × (1 − d1/100) × (1 − d2/100)</p>
                <p>Net Profit = Selling − (Cost + Delivery + COD + Ads)</p>
                <p>Margin % = (Net Profit ÷ Selling Price) × 100</p>
                <p>Markup % = (Net Profit ÷ Total Cost) × 100</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked examples
              </h2>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li className="border-l-2 border-emerald-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">Shopping — ৳2,500 item at 20% off:</strong>{" "}
                  You save ৳500 and pay <strong className="text-slate-900 dark:text-white">৳2,000</strong>.
                </li>
                <li className="border-l-2 border-indigo-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">F-Commerce — ৳1,500 order:</strong>{" "}
                  Cost ৳700 + delivery ৳120 + 1% COD (৳15) + Facebook ad ৳200 = ৳1,035 total cost →{" "}
                  <strong className="text-slate-900 dark:text-white">৳465 net profit (31% margin)</strong>.
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

import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, Lock } from "lucide-react";
import rawRates from "@/data/rates.json";
import { ratesSchema } from "@/data/rates.schema";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { EmiLoanCalculatorClient } from "@/components/calculators/EmiLoanCalculatorClient";
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
import { formatBDT } from "@/lib/formatters";

const SLUG = "emi-loan-calculator";
const loanConfig = ratesSchema.parse(rawRates).loanPresetsBd;
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "EMI & Bank Loan Calculator Bangladesh (Home, Car & Personal)",
  description:
    "Calculate monthly EMI, total interest, year-by-year repayment schedule, and extra prepayment savings for Bangladesh Home, Car, and Personal bank loans.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "EMI & Bank Loan Calculator Bangladesh — Home, Car & Personal Loan",
    description:
      "Instant reducing-balance EMI calculator in BDT Lakh/Crore with amortization table and extra prepayment interest-savings simulator.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "EMI & Bank Loan Calculator Bangladesh",
    description:
      "Calculate monthly loan EMI, total interest, and prepayment savings in BDT.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "How is bank loan EMI calculated in Bangladesh?",
    answerEn:
      "Bangladeshi commercial banks and NBFIs calculate Home, Car, and Personal loan EMIs using the reducing-balance formula: EMI = [P × r × (1+r)^n] ÷ [(1+r)^n − 1], where P is the loan principal, r is the monthly interest rate (annual rate ÷ 12 ÷ 100), and n is the total number of monthly instalments.",
    questionBn: "বাংলাদেশের ব্যাংক লোনের মাসিক কিস্তি (EMI) কীভাবে হিসাব করা হয়?",
    answerBn:
      "বাংলাদেশের ব্যাংক ও আর্থিক প্রতিষ্ঠানগুলো রিডিউসিং ব্যালেন্স সূত্রে মাসিক কিস্তি হিসাব করে: EMI = [P × r × (1+r)^n] ÷ [(1+r)^n − 1]। এখানে P মূল ঋণ, r মাসিক সুদের হার এবং n মোট কিস্তির সংখ্যা।",
  },
  {
    questionEn: "Does paying extra every month really reduce loan interest?",
    answerEn:
      "Yes. On a reducing-balance loan, every extra Taka paid toward principal lowers the remaining balance immediately, so future months charge interest on a smaller balance. Even adding 10% extra per month can cut months or years off a long-term home loan.",
    questionBn: "প্রতি মাসে অতিরিক্ত টাকা জমা দিলে কি আসলেই সুদ কমে?",
    answerBn:
      "হ্যাঁ। রিডিউসিং ব্যালেন্স লোনে আসলের বিপরীতে অতিরিক্ত পরিশোধ করলে বাকি ঋণ দ্রুত কমে এবং পরবর্তী মাসগুলোতে কম আসলের ওপর সুদ ধার্য হয়। এতে মোট সুদ ও মেয়াদ দুটিই কমে।",
  },
  {
    questionEn: "What are typical Home, Car, and Personal loan rates in Bangladesh?",
    answerEn:
      "Scheduled bank lending rates in Bangladesh vary by bank and market treasury yields, generally ranging around 11.5%–13.5% for Home and Car loans and 12.5%–14.5% for unsecured Personal loans. Always confirm the exact APR and processing fee with your bank.",
    questionBn: "বাংলাদেশে হোম, কার ও পার্সোনাল লোনের সুদের হার সাধারণত কত?",
    answerBn:
      "ব্যাংক ও বাজারভেদে বাংলাদেশে হোম ও কার লোনের সুদ সাধারণত ১১.৫%–১৩.৫% এবং পার্সোনাল লোনের সুদ ১২.৫%–১৪.৫% এর মধ্যে থাকে। চূড়ান্ত হারের জন্য সংশ্লিষ্ট ব্যাংকে যাচাই করুন।",
  },
  {
    questionEn: "Are there early settlement charges on Bangladesh bank loans?",
    answerEn:
      "Many banks in Bangladesh allow partial prepayment or early settlement subject to a small early-settlement fee (often 0.5%–2% of the prepaid amount) depending on the loan agreement and Bangladesh Bank circulars. Check your sanction letter before prepaying.",
    questionBn: "সময়ের আগে লোন পরিশোধ করলে কি কোনো চার্জ কাটে?",
    answerBn:
      "অনেক ব্যাংকে আংশিক বা সম্পূর্ণ আগাম পরিশোধে ০.৫%–২% পর্যন্ত আর্লি সেটেলমেন্ট ফি থাকতে পারে। অতিরিক্ত পরিশোধের আগে আপনার লোনের স্যাংশন লেটারের শর্ত দেখে নিন।",
  },
];

export default function EmiLoanCalculatorPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "EMI & Bank Loan Calculator Bangladesh",
          description:
            "Calculate monthly EMI, total interest, amortization schedule, and prepayment savings for Bangladesh bank loans.",
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
                EMI &amp; Bank Loan Calculator
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                ইএমআই ও ব্যাংক লোন ক্যালকুলেটর (হোম, কার ও পার্সোনাল লোন)
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Reducing-Balance Formula · BDT Lakh/Crore
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmiLoanCalculatorClient config={loanConfig} />

        <AdSlot slotId="emi-loan-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Typical Bangladesh bank loan presets
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              Use the reference benchmarks below to compare common loan sizes and tenures
              in Bangladesh before requesting a bank sanction letter.
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Loan Type</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Example Amount</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Reference Rate</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Typical Tenure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums dark:divide-slate-800">
                    {loanConfig.presets.map((p) => (
                      <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                        <th scope="row" className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                          {p.labelEn}
                          <span className="block font-bangla text-xs font-normal text-slate-500">{p.labelBn}</span>
                        </th>
                        <td className="px-3 py-3.5 text-right">{formatBDT(p.amount)}</td>
                        <td className="px-3 py-3.5 text-right font-semibold">{p.annualRate.toFixed(1)}%</td>
                        <td className="px-5 py-3.5 text-right">{p.tenureYears} years</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                How EMI is calculated
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Each monthly instalment pays off both interest on the remaining balance
                and a slice of the principal. In early years, interest makes up the
                larger share; in later years, most of your EMI reduces principal.
              </p>
              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p>r = Annual Rate ÷ 12 ÷ 100</p>
                <p>n = Tenure (Years) × 12</p>
                <p>EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1)</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked Bangladesh examples
              </h2>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li className="border-l-2 border-emerald-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">৳10,00,000 Personal/Auto Loan @ 11.5% for 5 yrs:</strong>{" "}
                  Monthly EMI is <strong className="text-slate-900 dark:text-white">৳21,993</strong>, total interest is ৳3,19,556, total payable ৳13,19,556.
                </li>
                <li className="border-l-2 border-amber-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">৳50,00,000 Home Loan @ 12% for 15 yrs:</strong>{" "}
                  Monthly EMI is <strong className="text-slate-900 dark:text-white">৳60,008</strong>. Adding just ৳6,000 extra per month cuts over 3 years off the loan and saves more than ৳14 Lakh in interest.
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

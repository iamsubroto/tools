import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, ExternalLink, Lock } from "lucide-react";
import rawRates from "@/data/rates.json";
import { ratesSchema } from "@/data/rates.schema";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { SanchayapatraCalculatorClient } from "@/components/calculators/SanchayapatraCalculatorClient";
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
import { formatBDT, formatPercent } from "@/lib/formatters";

const SLUG = "sanchayapatra-calculator";
const config = ratesSchema.parse(rawRates).sanchayapatra;
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "Sanchayapatra Calculator Bangladesh (All 4 Schemes & Tax)",
  description:
    "Calculate net monthly, 3-month and maturity profit after source tax for Paribar, Pensioner, 3-Month and 5-Year Sanchayapatra using the latest NSD rates.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Sanchayapatra Calculator Bangladesh — Compare All 4 Schemes",
    description:
      "Enter one amount and compare monthly, 3-month and maturity net profit after source tax across all 4 Bangladesh Sanchayapatra schemes.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Sanchayapatra Calculator Bangladesh (All 4 Schemes)",
    description:
      "Compare net monthly & 3-month payouts after source tax for Paribar, Pensioner, 3-Month & 5-Year Sanchayapatra.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "What are the current Sanchayapatra profit rates in Bangladesh?",
    answerEn:
      "For total investments up to ৳7.5 Lakh, maturity rates are 11.98% (Pensioner), 11.93% (Paribar), 11.83% (5-Year Bangladesh) and 11.82% (3-Month Profit-Bearing). Above ৳7.5 Lakh, rates are 11.80% for Pensioner, Paribar and 5-Year, and 11.77% for 3-Month.",
    questionBn: "বর্তমানে সঞ্চয়পত্রের মুনাফার হার কত?",
    answerBn:
      "মোট ৭.৫ লক্ষ টাকা পর্যন্ত বিনিয়োগে পেনশনার ১১.৯৮%, পরিবার ১১.৯৩%, ৫-বছর মেয়াদী ১১.৮৩% এবং ৩-মাসিক ১১.৮২%। ৭.৫ লক্ষের বেশি হলে হার ১১.৮০% (৩-মাসিকে ১১.৭৭%)।",
  },
  {
    questionEn: "How much source tax is deducted from Sanchayapatra profit?",
    answerEn:
      "If your total investment in savings certificates is up to ৳5 Lakh, source tax is 5% for Paribar, 3-Month and 5-Year schemes and 0% for Pensioner Sanchayapatra. Above ৳5 Lakh, 10% source tax applies to all four schemes.",
    questionBn: "সঞ্চয়পত্রের মুনাফা থেকে কত উৎস কর কাটা হয়?",
    answerBn:
      "মোট বিনিয়োগ ৫ লক্ষ টাকা পর্যন্ত হলে পেনশনারে ০% এবং অন্যগুলোতে ৫% উৎস কর। ৫ লক্ষের বেশি হলে সবগুলোতে ১০%।",
  },
  {
    questionEn: "How does the 3-Month Profit-Bearing Sanchayapatra pay?",
    answerEn:
      "It has a 3-year term and pays profit into your bank account every 3 months — four times a year. This calculator shows both the exact 3-month payment and the per-month equivalent so you can compare it fairly with monthly schemes.",
    questionBn: "৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্রে মুনাফা কীভাবে পাওয়া যায়?",
    answerBn:
      "মেয়াদ ৩ বছর; প্রতি ৩ মাস পরপর (বছরে ৪ বার) ব্যাংক অ্যাকাউন্টে মুনাফা জমা হয়। এখানে ৩ মাসের অঙ্ক ও মাসিক সমতুল্য দুটোই দেখানো হয়।",
  },
  {
    questionEn: "Which Sanchayapatra gives the highest monthly income?",
    answerEn:
      "Pensioner Sanchayapatra gives the highest net monthly income, but it is only for retired government and autonomous body employees. For most women and senior citizens, Paribar Sanchayapatra gives the highest monthly payout.",
    questionBn: "কোন সঞ্চয়পত্রে মাসে সবচেয়ে বেশি আয় হয়?",
    answerBn:
      "পেনশনার সঞ্চয়পত্রে সবচেয়ে বেশি, তবে এটি শুধু অবসরপ্রাপ্ত সরকারি কর্মচারীদের জন্য। সাধারণ নারী ও প্রবীণদের জন্য পরিবার সঞ্চয়পত্রে সর্বোচ্চ মাসিক মুনাফা।",
  },
  {
    questionEn: "What happens if I encash Sanchayapatra before maturity?",
    answerEn:
      "Profit is recalculated at the lower rate for the years completed (for example 9.81% after year 1 for Paribar), and any extra profit already paid is deducted from your principal.",
    questionBn: "মেয়াদের আগে সঞ্চয়পত্র ভাঙালে কী হয়?",
    answerBn:
      "পূর্ণ হওয়া বছরের কম হারে মুনাফা পুনঃহিসাব হয় এবং আগে বেশি মুনাফা নিয়ে থাকলে তা আসল থেকে কেটে নেওয়া হয়।",
  },
];

export default function SanchayapatraCalculatorPage() {
  const related = getRelatedTools(SLUG);
  const schemes = [
    config.schemes.pensioner,
    config.schemes.paribar,
    config.schemes.fiveYear,
    config.schemes.threeMonth,
  ];

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Sanchayapatra Calculator Bangladesh",
          description:
            "Compare net monthly, 3-month and maturity profit after source tax across Paribar, Pensioner, 3-Month and 5-Year Sanchayapatra.",
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

      {/* Page header */}
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
                Sanchayapatra Calculator
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                সঞ্চয়পত্র মুনাফা ক্যালকুলেটর
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            Enter one amount and see exactly how much you will receive — per month,
            every 3 months, or at maturity — after source tax, in all 4 Bangladesh
            savings certificates.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Rates verified · {config.lastUpdated}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
            <a
              href={config.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-1 font-medium text-slate-500 hover:text-emerald-700 dark:text-slate-400"
            >
              Source: {config.officialSource}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SanchayapatraCalculatorClient config={config} />

        <AdSlot slotId="sanchayapatra-mid" size="banner" />

        {/* Guide content */}
        <article className="mx-auto max-w-4xl space-y-12">
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Current Sanchayapatra rates &amp; source tax
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              The National Savings Directorate uses two profit slabs based on your{" "}
              <strong className="font-semibold text-slate-900 dark:text-white">total</strong> holdings:
              up to ৳7.5 Lakh and above ৳7.5 Lakh. Source tax under Section 105 of the
              Income Tax Act changes at ৳5 Lakh total investment.
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-[13px]">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Scheme</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Payout</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">≤ ৳7.5L</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">&gt; ৳7.5L</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Tax ≤5L / &gt;5L</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Max (single)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {schemes.map((s) => (
                      <tr key={s.id} className="text-slate-700 dark:text-slate-300">
                        <th scope="row" className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                          {s.nameEn}
                          <span className="block font-bangla text-xs font-normal text-slate-500">{s.nameBn}</span>
                        </th>
                        <td className="px-3 py-3.5">
                          {s.termYears} yrs ·{" "}
                          {s.payoutFrequency === "monthly"
                            ? "Monthly"
                            : s.payoutFrequency === "quarterly"
                              ? "3-monthly"
                              : "Maturity"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatPercent(s.tier1.maturityRate)}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums">{formatPercent(s.tier2.maturityRate)}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">
                          {formatPercent(s.taxRateUpToCutoff, { decimals: 0 })} / {formatPercent(s.taxRateAboveCutoff, { decimals: 0 })}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">{formatBDT(s.maxSingleLimit)}</td>
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
                How the calculation works
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Sanchayapatra pays simple profit at the rate locked on your purchase date.
              </p>
              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p>Yearly profit = Amount × Rate</p>
                <p>Source tax = Yearly profit × Tax rate</p>
                <p>Per month = (Profit − Tax) ÷ 12</p>
                <p>Every 3 months = (Profit − Tax) ÷ 4</p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                The ৳5 Lakh tax limit and ৳7.5 Lakh rate slab apply to your{" "}
                <em>combined</em> holdings across all certificates — turn on
                &ldquo;I already own Sanchayapatra&rdquo; for an exact result.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked examples
              </h2>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li className="border-l-2 border-emerald-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">৳5,00,000 in Paribar:</strong> 11.93%
                  with 5% tax → ৳59,650 profit − ৳2,983 tax = <strong className="text-slate-900 dark:text-white">৳4,722/month</strong>.
                </li>
                <li className="border-l-2 border-sky-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">৳5,00,000 in 3-Month:</strong> 11.82%
                  with 5% tax → <strong className="text-slate-900 dark:text-white">৳14,036 every 3 months</strong>{" "}
                  (≈ ৳4,679/month).
                </li>
                <li className="border-l-2 border-amber-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">৳10,00,000 in Paribar:</strong> crosses
                  both limits → 11.80% with 10% tax ={" "}
                  <strong className="text-slate-900 dark:text-white">৳8,850/month</strong>.
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
                    <ChevronDown
                      className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
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
                  <li key={r.slug}>
                    <ToolCard tool={r} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </>
  );
}

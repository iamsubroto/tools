import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, ExternalLink, Lock } from "lucide-react";
import rawRates from "@/data/rates.json";
import { ratesSchema } from "@/data/rates.schema";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { VatAitCalculatorClient } from "@/components/calculators/VatAitCalculatorClient";
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

const SLUG = "vat-ait-calculator-bd";
const vatConfig = ratesSchema.parse(rawRates).vatBd;
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "BD VAT, VDS & AIT Calculator (15%, 10%, 7.5%, 5% Add & Remove)",
  description:
    "Add or remove Bangladesh VAT (15%, 10%, 7.5%, 5%, 2%) and compute VDS + AIT vendor withholding and treasury challan amounts instantly in BDT.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Bangladesh VAT, VDS & AIT Calculator",
    description:
      "Calculate VAT-exclusive and VAT-inclusive prices plus VDS and AIT deductions for Bangladesh invoices and tenders.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Bangladesh VAT, VDS & AIT Calculator",
    description:
      "Instantly add or extract Bangladesh VAT (15%, 10%, 7.5%, 5%) and AIT withholding.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "What is the standard VAT rate in Bangladesh?",
    answerEn:
      "The standard VAT rate under Bangladesh's VAT and Supplementary Duty Act is 15%. NBR also specifies truncated/reduced rates (such as 10%, 7.5%, 5%, and 2%) for specific sectors like restaurants, IT services, procurement, and construction.",
    questionBn: "বাংলাদেশে আদর্শ ভ্যাটের হার কত?",
    answerBn:
      "বাংলাদেশের ভ্যাট আইন অনুযায়ী স্ট্যান্ডার্ড ভ্যাট হার ১৫%। এছাড়া রেস্তোরাঁ, আইটি সেবা, প্রকিউরমেন্ট ও নির্মাণ খাতের জন্য ১০%, ৭.৫%, ৫% ও ২% হ্রাসকৃত হার প্রযোজ্য।",
  },
  {
    questionEn: "How do I extract VAT from a VAT-inclusive bill?",
    answerEn:
      "To find the base amount before VAT from a gross bill, divide the gross amount by (1 + VAT rate ÷ 100). For 15% VAT on ৳11,500: Base = 11,500 ÷ 1.15 = ৳10,000, and the VAT inside is ৳1,500 (not 15% of 11,500!).",
    questionBn: "ভ্যাটসহ মোট বিল থেকে ভেতরের ভ্যাট কীভাবে বের করব?",
    answerBn:
      "মোট অঙ্ককে (১ + ভ্যাট হার ÷ ১০০) দিয়ে ভাগ করলে ভ্যাট বাদে মূল মূল্য পাওয়া যায়। যেমন ১১,৫০০ টাকায় ১৫% ভ্যাট থাকলে মূল মূল্য = ১১,৫০০ ÷ ১.১৫ = ১০,০০০ টাকা এবং ভ্যাট = ১,৫০০ টাকা।",
  },
  {
    questionEn: "What is the difference between VDS and AIT on B2B invoices?",
    answerEn:
      "VDS (VAT Deduction at Source) is the VAT portion withheld by a deducting entity and deposited to the NBR treasury challan. AIT (Advance Income Tax) is income tax deducted at source on the base bill value (excluding VAT) before paying the vendor.",
    questionBn: "ভেন্ডর বিলে ভিডিএস (VDS) ও এআইটি (AIT)-এর পার্থক্য কী?",
    answerBn:
      "ভিডিএস হলো উৎসে কর্তিত ভ্যাট এবং এআইটি হলো মূল বিলের (ভ্যাট বাদে) ওপর উৎসে কর্তিত অগ্রিম আয়কর। উভয় অঙ্ক সরকারি চালানে জমা দিয়ে বাকি নিট টাকা বিক্রেতাকে পরিশোধ করা হয়।",
  },
  {
    questionEn: "When can a business claim Input VAT Credit in Bangladesh?",
    answerEn:
      "Generally, registered businesses paying standard 15% VAT with a valid Mushak-6.3 tax invoice and banking channel payment (for transactions above statutory cash limits) can claim Input VAT Credit against output VAT.",
    questionBn: "ব্যবসায়ীরা কখন উপকরণ কর রেয়াত (Input VAT Credit) নিতে পারেন?",
    answerBn:
      "সাধারণত ১৫% স্ট্যান্ডার্ড হারে ভ্যাট পরিশোধ করলে এবং বৈধ মূসক-৬.৩ চালান থাকলে নিবন্ধিত প্রতিষ্ঠান উপকরণ কর রেয়াত নিতে পারে।",
  },
];

export default function VatAitCalculatorPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Bangladesh VAT, VDS & AIT Calculator",
          description:
            "Add or remove Bangladesh VAT and calculate VDS & AIT vendor withholding amounts.",
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
                VAT, VDS &amp; AIT Calculator (BD)
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                বাংলাদেশ ভ্যাট, ভিডিএস ও এআইটি ক্যালকুলেটর
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              NBR VAT Rates · Updated {vatConfig.lastUpdated}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
            <a
              href={vatConfig.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-1 font-medium text-slate-500 hover:text-emerald-700 dark:text-slate-400"
            >
              Source: {vatConfig.officialSource}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <VatAitCalculatorClient config={vatConfig} />

        <AdSlot slotId="vat-ait-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Common Bangladesh VAT rates (NBR)
            </h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Rate</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Common Usage in Bangladesh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vatConfig.presets.map((p) => (
                      <tr key={p.rate} className="text-slate-700 dark:text-slate-300">
                        <th scope="row" className="whitespace-nowrap px-5 py-3.5 font-semibold tabular-nums text-slate-900 dark:text-white">
                          {p.labelEn}
                          <span className="block font-bangla text-xs font-normal text-slate-500">{p.labelBn}</span>
                        </th>
                        <td className="px-5 py-3.5">
                          <p>{p.usageEn}</p>
                          <p className="mt-0.5 font-bangla text-xs text-slate-500">{p.usageBn}</p>
                        </td>
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
                Add VAT vs Remove VAT formulas
              </h2>
              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p>Add VAT: Total = Base × (1 + r/100)</p>
                <p>VAT = Base × (r/100)</p>
                <p>Remove VAT: Base = Gross ÷ (1 + r/100)</p>
                <p>VAT Inside = Gross − Base</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked Bangladesh invoice examples
              </h2>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li className="border-l-2 border-emerald-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">Adding 15% VAT to ৳10,000:</strong>{" "}
                  VAT is ৳1,500, making the Mushak-6.3 invoice total <strong className="text-slate-900 dark:text-white">৳11,500</strong>.
                </li>
                <li className="border-l-2 border-indigo-500 pl-3">
                  <strong className="text-slate-900 dark:text-white">Removing 15% VAT from ৳11,500:</strong>{" "}
                  Base value is <strong className="text-slate-900 dark:text-white">৳10,000</strong> and VAT inside is ৳1,500.
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

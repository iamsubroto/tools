import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Heading, Separator, Table, Text } from "@radix-ui/themes";
import { ExternalLink, ShieldCheck } from "lucide-react";
import rawRates from "@/data/rates.json";
import { ratesSchema } from "@/data/rates.schema";
import { siteConfig } from "@/config/site";
import { SanchayapatraCalculatorClient } from "@/components/calculators/SanchayapatraCalculatorClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { AdSlot } from "@/components/monetization/AdSlot";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildWebApplicationSchema,
  type FaqItem,
} from "@/lib/schema";
import { formatBDT, formatPercent } from "@/lib/formatters";

const rates = ratesSchema.parse(rawRates);
const sanchayapatraConfig = rates.sanchayapatra;

export const metadata: Metadata = {
  title: "Sanchayapatra Calculator Bangladesh (All 4 Schemes & Tax)",
  description:
    "Calculate net monthly, 3-month, and maturity profit after source tax (0%, 5%, 10%) for Paribar, Pensioner, 3-Month, and 5-Year Bangladesh Sanchayapatra.",
  alternates: {
    canonical: "/sanchayapatra-calculator",
  },
  openGraph: {
    title: "Sanchayapatra Calculator Bangladesh — Compare All 4 Schemes",
    description:
      "Enter one investment amount and instantly compare monthly, 3-month, and maturity net profit after NBR source tax across all 4 Bangladesh Sanchayapatra schemes.",
    url: `${siteConfig.url}/sanchayapatra-calculator`,
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
    questionEn:
      "What are the current Sanchayapatra profit rates in Bangladesh?",
    answerEn:
      "For cumulative investments up to ৳7.5 Lakh, maturity profit rates are 11.98% for Pensioner Sanchayapatra, 11.93% for Paribar Sanchayapatra, 11.83% for 5-Year Bangladesh Sanchayapatra, and 11.82% for 3-Month Profit-Bearing Sanchayapatra. Above ৳7.5 Lakh, maturity rates are 11.80% (Pensioner, Paribar, 5-Year) and 11.77% (3-Month).",
    questionBn: "বর্তমানে বাংলাদেশের সঞ্চয়পত্রের মুনাফার হার কত?",
    answerBn:
      "মোট ৭.৫ লক্ষ টাকা পর্যন্ত বিনিয়োগে মেয়াদপূর্তিতে পেনশনার সঞ্চয়পত্রে ১১.৯৮%, পরিবার সঞ্চয়পত্রে ১১.৯৩%, ৫-বছর মেয়াদী বাংলাদেশ সঞ্চয়পত্রে ১১.৮৩% এবং ৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্রে ১১.৮২% মুনাফা পাওয়া যায়। ৭.৫ লক্ষ টাকার বেশি হলে হার যথাক্রমে ১১.৮০% ও ১১.৭৭%।",
  },
  {
    questionEn: "How much source tax (TDS) is deducted from Sanchayapatra profit?",
    answerEn:
      "Under Section 105 of Bangladesh's Income Tax Act, if your total cumulative investment across all savings certificates is up to ৳5,00,000, source tax is 5% for Paribar, 3-Month, and 5-Year Sanchayapatra, and 0% (tax-free) for Pensioner Sanchayapatra. Once cumulative investment exceeds ৳5,00,000, a 10% source tax applies across all four schemes.",
    questionBn: "সঞ্চয়পত্রের মুনাফা থেকে কত শতাংশ উৎস কর (TDS) কাটা হয়?",
    answerBn:
      "আয়কর আইন অনুযায়ী মোট সঞ্চয়পত্র বিনিয়োগ ৫ লক্ষ টাকা পর্যন্ত হলে পেনশনার সঞ্চয়পত্রে ০% (করমুক্ত) এবং পরিবার, ৩-মাসিক ও ৫-বছর মেয়াদী সঞ্চয়পত্রে ৫% উৎস কর কাটা হয়। মোট বিনিয়োগ ৫ লক্ষ টাকার বেশি হলে সব সঞ্চয়পত্রেই ১০% উৎস কর প্রযোজ্য।",
  },
  {
    questionEn:
      "How does the 3-Month Profit-Bearing Sanchayapatra pay interest?",
    answerEn:
      "The 3-Month Profit-Bearing Sanchayapatra has a 3-year term and deposits profit directly into your bank account via EFT every 3 months (4 times a year). Our calculator displays both the exact 3-month lump payout you receive and the per-month equivalent so you can compare it fairly with monthly schemes like Paribar and Pensioner.",
    questionBn: "৩-মাস অন্তর মুনাফা ভিত্তিক সঞ্চয়পত্রের মুনাফা কীভাবে পাওয়া যায়?",
    answerBn:
      "এই সঞ্চয়পত্রের মেয়াদ ৩ বছর এবং প্রতি ৩ মাস পরপর (বছরে ৪ বার) আপনার ব্যাংক অ্যাকাউন্টে ইএফটির মাধ্যমে মুনাফা জমা হয়। আমাদের ক্যালকুলেটরে প্রতি ৩ মাসে হাতে পাওয়া অঙ্ক এবং মাসিক গড় হিসাব—দুটিই দেখানো হয়েছে।",
  },
  {
    questionEn:
      "Which Sanchayapatra gives the highest monthly income in Bangladesh?",
    answerEn:
      "Pensioner Sanchayapatra offers the highest net monthly income (11.98% up to ৳7.5 Lakh, with 0% source tax up to ৳5 Lakh), but it is restricted to retired government/autonomous employees. For general female citizens, Paribar Sanchayapatra (11.93% up to ৳7.5 Lakh) offers the highest monthly payout.",
    questionBn: "কোন সঞ্চয়পত্রে প্রতি মাসে সবচেয়ে বেশি মুনাফা পাওয়া যায়?",
    answerBn:
      "অবসরপ্রাপ্ত সরকারি কর্মচারীদের জন্য পেনশনার সঞ্চয়পত্রে সবচেয়ে বেশি মাসিক মুনাফা (৭.৫ লক্ষ পর্যন্ত ১১.৯৮% এবং ৫ লক্ষ পর্যন্ত ০% কর) পাওয়া যায়। সাধারণ নারী বিনিয়োগকারীদের জন্য পরিবার সঞ্চয়পত্রে (১১.৯৩%) সর্বোচ্চ মাসিক মুনাফা মেলে।",
  },
  {
    questionEn: "What happens if I encash my Sanchayapatra before maturity?",
    answerEn:
      "If you encash before completing the full 3-year or 5-year term, the National Savings Directorate recalculates your profit at the lower year-wise rate for completed years (for example, 9.81% after Year 1 on Paribar Sanchayapatra) and adjusts any excess profit already paid from your principal.",
    questionBn: "মেয়াদ পূর্ণ হওয়ার আগে সঞ্চয়পত্র ভাঙালে কী হয়?",
    answerBn:
      "মেয়াদপূর্তির আগে সঞ্চয়পত্র ভাঙালে পূর্ণ হওয়া বছরের নির্ধারিত কম হারে মুনাফা হিসাব করা হয় এবং পূর্বে অতিরিক্ত মুনাফা গ্রহণ করে থাকলে তা মূল টাকা থেকে সমন্বয় করা হয়।",
  },
];

export default function SanchayapatraCalculatorPage() {
  const webAppSchema = buildWebApplicationSchema({
    name: "Sanchayapatra Calculator Bangladesh",
    description:
      "Compare net monthly, 3-month, and maturity profit after source tax across Paribar, Pensioner, 3-Month, and 5-Year Bangladesh Sanchayapatra.",
    slug: "sanchayapatra-calculator",
    applicationCategory: "FinanceApplication",
  });

  const faqSchema = buildFaqSchema(FAQS);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Finance & Banking", path: "/" },
    { name: "Sanchayapatra Calculator", path: "/sanchayapatra-calculator" },
  ]);

  const schemesList = [
    sanchayapatraConfig.schemes.pensioner,
    sanchayapatraConfig.schemes.paribar,
    sanchayapatraConfig.schemes.fiveYear,
    sanchayapatraConfig.schemes.threeMonth,
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <JsonLd data={webAppSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="print:hidden mb-4 flex flex-wrap items-center gap-1.5 text-xs text-[var(--gray-10)]"
      >
        <Link href="/" className="hover:text-[var(--accent-11)]">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span>Finance &amp; Banking</span>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[var(--gray-12)]">
          Sanchayapatra Calculator
        </span>
      </nav>

      {/* Page Heading & Verified Rate Source Badge */}
      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="2" variant="soft" color="jade">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verified NSD &amp; NBR Rates • Updated{" "}
            {sanchayapatraConfig.lastUpdated}
          </Badge>
          <a
            href={sanchayapatraConfig.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--gray-10)] hover:text-[var(--accent-11)]"
          >
            {sanchayapatraConfig.officialSource}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>

        <Heading as="h1" size={{ initial: "6", sm: "8" }} className="tracking-tight">
          Sanchayapatra Calculator (Bangladesh)
        </Heading>

        <Text as="p" size="3" color="gray" className="max-w-3xl leading-relaxed">
          Enter your investment amount once to compare exact{" "}
          <strong className="font-medium text-[var(--gray-12)]">
            net monthly, 3-month, and maturity profit
          </strong>{" "}
          after source tax (TDS) across all 4 Bangladesh National Savings
          Certificates—Paribar, Pensioner, 3-Month Profit-Bearing, and 5-Year
          Bangladesh Sanchayapatra.
        </Text>
      </header>

      {/* Interactive Calculator (Isolated Client Leaf) */}
      <SanchayapatraCalculatorClient config={sanchayapatraConfig} />

      {/* CLS-Safe Ad Slot Between Calculator & Reference Guide */}
      <AdSlot slotId="sanchayapatra-mid-banner" size="banner" />

      {/* Server-Rendered SEO Content Guide (Rich, Original, Helpful) */}
      <article className="mt-10 space-y-10">
        {/* Official Rate Table Hydrated from rates.json */}
        <section className="space-y-4">
          <Heading as="h2" size="5">
            Official Bangladesh Sanchayapatra Profit Rates &amp; Source Tax Table
          </Heading>
          <Text as="p" size="3" color="gray" className="leading-relaxed">
            The National Savings Directorate (NSD) applies a two-tier cumulative
            investment structure: <strong>Up to ৳7.5 Lakh</strong> (Tier 1) and{" "}
            <strong>Above ৳7.5 Lakh</strong> (Tier 2). Source tax (TDS) under
            Section 105 of the Income Tax Act is determined at the{" "}
            <strong>৳5 Lakh</strong> cumulative threshold.
          </Text>

          <Card size="2" className="overflow-hidden border border-[var(--gray-5)]">
            <div className="overflow-x-auto">
              <Table.Root variant="surface" size="2">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Scheme</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Term &amp; Payout</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">
                      Rate (≤ ৳7.5L)
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">
                      Rate (&gt; ৳7.5L)
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">
                      Tax (≤ ৳5L / &gt; ৳5L)
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">
                      Single Limit
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {schemesList.map((s) => (
                    <Table.Row key={s.id}>
                      <Table.RowHeaderCell className="font-medium">
                        <div>{s.nameEn}</div>
                        <div className="text-xs text-[var(--gray-10)]">
                          {s.nameBn}
                        </div>
                      </Table.RowHeaderCell>
                      <Table.Cell>
                        {s.termYears} yrs •{" "}
                        {s.payoutFrequency === "monthly"
                          ? "Monthly"
                          : s.payoutFrequency === "quarterly"
                            ? "Every 3 Months"
                            : "At Maturity"}
                      </Table.Cell>
                      <Table.Cell align="right" className="tabular-nums font-semibold">
                        {formatPercent(s.tier1.maturityRate)}
                      </Table.Cell>
                      <Table.Cell align="right" className="tabular-nums">
                        {formatPercent(s.tier2.maturityRate)}
                      </Table.Cell>
                      <Table.Cell align="right" className="tabular-nums">
                        {formatPercent(s.taxRateUpToCutoff, { decimals: 0 })} /{" "}
                        {formatPercent(s.taxRateAboveCutoff, { decimals: 0 })}
                      </Table.Cell>
                      <Table.Cell align="right" className="tabular-nums">
                        {formatBDT(s.maxSingleLimit)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>
          </Card>
        </section>

        {/* How Calculation Works + Worked Bangladesh Example */}
        <section className="grid gap-6 md:grid-cols-2">
          <Card size="3" className="space-y-3 border border-[var(--gray-5)]">
            <Heading as="h2" size="4">
              How Sanchayapatra Profit &amp; Tax Are Calculated
            </Heading>
            <Text as="p" size="2" color="gray" className="leading-relaxed">
              Every Sanchayapatra pays simple interest locked in at the rate
              active on your purchase date. The net payout formula is:
            </Text>
            <div className="rounded-[var(--radius-2)] bg-[var(--gray-2)] p-3 font-mono text-xs text-[var(--gray-12)]">
              Annual Gross Profit = Principal × Annual Rate
              <br />
              Source Tax (TDS) = Annual Gross Profit × Tax Rate
              <br />
              Net Monthly Equivalent = (Annual Gross − TDS) ÷ 12
              <br />
              3-Month Payout = (Annual Gross − TDS) ÷ 4
            </div>
            <Text as="p" size="2" color="gray" className="leading-relaxed">
              Remember that both the <strong>৳5 Lakh tax threshold</strong> and
              the <strong>৳7.5 Lakh profit slab</strong> are evaluated on your{" "}
              <em>total cumulative investment</em> across all savings
              certificates—not just a single certificate. Use the &ldquo;Already
              hold existing Sanchayapatra&rdquo; toggle above if you already own
              certificates.
            </Text>
          </Card>

          <Card size="3" className="space-y-3 border border-[var(--gray-5)]">
            <Heading as="h2" size="4">
              Worked Example: Investing ৳5,00,000 vs ৳10,00,000
            </Heading>
            <ul className="space-y-2.5 text-sm leading-relaxed text-[var(--gray-11)]">
              <li>
                <strong className="text-[var(--gray-12)]">
                  Example 1 — ৳5,00,000 in Paribar Sanchayapatra:
                </strong>{" "}
                Falls in Tier 1 (11.93%) with 5% source tax. Annual gross profit
                is ৳59,650, tax is ৳2,983, leaving{" "}
                <strong>৳4,722/month net</strong> directly in your bank account.
              </li>
              <li>
                <strong className="text-[var(--gray-12)]">
                  Example 2 — ৳5,00,000 in 3-Month Profit-Bearing:
                </strong>{" "}
                Earns 11.82% with 5% tax. Annual net profit is ৳56,145, which
                pays <strong>৳14,036 every 3 months</strong> (equivalent to{" "}
                <strong>৳4,679/month</strong>).
              </li>
              <li>
                <strong className="text-[var(--gray-12)]">
                  Example 3 — ৳10,00,000 in Paribar Sanchayapatra:
                </strong>{" "}
                Crosses both thresholds, shifting to Tier 2 (11.80%) and 10%
                source tax. Annual gross is ৳1,18,000, tax is ৳11,800, giving{" "}
                <strong>৳8,850/month net</strong>.
              </li>
            </ul>
          </Card>
        </section>

        <Separator size="4" />

        {/* Native HTML <details> FAQs — Zero Client JS */}
        <section className="space-y-4">
          <Heading as="h2" size="5">
            Frequently Asked Questions (Sanchayapatra Bangladesh)
          </Heading>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.questionEn}
                className="rounded-[var(--radius-3)] border border-[var(--gray-5)] bg-[var(--color-background)] p-4"
              >
                <summary className="cursor-pointer font-semibold text-[var(--gray-12)] select-none">
                  <span>{faq.questionEn}</span>
                  <span className="mt-0.5 block text-xs font-normal text-[var(--gray-10)]">
                    {faq.questionBn}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 border-t border-[var(--gray-4)] pt-3 text-sm leading-relaxed text-[var(--gray-11)]">
                  <p>{faq.answerEn}</p>
                  <p className="text-[var(--gray-10)]">{faq.answerBn}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, ExternalLink, Lock } from "lucide-react";
import rawRates from "@/data/rates.json";
import { ratesSchema } from "@/data/rates.schema";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { AgeCalculatorClient } from "@/components/calculators/AgeCalculatorClient";
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

const SLUG = "age-calculator";
const jobAgeConfig = ratesSchema.parse(rawRates).govtJobAgeLimit;
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "Age Calculator & BD Govt Job / BCS (32-Year) Eligibility Checker",
  description:
    "Calculate exact age in years, months, and days on any circular date and instantly check Bangladesh Govt Job & BCS 32-year maximum age eligibility.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Age & BD Govt Job / BCS Eligibility Calculator — Tools BD",
    description:
      "Check exact age in years, months, and days plus Bangladesh 32-year BCS & Govt job circular cutoff eligibility.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Age & BD Govt Job (32-Year) Calculator",
    description:
      "Exact age in years, months, days plus Bangladesh 32-year BCS & govt job age limit checker.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "What is the current maximum age limit for Bangladesh government jobs and BCS?",
    answerEn:
      "Under Bangladesh's Government Service Maximum Age Limit Act, the maximum entry age for BCS cadres and direct appointment to government, autonomous, and statutory bodies is 32 years (raised from the previous 30-year limit). Defense and law-enforcement forces follow their own recruitment rules.",
    questionBn: "বাংলাদেশে সরকারি চাকরি ও বিসিএস-এর সর্বোচ্চ বয়সসীমা বর্তমানে কত?",
    answerBn:
      "সরকারি চাকরিতে প্রবেশের সর্বোচ্চ বয়সসীমা অধ্যাদেশ ও আইন অনুযায়ী বিসিএসসহ সরকারি, স্বায়ত্তশাসিত ও সংবিধিবদ্ধ প্রতিষ্ঠানে সরাসরি নিয়োগের সর্বোচ্চ বয়সসীমা ৩২ বছর। প্রতিরক্ষা ও আইনশৃঙ্খলা বাহিনীর নিজস্ব বিধিমালা প্রযোজ্য।",
  },
  {
    questionEn: "Which date is used to calculate age for a BCS or government job circular?",
    answerEn:
      "Age is always calculated on the specific reference/cutoff date printed inside the official job circular (often the 1st day of the month of publication), NOT the day you submit the online Teletalk form. Enter that circular cutoff date into the second field above.",
    questionBn: "সরকারি চাকরির আবেদনে কোন তারিখ ধরে বয়স হিসাব করা হয়?",
    answerBn:
      "আবেদনের তারিখ নয়, বরং নিয়োগ বিজ্ঞপ্তিতে (সার্কুলারে) উল্লিখিত নির্দিষ্ট তারিখ অনুযায়ী বয়স হিসাব করা হয়। ওপরের দ্বিতীয় ঘরে সেই সার্কুলারের তারিখ বসিয়ে যাচাই করুন।",
  },
  {
    questionEn: "How does the calculator handle leap years (February 29)?",
    answerEn:
      "Our calendar engine uses exact month-length arithmetic for 28, 29, 30, and 31-day months, so February 29 birthdays and multi-decade spans return accurate years, months, days, and total days lived.",
    questionBn: "অধিবর্ষ (২৯ ফেব্রুয়ারি) জন্ম তারিখ হলে কি সঠিক বয়স দেখায়?",
    answerBn:
      "হ্যাঁ, প্রতিটি মাসের সঠিক দিনসংখ্যা (২৮, ২৯, ৩০ ও ৩১ দিন) ধরে ক্যালেন্ডার হিসাব করা হয়, তাই ২৯ ফেব্রুয়ারি জন্ম তারিখেও নিখুঁত ফলাফল পাওয়া যায়।",
  },
];

export default function AgeCalculatorPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Age & BD Govt Job Eligibility Calculator",
          description:
            "Calculate exact age in years, months, and days and check Bangladesh 32-year BCS and Govt Job eligibility.",
          slug: SLUG,
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={buildFaqSchema(FAQS)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Career & Student", path: "/#tools" },
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
                <Link href="/#tools" className="hover:text-slate-900 dark:hover:text-white">Career &amp; Student</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
              <li aria-current="page" className="font-medium text-slate-900 dark:text-white">{tool.titleEn}</li>
            </ol>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                Age &amp; BD Govt Job Eligibility Calculator
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                সঠিক বয়স ও সরকারি চাকরি / বিসিএস (৩২ বছর) যোগ্যতা যাচাই
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Updated {jobAgeConfig.generalMaxYears}-Year BD Govt Job Law
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
            <a
              href={jobAgeConfig.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-1 font-medium text-slate-500 hover:text-emerald-700 dark:text-slate-400"
            >
              Source: {jobAgeConfig.officialSource}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AgeCalculatorClient
          config={jobAgeConfig}
          defaultTargetDate="2026-11-23"
        />

        <AdSlot slotId="age-govt-job-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Bangladesh Govt Job age limits at a glance
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-900 dark:text-white">General Govt &amp; Autonomous Jobs:</strong>{" "}
                  {jobAgeConfig.minYears} to {jobAgeConfig.generalMaxYears} years.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">BCS Cadre &amp; Non-Cadre:</strong>{" "}
                  {jobAgeConfig.bcsMinYears} to {jobAgeConfig.bcsMaxYears} years.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Departmental / Senior Posts:</strong>{" "}
                  May allow 35–40 years per specific circular — pick a custom limit above.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked circular check example
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Suppose a job circular sets the age cutoff date as{" "}
                <strong className="text-slate-900 dark:text-white">July 1, 2026</strong>. A candidate born on{" "}
                <strong className="text-slate-900 dark:text-white">July 1, 1994</strong> is exactly{" "}
                <strong className="text-slate-900 dark:text-white">32 years, 0 months, 0 days</strong> old — eligible.
                Born just one day earlier (June 30, 1994), the age becomes 32 years, 0 months, 1 day — over the 32-year limit.
              </p>
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

import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, Lock, TriangleAlert } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { BmiCalculatorClient } from "@/components/calculators/BmiCalculatorClient";
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

const SLUG = "bmi-calculator";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "BMI Calculator Bangladesh (Feet/Inches & cm — WHO & Asian Cut-offs)",
  description:
    "Calculate your Body Mass Index (BMI) in feet/inches or cm and kg with both WHO global and South Asian cut-offs plus healthy weight range.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "BMI Calculator (WHO & South Asian Cut-offs) — Tools BD",
    description:
      "Free BMI calculator supporting feet/inches and cm with South Asian and WHO reference categories.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "BMI Calculator Bangladesh — WHO & Asian Cut-offs",
    description:
      "Calculate BMI in ft/in or cm with South Asian & WHO healthy weight ranges.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "What is the normal BMI range for Bangladesh and South Asia?",
    answerEn:
      "Under WHO South Asian / Asia-Pacific guidelines, a healthy BMI is 18.5 to 22.9, Overweight begins at 23.0, and High Risk (Obese) begins at 27.5. Under global WHO cut-offs, Normal is 18.5 to 24.9 and Overweight starts at 25.0.",
    questionBn: "বাংলাদেশ ও দক্ষিণ এশিয়ার জন্য স্বাভাবিক বিএমআই (BMI) কত?",
    answerBn:
      "দক্ষিণ এশীয় মানদণ্ড অনুযায়ী স্বাভাবিক বিএমআই ১৮.৫ থেকে ২২.৯, অতিরিক্ত ওজন ২৩.০ থেকে ২৭.৪ এবং উচ্চ ঝুঁকি ২৭.৫ বা তার বেশি। বৈশ্বিক WHO মানদণ্ডে স্বাভাবিক সীমা ১৮.৫–২৪.৯।",
  },
  {
    questionEn: "How is BMI calculated from height and weight?",
    answerEn:
      "BMI equals weight in kilograms divided by height in meters squared: BMI = kg ÷ (m × m). If you enter feet and inches, our calculator converts your height to meters automatically (1 inch = 2.54 cm).",
    questionBn: "উচ্চতা ও ওজন থেকে বিএমআই কীভাবে হিসাব করা হয়?",
    answerBn:
      "কেজিতে ওজনকে মিটারে উচ্চতার বর্গ দিয়ে ভাগ করলে বিএমআই পাওয়া যায়: BMI = ওজন (কেজি) ÷ উচ্চতা (মিটার)²। ফুট-ইঞ্চি দিলে ক্যালকুলেটর নিজেই তা মিটারে রূপান্তর করে নেয়।",
  },
  {
    questionEn: "Is BMI alone enough to judge my health?",
    answerEn:
      "No. BMI is a quick screening number—it does not distinguish muscle mass from body fat, nor does it measure waist circumference, age, or blood markers. Always consult a qualified physician for medical advice.",
    questionBn: "শুধু বিএমআই দিয়ে কি পুরো স্বাস্থ্য বোঝা যায়?",
    answerBn:
      "না। বিএমআই কেবল প্রাথমিক সূচক—এটি পেশি ও চর্বির পার্থক্য বা কোমরের মাপ হিসাব করে না। যেকোনো স্বাস্থ্যগত সিদ্ধান্তের জন্য নিবন্ধিত চিকিৎসকের পরামর্শ নিন।",
  },
];

export default function BmiCalculatorPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "BMI Calculator (WHO & South Asian Cut-offs)",
          description:
            "Calculate Body Mass Index (BMI) in feet/inches or cm with WHO and South Asian reference ranges.",
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
                BMI Calculator
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                বিএমআই ক্যালকুলেটর (ফুট/ইঞ্চি ও সেমি — WHO ও দক্ষিণ এশীয় মানদণ্ড)
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              WHO &amp; South Asian Cut-offs
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Runs in your browser
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BmiCalculatorClient />

        {/* Non-Medical Informational Disclaimer */}
        <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            <strong>Informational only (Not medical advice):</strong> BMI is a general
            population screening metric for adults and does not replace professional
            medical evaluation, body-composition testing, or clinical diagnosis.
          </p>
        </div>

        <AdSlot slotId="bmi-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              WHO Global vs South Asian BMI reference table
            </h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-[13px]">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                      <th scope="col" className="px-4 py-3 font-semibold">South Asian Cut-off</th>
                      <th scope="col" className="px-5 py-3 font-semibold">WHO Global Cut-off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums dark:divide-slate-800">
                    <tr>
                      <th scope="row" className="px-5 py-3 font-medium text-slate-900 dark:text-white">Underweight</th>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">&lt; 18.5</td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">&lt; 18.5</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-medium text-emerald-700 dark:text-emerald-400">Normal</th>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">18.5 – 22.9</td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">18.5 – 24.9</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-medium text-amber-700 dark:text-amber-400">Overweight</th>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">23.0 – 27.4</td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">25.0 – 29.9</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-medium text-rose-700 dark:text-rose-400">Obese / High risk</th>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">≥ 27.5</td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">≥ 30.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

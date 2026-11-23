import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { WordCounterClient } from "@/components/calculators/WordCounterClient";
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

const SLUG = "word-character-counter";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "Word & Character Counter (Bangla & English + SMS Segment Counter)",
  description:
    "Count Bangla and English words, characters with and without spaces, sentences (including Bangla Dari ।), reading time, and SMS segments offline in your browser.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Bangla & English Word & Character Counter — Tools BD",
    description:
      "Live word, character, sentence, reading time, and Bangla/English SMS part counter running 100% in your browser.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Word & Character Counter (Bangla & English)",
    description:
      "Instant Bangla & English word, character, sentence, reading time, and SMS counter.",
  },
};

const FAQS: FaqItem[] = [
  {
    questionEn: "Does this word counter work accurately with Bangla Unicode text?",
    answerEn:
      "Yes. It counts Bangla words, characters, paragraphs, and sentences ending with the Bangla Dari (।) as well as English punctuation (. ! ?), all completely privately in your browser.",
    questionBn: "এই শব্দ গণনাকারী কি বাংলা ইউনিকোড লেখার জন্য সঠিকভাবে কাজ করে?",
    answerBn:
      "হ্যাঁ। বাংলা শব্দ, অক্ষর, অনুচ্ছেদ এবং বাংলা দাঁড়ি (।) দিয়ে শেষ হওয়া বাক্যসহ ইংরেজি সব লেখা নিখুঁতভাবে গণনা করে।",
  },
  {
    questionEn: "Why does a Bangla SMS allow 70 characters instead of 160?",
    answerEn:
      "Standard English SMS uses GSM-7 encoding (160 characters for 1 SMS, 153 per part for multi-part). As soon as a message includes Bangla or emoji characters, telecom operators switch to UCS-2 Unicode encoding, which fits 70 characters in 1 SMS (67 per part for longer messages).",
    questionBn: "বাংলা এসএমএস-এ ১৬০-এর বদলে ৭০ অক্ষর ধরা হয় কেন?",
    answerBn:
      "ইংরেজি এসএমএস GSM-7 এনকোডিংয়ে ১৬০ অক্ষর ধারণ করে। কিন্তু বাংলা বা ইমোজি থাকলে অপারেটর UCS-2 ইউনিকোড এনকোডিং ব্যবহার করে, যেখানে ১টি এসএমএস-এ ৭০ অক্ষর (একাধিক অংশে প্রতিটিতে ৬৭ অক্ষর) ধরে।",
  },
  {
    questionEn: "Is my pasted text uploaded or saved anywhere?",
    answerEn:
      "Never. All counting and space cleanup run locally inside your browser tab—nothing is sent to any server.",
    questionBn: "আমার পেস্ট করা লেখা কি কোথাও সংরক্ষণ করা হয়?",
    answerBn:
      "না। সম্পূর্ণ হিসাব আপনার ব্রাউজারের ভেতরেই হয়—কোনো লেখা সার্ভারে পাঠানো বা সংরক্ষণ করা হয় না।",
  },
];

export default function WordCharacterCounterPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Bangla & English Word and Character Counter",
          description:
            "Count Bangla and English words, characters, sentences, reading time, and SMS parts privately in your browser.",
          slug: SLUG,
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={buildFaqSchema(FAQS)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Bangla & Text", path: "/#tools" },
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
                <Link href="/#tools" className="hover:text-slate-900 dark:hover:text-white">Bangla &amp; Text</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
              <li aria-current="page" className="font-medium text-slate-900 dark:text-white">{tool.titleEn}</li>
            </ol>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                Word &amp; Character Counter
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                বাংলা ও ইংরেজি শব্দ, অক্ষর এবং এসএমএস গণনাকারী
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Bangla Dari (।) &amp; Bulk SMS Support
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              100% Private · Zero Uploads
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WordCounterClient />

        <AdSlot slotId="word-counter-mid" size="banner" />

        <article className="mx-auto max-w-4xl space-y-12">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Common character &amp; word limits
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-900 dark:text-white">English SMS (1 part):</strong> 160 characters</li>
                <li><strong className="text-slate-900 dark:text-white">Bangla SMS (1 part):</strong> 70 characters</li>
                <li><strong className="text-slate-900 dark:text-white">SEO Meta Description:</strong> 140–160 characters</li>
                <li><strong className="text-slate-900 dark:text-white">X / Twitter Post:</strong> 280 characters</li>
                <li><strong className="text-slate-900 dark:text-white">IELTS Writing Task 2:</strong> Minimum 250 words</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Built for writers, students &amp; marketers
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Whether you are drafting a BCS essay, checking an IELTS word count,
                writing Facebook ad copy, or estimating bulk Bangla SMS costs for
                your business, all counts update live as you type—without ever
                leaving your browser.
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

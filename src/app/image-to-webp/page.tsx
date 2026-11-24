import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Lock,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { ImageToWebpClient } from "@/components/calculators/ImageToWebpClient";
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

const SLUG = "image-to-webp";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "Image to WebP Converter — Free Local JPG & PNG to WebP Batch Tool",
  description:
    "Convert JPG/JPEG and PNG images to WebP right in your browser with zero uploads. Resize by pixels or percentage, preserve PNG transparency, and export ZIP.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Image to WebP Converter — Tools BD",
    description:
      "Fast, private client-side JPG & PNG to WebP converter with custom resizing, quality slider, PNG alpha transparency support, and batch ZIP download.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Image to WebP Converter (Client-Side JPG & PNG Batch Converter)",
    description:
      "Convert JPG & PNG to WebP locally in your browser. Custom resize, quality control (10–100), transparency preserved, and 1-click ZIP download.",
  },
};

const FORMAT_COMPARISON = [
  {
    format: "WebP (Lossy Q80)",
    typicalSize: "25% – 35% smaller than JPG",
    transparency: "Yes (Full Alpha)",
    bestForEn: "Websites, blogs, e-commerce product images, Core Web Vitals (LCP).",
    bestForBn: "ওয়েবসাইট, ব্লগ, ই-কমার্স পণ্যের ছবি এবং দ্রুত পেজ লোডের জন্য সেরা।",
  },
  {
    format: "JPG / JPEG",
    typicalSize: "Baseline (100%)",
    transparency: "No",
    bestForEn: "Legacy email clients or print workflows requiring JPEG.",
    bestForBn: "পুরনো সফটওয়্যার বা প্রিন্টের কাজে যেখানে JPEG বাধ্যতামূলক।",
  },
  {
    format: "PNG",
    typicalSize: "2× – 5× larger than WebP",
    transparency: "Yes (Full Alpha)",
    bestForEn: "Lossless design masters and screenshots before web publishing.",
    bestForBn: "ডিজাইন ফাইল বা এডিটিংয়ের মূল কপি সংরক্ষণের জন্য।",
  },
];

const FAQS: FaqItem[] = [
  {
    questionEn: "Are my images uploaded to any server during conversion?",
    answerEn:
      "No. Every image is decoded, resized, and encoded to WebP 100% locally inside your browser using the HTML5 Canvas API. Your files never leave your computer or phone, making it safe for personal photos, ID documents, and confidential client assets.",
    questionBn: "ছবি কনভার্ট করার সময় কি আমার ছবি কোনো সার্ভারে আপলোড হয়?",
    answerBn:
      "না। প্রতিটি ছবি সম্পূর্ণভাবে আপনার ব্রাউজারের ভেতরেই HTML5 Canvas ব্যবহার করে রূপান্তরিত হয়। কোনো ছবি কখনো সার্ভারে যায় না।",
  },
  {
    questionEn: "Does converting PNG to WebP keep transparent backgrounds?",
    answerEn:
      "Yes. WebP natively supports full 8-bit alpha transparency. Our converter draws onto a transparent canvas without filling a white background, so logos, icons, and cutouts keep clean transparent edges.",
    questionBn: "PNG থেকে WebP করলে কি ছবির ব্যাকগ্রাউন্ডের স্বচ্ছতা (Transparency) ঠিক থাকে?",
    answerBn:
      "হ্যাঁ। WebP সম্পূর্ণ আলফা ট্রান্সপারেন্সি সাপোর্ট করে, তাই লোগো বা কাটআউট PNG ছবির স্বচ্ছ ব্যাকগ্রাউন্ড হুবহু অক্ষুণ্ণ থাকে।",
  },
  {
    questionEn: "What WebP quality setting should I choose for websites?",
    answerEn:
      "Quality 80 (our default) is the sweet spot for most photographs and product images—it typically shrinks file sizes by 30% to 75% compared to JPG/PNG with virtually no visible quality loss. Use 60–75 for fast-loading thumbnails, or 90–95 for detailed graphics and typography.",
    questionBn: "ওয়েবসাইটের জন্য WebP কোয়ালিটি কত রাখা ভালো?",
    answerBn:
      "সাধারণ ছবি ও পণ্যের ছবির জন্য ৮০ (ডিফল্ট) সবচেয়ে ভালো ভারসাম্য দেয়—দৃশ্যমান মান না কমিয়েই ফাইলের আকার অনেক ছোট হয়। খুব ছোট ফাইলের জন্য ৬০–৭৫ এবং তীক্ষ্ণ গ্রাফিক্সের জন্য ৯০+ ব্যবহার করতে পারেন।",
  },
  {
    questionEn: "Why did a converted WebP file come out larger than my original JPG?",
    answerEn:
      "If your source JPG was already aggressively compressed at low quality (e.g., Q50) and you re-encode it to WebP at a higher quality (e.g., Q90), the output can occasionally be larger. Lowering the quality slider to 70–80 and clicking 'Re-convert all' usually yields a smaller file immediately.",
    questionBn: "কখনো কখনো WebP ফাইল মূল JPG-এর চেয়ে বড় হয়ে যায় কেন?",
    answerBn:
      "মূল JPG ফাইলটি আগে থেকেই খুব কম কোয়ালিটিতে কম্প্রেস করা থাকলে এবং WebP কোয়ালিটি বেশি (যেমন ৯০+) রাখলে ফাইল কিছুটা বড় হতে পারে। কোয়ালিটি ৭০–৮০ তে নামিয়ে 'Re-convert all' ক্লিক করলেই ফাইল ছোট হয়ে যাবে।",
  },
  {
    questionEn: "How does 'Allow enlarging' work when resizing multiple images?",
    answerEn:
      "By default, 'Allow enlarging' is turned off so smaller images are never stretched beyond their original resolution (preventing blurriness). If you set a custom width of 1200px, a 2400px photo scales down to 1200px while an 800px photo stays at 800px—unless you explicitly check 'Allow enlarging'.",
    questionBn: "রিসাইজ করার সময় 'Allow enlarging' অপশনটি কীভাবে কাজ করে?",
    answerBn:
      "ডিফল্টভাবে এটি বন্ধ থাকে, তাই ছোট ছবি কখনো মূল সাইজের চেয়ে বড় হয়ে ঝাপসা হয় না। আপনি চাইলে চেকবক্সটি চালু করে বড় করার অনুমতি দিতে পারেন।",
  },
];

export default function ImageToWebpPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Image to WebP Converter",
          description:
            "Convert JPG/JPEG and PNG images to WebP completely client-side with batch resizing, quality control, PNG transparency support, and ZIP download.",
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

      {/* Page Header */}
      <section className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="print:hidden">
            <ol className="flex flex-wrap items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400">
              <li>
                <Link
                  href="/"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link
                  href="/#tools"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Daily Utilities
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li
                aria-current="page"
                className="font-medium text-slate-900 dark:text-white"
              >
                {tool.titleEn}
              </li>
            </ol>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                Image to WebP Converter
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                কোনো আপলোড ছাড়াই ব্রাউজারে JPG ও PNG ছবিকে দ্রুত WebP-তে রূপান্তর ও রিসাইজ করুন
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              100% Browser-Side · Zero Server Uploads
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              PNG Transparency Preserved
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Batch Resize &amp; ZIP Download
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Converter Workspace */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ImageToWebpClient />

        <AdSlot slotId="image-to-webp-mid" size="banner" />

        {/* Server-Rendered How-to-Use, Format Comparison & FAQs */}
        <article className="mx-auto max-w-5xl space-y-12">
          {/* How to Use */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                How to convert JPG &amp; PNG images to WebP
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Choose settings (optional):
                  </strong>{" "}
                  Keep quality at <strong>80%</strong> for balanced compression,
                  or pick custom pixel dimensions / percentage scaling before
                  adding images.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Drop or browse files:
                  </strong>{" "}
                  Select one or multiple <code className="text-xs">.jpg</code>,{" "}
                  <code className="text-xs">.jpeg</code>, or{" "}
                  <code className="text-xs">.png</code> files. Conversion begins
                  immediately inside your browser.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Fine-tune &amp; download:
                  </strong>{" "}
                  Adjust quality or resize options anytime and click{" "}
                  <em>Re-convert all</em> without re-uploading, then save files
                  individually or in a single <strong>ZIP archive</strong>.
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Why switch to WebP for your website?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                WebP is a modern image format developed by Google that delivers
                substantially smaller file sizes than both JPEG and PNG while
                preserving sharp details and full alpha transparency. Smaller
                images improve{" "}
                <strong className="text-slate-900 dark:text-white">
                  Largest Contentful Paint (LCP)
                </strong>
                , cut mobile data usage for visitors across Bangladesh and
                abroad, and boost Lighthouse &amp; SEO scores across every
                modern browser.
              </p>
            </div>
          </section>

          {/* Format Comparison Table */}
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              WebP vs JPG vs PNG — quick comparison
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[580px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Typical File Size</th>
                    <th className="px-4 py-3">Transparency</th>
                    <th className="px-4 py-3">Best Use (EN &amp; BN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {FORMAT_COMPARISON.map((row) => (
                    <tr key={row.format}>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400">
                        {row.format}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-slate-900 dark:text-white">
                        {row.typicalSize}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.transparency}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {row.bestForEn}
                        </div>
                        <div className="mt-0.5 font-bangla text-xs text-slate-500 dark:text-slate-400">
                          {row.bestForBn}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bilingual FAQs */}
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
                      <span className="mt-0.5 block font-bangla text-[13px] text-slate-500">
                        {faq.questionBn}
                      </span>
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

          {/* Related Tools */}
          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Related tools
              </h2>
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

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
import { ImageResizerClient } from "@/components/calculators/ImageResizerClient";
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

const SLUG = "image-resizer";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title:
    "Reduce Image Size (Under 100KB / 200KB) & Image Resizer — Same Format",
  description:
    "Reduce image size under any KB limit (60KB, 100KB, 200KB) and resize JPG, PNG, or WebP locally without changing file format. Smart crop, presets & ZIP export.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Reduce Image Size (Target KB) — Image Resizer — Tools BD",
    description:
      "Free browser-only tool to reduce image size under 100KB, 200KB, or any target KB and resize JPG, PNG, and WebP images while keeping the original file type.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Reduce Image Size (Under 100KB / 200KB) & Image Resizer",
    description:
      "Reduce image size under any target KB and resize multiple JPG, PNG, or WebP images locally without changing file type. Teletalk 300×300 & social presets included.",
  },
};

const PRESET_REFERENCE = [
  {
    nameEn: "Teletalk / BCS Job Photo",
    nameBn: "টেলিটক / বিসিএস চাকরির ছবি",
    size: "300 × 300 px",
    ratio: "1:1",
    use: "Bangladesh Govt Job & University admission portals (JPG)",
  },
  {
    nameEn: "Teletalk / BCS Signature",
    nameBn: "টেলিটক / বিসিএস স্বাক্ষর",
    size: "300 × 80 px",
    ratio: "15:4",
    use: "Online job application signature box (JPG)",
  },
  {
    nameEn: "YouTube Thumbnail",
    nameBn: "ইউটিউব থাম্বনেইল",
    size: "1280 × 720 px",
    ratio: "16:9",
    use: "HD video cover image (JPG / PNG)",
  },
  {
    nameEn: "Instagram Square Post",
    nameBn: "ইনস্টাগ্রাম পোস্ট",
    size: "1080 × 1080 px",
    ratio: "1:1",
    use: "Social feed posts & F-commerce product squares",
  },
  {
    nameEn: "Instagram / TikTok Story & Reels",
    nameBn: "স্টোরি ও রিলস কভার",
    size: "1080 × 1920 px",
    ratio: "9:16",
    use: "Full-screen vertical mobile graphics",
  },
  {
    nameEn: "Facebook Page Cover",
    nameBn: "ফেসবুক পেজ কভার",
    size: "820 × 312 px",
    ratio: "2.63:1",
    use: "Desktop Facebook page header banner",
  },
];

const FAQS: FaqItem[] = [
  {
    questionEn: "Does this image resizer change my file format?",
    answerEn:
      "No. Every image keeps its exact original file type and extension: JPG stays JPG, JPEG stays JPEG, PNG stays PNG (preserving lossless alpha transparency), and WebP stays WebP. If you want to convert JPG or PNG into WebP, use our dedicated Image to WebP Converter.",
    questionBn: "রিসাইজ করার পর কি আমার ছবির ফাইল ফরম্যাট বদলে যাবে?",
    answerBn:
      "না। প্রতিটি ছবি তার মূল ফরম্যাট ও এক্সটেনশন ধরে রাখবে—JPG থাকবে JPG, PNG থাকবে PNG (স্বচ্ছ ব্যাকগ্রাউন্ডসহ) এবং WebP থাকবে WebP।",
  },
  {
    questionEn: "What is the difference between Fit, Smart Center Crop, and Stretch?",
    answerEn:
      "Keep Aspect Ratio (Fit) scales your image proportionally so nothing is cropped or distorted. Exact Size (Smart Center Crop) fills your exact target width and height—like 300×300 or 1080×1080—by trimming equal overflow from the edges without stretching. Stretch forces exact dimensions even if the proportions differ.",
    questionBn: "Fit, Smart Center Crop এবং Stretch-এর মধ্যে পার্থক্য কী?",
    answerBn:
      "Fit ছবি না কেটে ও বিকৃতি ছাড়াই আনুপাতিকভাবে রিসাইজ করে। Smart Center Crop ছবির অনুপাত ঠিক রেখে দুই পাশ থেকে সমানভাবে ক্রপ করে হুবহু নির্দিষ্ট সাইজ (যেমন ৩০০×৩০০) তৈরি করে। Stretch মূল অনুপাত না রেখে সরাসরি নির্দিষ্ট সাইজে টেনে আনে।",
  },
  {
    questionEn: "Are my photos uploaded to a server?",
    answerEn:
      "Never. All resizing, cropping, and ZIP packaging happen 100% locally in your web browser via the HTML5 Canvas API. Your private photos, passport pictures, and signatures never leave your device.",
    questionBn: "আমার ছবিগুলো কি কোনো সার্ভারে আপলোড হয়?",
    answerBn:
      "কখনই না। সমস্ত রিসাইজ, ক্রপ এবং ZIP তৈরি আপনার ব্রাউজারের ভেতরেই সম্পূর্ণ অফলাইনে সম্পন্ন হয়—ছবি কখনো সার্ভারে যায় না।",
  },
  {
    questionEn: "Can I resize multiple images at once and download them together?",
    answerEn:
      "Yes. Drop or select multiple JPG, PNG, or WebP files at once. The tool resizes them sequentially so your browser stays smooth, lets you preview any image Before & After side-by-side, and offers a 1-click 'Download all as ZIP' button whenever 2 or more images are ready.",
    questionBn: "একসাথে একাধিক ছবি রিসাইজ করে কি ZIP হিসেবে ডাউনলোড করা যাবে?",
    answerBn:
      "হ্যাঁ। একসাথে অনেকগুলো JPG, PNG বা WebP ছবি ড্রপ করুন। সব রিসাইজ হওয়ার পর ২ বা ততোধিক ছবি থাকলে এক ক্লিকেই সবগুলো ZIP ফাইল হিসেবে ডাউনলোড করতে পারবেন।",
  },
  {
    questionEn: "How does 'Target Max File Size (KB)' shrink an image under 200 KB or 100 KB?",
    answerEn:
      "Enter any target cap (such as 60 KB, 100 KB, or 200 KB) or click a preset chip. For JPG and WebP images, the tool runs a fast binary search to keep the highest possible visual quality that stays under your KB limit—and only steps down dimensions if even low quality exceeds the target. For lossless PNGs, it proportionally scales dimensions until the file fits under your KB limit while preserving transparency.",
    questionBn: "'Target Max File Size (KB)' অপশনটি কীভাবে ছবিকে ২০০ KB বা ১০০ KB-এর নিচে নামিয়ে আনে?",
    answerBn:
      "যেকোনো সীমা (যেমন ৬০, ১০০ বা ২০০ KB) লিখুন। JPG ও WebP-র ক্ষেত্রে টুলটি বাইনারি সার্চের মাধ্যমে সর্বোচ্চ মান বজায় রেখে ফাইলটিকে নির্ধারিত KB-র নিচে নিয়ে আসে এবং প্রয়োজনে ডাইমেনশন সমন্বয় করে। PNG-র ক্ষেত্রে স্বচ্ছতা অক্ষুণ্ণ রেখে আনুপাতিকভাবে ডাইমেনশন ছোট করে নির্ধারিত সীমায় আনে।",
  },
  {
    questionEn: "Why didn't my small image scale up to 1920px?",
    answerEn:
      "By default, 'Allow enlarging' is turned off so smaller images are never stretched beyond their native pixels (which causes blurriness). If you genuinely need to upscale a smaller image to meet an exact portal requirement, simply check the 'Allow enlarging' box and click Resize all.",
    questionBn: "ছোট ছবি ১৯২০ পিক্সেলে বড় হলো না কেন?",
    answerBn:
      "ছবি ঝাপসা হওয়া রোধ করতে ডিফল্টভাবে 'Allow enlarging' বন্ধ থাকে। কোনো ফর্মের প্রয়োজনে ছোট ছবি বড় করতে চাইলে 'Allow enlarging' চেকবক্সটি চালু করে পুনরায় রিসাইজ করুন।",
  },
];

export default function ImageResizerPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Reduce Image Size — Image Resizer (Same Format)",
          description:
            "Reduce image size and resize JPG, PNG, and WebP images locally in your browser while preserving the exact original file type. Supports custom pixel dimensions, smart center-crop, percentage scaling, presets, and batch ZIP download.",
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
                Reduce Image Size{" "}
                <span className="font-semibold text-slate-400 dark:text-slate-500">
                  — Image Resizer (Nijhum)
                </span>
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                মূল ফাইল ফরম্যাট অপরিবর্তিত রেখে ব্রাউজারেই JPG, PNG ও WebP ছবির সাইজ কমান ও রিসাইজ করুন
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              JPG→JPG · PNG→PNG · WebP→WebP
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              100% Browser-Side · Zero Uploads
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Target KB Limit (60KB / 100KB / 200KB) · Smart Crop · ZIP
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Resizer Workspace */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ImageResizerClient />

        <AdSlot slotId="image-resizer-mid" size="banner" />

        {/* Server-Rendered How-to-Use, Common Sizes Reference & FAQs */}
        <article className="mx-auto max-w-5xl space-y-12">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                How to resize an image without changing its format
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Pick dimensions, percentage, or a preset:
                  </strong>{" "}
                  Enter custom pixel values, choose a percentage scale, or click
                  a preset like <em>YouTube Thumbnail</em> or{" "}
                  <em>Teletalk 300×300</em>.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Choose a Fit Mode:
                  </strong>{" "}
                  Keep <em>Fit</em> for proportional resizing, or pick{" "}
                  <em>Smart Center Crop</em> for exact square/banner dimensions
                  without distortion.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Inspect &amp; download:
                  </strong>{" "}
                  Click <em>Compare</em> on any result to check Before &amp;
                  After sharpness, then download files individually or as a ZIP.
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Built for everyday photos, creators &amp; BD online portals
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Many government portals, banking KYC forms, e-commerce
                marketplaces, and social platforms reject images if the file
                extension changes or pixel dimensions don&apos;t match exactly.
                This resizer keeps every file&apos;s original format intact
                (<code className="text-xs">.jpg</code>,{" "}
                <code className="text-xs">.jpeg</code>,{" "}
                <code className="text-xs">.png</code>, or{" "}
                <code className="text-xs">.webp</code>) while using high-quality
                canvas resampling right on your own device.
              </p>
            </div>
          </section>

          {/* Common Dimensions Reference Table */}
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Popular image dimensions &amp; portal specifications
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[580px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="px-4 py-3">Preset</th>
                    <th className="px-4 py-3">Dimensions</th>
                    <th className="px-4 py-3">Aspect</th>
                    <th className="px-4 py-3">Typical Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {PRESET_REFERENCE.map((row) => (
                    <tr key={row.nameEn}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {row.nameEn}
                        </div>
                        <div className="font-bangla text-xs text-slate-500 dark:text-slate-400">
                          {row.nameBn}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {row.size}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                        {row.ratio}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {row.use}
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

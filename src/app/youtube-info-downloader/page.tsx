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
import { YouTubeResourceClient } from "@/components/calculators/YouTubeResourceClient";
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

const SLUG = "youtube-info-downloader";
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title:
    "YouTube Info & Thumbnail Downloader — HD Thumbnails, Subtitles, Tags & Embeds",
  description:
    "Extract HD thumbnails (JPG & WebP), SRT/VTT/TXT subtitles, video title, description, tags, chapters, embed code & public APIs from any YouTube link or ID.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "YouTube Info & Thumbnail Downloader — Tools BD",
    description:
      "Paste any YouTube URL, Shorts link, or Video ID to download all thumbnail sizes, export SRT/VTT subtitles, copy tags & descriptions, and build responsive embeds.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "YouTube Info & Thumbnail Downloader (HD Thumbnails, Subtitles & Tags)",
    description:
      "Free YouTube resource extractor: MaxRes HD thumbnails, searchable transcripts (.SRT/.VTT/.TXT), tags, chapters, responsive embeds, and public APIs.",
  },
};

const SUPPORTED_FORMATS = [
  {
    typeEn: "Standard Watch URL",
    typeBn: "সাধারণ ওয়াচ লিংক",
    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
  },
  {
    typeEn: "Short Share URL",
    typeBn: "শর্ট শেয়ার লিংক",
    example: "https://youtu.be/dQw4w9WgXcQ?t=1m30s",
  },
  {
    typeEn: "YouTube Shorts",
    typeBn: "ইউটিউব শর্টস",
    example: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  },
  {
    typeEn: "YouTube Live",
    typeBn: "ইউটিউব লাইভ",
    example: "https://www.youtube.com/live/dQw4w9WgXcQ",
  },
  {
    typeEn: "Embed URL or <iframe>",
    typeBn: "এমবেড লিংক বা কোড",
    example: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  },
  {
    typeEn: "YouTube Music / Mobile",
    typeBn: "ইউটিউব মিউজিক / মোবাইল",
    example: "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    typeEn: "Raw 11-Char Video ID",
    typeBn: "সরাসরি ১১-অক্ষরের আইডি",
    example: "dQw4w9WgXcQ",
  },
];

const THUMBNAIL_SPECS = [
  {
    variant: "maxresdefault.jpg / .webp",
    resolution: "1280 × 720 (HD)",
    aspect: "16:9",
    notesEn: "Highest quality available for HD/4K uploads (no black letterbox bars).",
    notesBn: "HD/4K ভিডিওর সর্বোচ্চ মানের থাম্বনেইল (কোনো কালো বর্ডার নেই)।",
  },
  {
    variant: "sddefault.jpg / .webp",
    resolution: "640 × 480 (SD)",
    aspect: "4:3",
    notesEn: "Standard definition backup when MaxRes is not uploaded.",
    notesBn: "MaxRes না থাকলে স্ট্যান্ডার্ড কোয়ালিটি ব্যাকআপ।",
  },
  {
    variant: "hqdefault.jpg / .webp",
    resolution: "480 × 360 (HQ)",
    aspect: "4:3",
    notesEn: "Guaranteed on almost every public YouTube video since 2005.",
    notesBn: "প্রায় সব পাবলিক ইউটিউব ভিডিওতেই নিশ্চিতভাবে পাওয়া যায়।",
  },
  {
    variant: "mqdefault.jpg",
    resolution: "320 × 180 (MQ)",
    aspect: "16:9",
    notesEn: "Clean widescreen medium thumbnail without letterbox bars.",
    notesBn: "কালো বর্ডার ছাড়া ওয়াইডস্ক্রিন মিডিয়াম থাম্বনেইল।",
  },
  {
    variant: "default.jpg",
    resolution: "120 × 90",
    aspect: "4:3",
    notesEn: "Compact thumbnail used in playlists and small embeds.",
    notesBn: "প্লেলিস্ট ও ছোট প্রিভিউর জন্য কম্প্যাক্ট থাম্বনেইল।",
  },
  {
    variant: "0.jpg, 1.jpg, 2.jpg, 3.jpg",
    resolution: "480×360 / 120×90",
    aspect: "4:3",
    notesEn: "Auto-generated player cover and start/middle/end storyboard frames.",
    notesBn: "ইউটিউবের অটো-জেনারেটেড শুরু, মাঝামাঝি ও শেষের ফ্রেম।",
  },
];

const FAQS: FaqItem[] = [
  {
    questionEn: "What YouTube URL formats or IDs can I paste here?",
    answerEn:
      "You can paste any public YouTube watch link, youtu.be short link, YouTube Shorts URL, Live stream URL, YouTube Music link, mobile m.youtube.com link, thumbnail CDN link, full <iframe> embed HTML snippet, or simply the 11-character Video ID. Start timestamps (t= or start=) are automatically detected too.",
    questionBn: "এখানে কী ধরনের ইউটিউব লিংক বা আইডি ব্যবহার করা যাবে?",
    answerBn:
      "সাধারণ ওয়াচ লিংক, youtu.be শর্ট লিংক, ইউটিউব শর্টস, লাইভ, ইউটিউব মিউজিক, এমবেড কোড, থাম্বনেইল লিংক অথবা সরাসরি ১১-অক্ষরের ভিডিও আইডি—সবকিছুই এখানে কাজ করে।",
  },
  {
    questionEn: "Why is Max Resolution (1280×720) thumbnail sometimes marked Unavailable?",
    answerEn:
      "YouTube only generates maxresdefault.jpg when the video was uploaded in 720p HD or higher and/or has a custom high-resolution thumbnail. Older 360p/480p videos only have hqdefault (480×360) and mqdefault (320×180). Our tool checks every resolution live and automatically highlights the highest available version.",
    questionBn: "কিছু ভিডিওতে Max Resolution (1280×720) থাম্বনেইল Unavailable দেখায় কেন?",
    answerBn:
      "ভিডিওটি ৭২০পি এইচডি বা তার বেশি মানের না হলে কিংবা কাস্টম এইচডি থাম্বনেইল না থাকলে ইউটিউব maxresdefault তৈরি করে না। আমাদের টুল প্রতিটি সাইজ যাচাই করে সর্বোচ্চ উপলব্ধ মানটি স্বয়ংক্রিয়ভাবে দেখিয়ে দেয়।",
  },
  {
    questionEn: "Can I download YouTube subtitles in SRT, VTT, and plain text?",
    answerEn:
      "Yes. Open the Subtitles & Transcript tab to choose any publicly available manual or auto-generated caption track (including English and Bangla when available), search keywords inside the transcript, copy plain or timestamped text, and download ready-to-use .SRT, .VTT, or .TXT files.",
    questionBn: "ইউটিউব সাবটাইটেল কি SRT, VTT ও টেক্সট ফরম্যাটে ডাউনলোড করা যাবে?",
    answerBn:
      "হ্যাঁ। Subtitles & Transcript ট্যাবে গিয়ে যেকোনো পাবলিক সাবটাইটেল ভাষা বেছে নিন, ভেতরের লেখা সার্চ করুন এবং এক ক্লিকে .SRT, .VTT বা .TXT ফাইল ডাউনলোড করুন।",
  },
  {
    questionEn: "What public YouTube APIs and endpoints are included?",
    answerEn:
      "Every lookup provides direct links to YouTube's official public oEmbed JSON/XML endpoint, privacy-enhanced youtube-nocookie.com embed URL, Channel Atom/RSS XML feed (when Channel ID is present), all i.ytimg.com CDN thumbnail URLs, plus a clean downloadable JSON export of all extracted metadata.",
    questionBn: "এখানে ইউটিউবের কোন কোন পাবলিক এপিআই ও লিংক পাওয়া যায়?",
    answerBn:
      "প্রতিটি ভিডিওর জন্য ইউটিউবের অফিসিয়াল oEmbed JSON এপিআই, youtube-nocookie.com এমবেড লিংক, চ্যানেল RSS ফিড XML, সব থাম্বনেইল CDN লিংক এবং সম্পূর্ণ JSON ফাইল ডাউনলোডের সুবিধা রয়েছে।",
  },
  {
    questionEn: "Does this tool work on private or members-only YouTube videos?",
    answerEn:
      "No. In accordance with YouTube's privacy rules, only public and unlisted videos whose metadata is publicly reachable can be inspected. Private, deleted, or age/member-restricted videos will not expose descriptions or subtitles.",
    questionBn: "প্রাইভেট বা মেম্বার্স-অনলি ভিডিওর তথ্য কি এখান থেকে দেখা যাবে?",
    answerBn:
      "না। ইউটিউবের প্রাইভেসি নীতিমালা অনুযায়ী কেবল পাবলিক ও আনলিস্টেড ভিডিওর উন্মুক্ত তথ্যই দেখা যাবে। প্রাইভেট বা ডিলিট করা ভিডিওর তথ্য পাওয়া যাবে না।",
  },
  {
    questionEn: "Is it legal to download thumbnails and transcripts?",
    answerEn:
      "Thumbnails, titles, and captions belong to their respective creators. Downloading them for personal study, accessibility, note-taking, SEO research, blog embeds with attribution, or managing your own YouTube channel is common practice, but you should never re-upload someone else's copyrighted artwork as your own.",
    questionBn: "থাম্বনেইল ও সাবটাইটেল ব্যবহারের ক্ষেত্রে কপিরাইট নিয়ম কী?",
    answerBn:
      "থাম্বনেইল ও সাবটাইটেলের স্বত্ব মূল নির্মাতার। পড়াশোনা, নোট তৈরি, রিসার্চ, ক্রেডিটসহ ব্লগে এমবেড করা বা নিজের চ্যানেল পরিচালনার জন্য ব্যবহার করা নিরাপদ; তবে অনুমতি ছাড়া অন্যের থাম্বনেইল নিজের ভিডিওতে পুনঃব্যবহার করা উচিত নয়।",
  },
];

export default function YouTubeInfoDownloaderPage() {
  const related = getRelatedTools(SLUG);

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "YouTube Info & Thumbnail Downloader",
          description:
            "Extract HD thumbnails (JPG & WebP), SRT/VTT/TXT subtitles, video title, full description, tags, chapters, responsive embeds, and public YouTube API endpoints from any YouTube URL or Video ID.",
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
                YouTube Info &amp; Thumbnail Downloader
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                যেকোনো ইউটিউব লিংক বা আইডি থেকে এইচডি থাম্বনেইল, সাবটাইটেল, টাইটেল, বিবরণ, ট্যাগ ও এমবেড কোড
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              HD Thumbnails · Subtitles (.SRT/.VTT) · Tags · Embeds
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Supports Watch, Shorts, Live, Music &amp; Raw IDs
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              No signup or API key required
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Creator Studio Workspace */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <YouTubeResourceClient />

        <AdSlot slotId="youtube-info-downloader-mid" size="banner" />

        {/* Server-Rendered SEO Guide, Reference Tables & FAQs */}
        <article className="mx-auto max-w-5xl space-y-12">
          {/* Section 1: Overview + Worked Creator Workflow */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                All public YouTube video resources in one workspace
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Whether you are a YouTube creator auditing competitor SEO, a
                student extracting lecture transcripts for study notes, a blogger
                embedding a privacy-safe video player, or a developer testing
                YouTube&apos;s public oEmbed and RSS endpoints, this inspector
                gathers every publicly exposed asset from a single Video ID.
                Instead of switching across five separate sites for thumbnails,
                tags, chapters, and SRT subtitles, everything loads cleanly in
                one tabbed Creator Studio dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked workflow example (Creators, Students &amp; Bloggers)
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Paste any link:
                  </strong>{" "}
                  Drop a Shorts URL, watch link, or 11-character ID into the top
                  bar (or click <em>Paste</em>).
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Copy SEO metadata:
                  </strong>{" "}
                  Grab the exact title, full description, tags, hashtags, and
                  parsed chapter timestamps.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">
                    Download HD thumbnails &amp; subtitles:
                  </strong>{" "}
                  Save verified <code className="text-xs">maxresdefault.jpg</code>{" "}
                  or WebP files in one click, and export searchable transcripts
                  as <code className="text-xs">.SRT</code>,{" "}
                  <code className="text-xs">.VTT</code>, or{" "}
                  <code className="text-xs">.TXT</code>.
                </li>
              </ol>
            </div>
          </section>

          {/* Section 2: Thumbnail Resolutions Table */}
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              YouTube thumbnail resolutions &amp; formats reference
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              YouTube stores multiple image sizes and formats on its{" "}
              <code className="text-xs">i.ytimg.com</code> CDN for each video ID.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="px-4 py-3">Filename</th>
                    <th className="px-4 py-3">Resolution</th>
                    <th className="px-4 py-3">Ratio</th>
                    <th className="px-4 py-3">Best Use (EN &amp; BN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {THUMBNAIL_SPECS.map((spec) => (
                    <tr key={spec.variant}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {spec.variant}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-900 dark:text-white">
                        {spec.resolution}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                        {spec.aspect}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {spec.notesEn}
                        </div>
                        <div className="mt-0.5 font-bangla text-xs text-slate-500 dark:text-slate-400">
                          {spec.notesBn}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Supported URL Formats Table */}
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Supported YouTube URL &amp; video identity formats
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[540px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Example Input</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {SUPPORTED_FORMATS.map((row) => (
                    <tr key={row.typeEn}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {row.typeEn}
                        </div>
                        <div className="font-bangla text-xs text-slate-500 dark:text-slate-400">
                          {row.typeBn}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {row.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Bilingual FAQs */}
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

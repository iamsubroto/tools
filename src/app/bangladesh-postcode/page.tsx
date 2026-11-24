import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import rawPostcodes from "@/data/postcodes.json";
import { postcodesDatasetSchema } from "@/data/postcodes.schema";
import { siteConfig } from "@/config/site";
import { getRelatedTools, getToolBySlug } from "@/config/tools";
import { PostcodeFinderClient } from "@/components/calculators/PostcodeFinderClient";
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

const SLUG = "bangladesh-postcode";
const dataset = postcodesDatasetSchema.parse(rawPostcodes);
const tool = getToolBySlug(SLUG)!;

export const metadata: Metadata = {
  title: "Bangladesh Postcode Finder — All 64 Districts, Upazilas & Post Offices",
  description:
    "Find any Bangladesh 4-digit postal code by Zila, Upazila/Thana, or post office name in English and Bangla. Includes reverse lookup, copy address, and CSV export.",
  alternates: { canonical: `/${SLUG}` },
  openGraph: {
    title: "Bangladesh Postcode Finder (All 64 Districts & Upazilas) — Tools BD",
    description:
      "Search 1,347 official Bangladesh postcodes across all 8 divisions, 64 districts, and upazilas in English and Bangla with instant reverse postcode lookup.",
    url: `${siteConfig.url}/${SLUG}`,
    type: "website",
  },
  twitter: {
    title: "Bangladesh Postcode Finder — 64 Zilas & Upazilas (EN / BN)",
    description:
      "Search Bangladesh 4-digit postcodes by Zila, Upazila, post office name, or reverse lookup in English and Bangla.",
  },
};

const POSTAL_ZONES = [
  {
    prefix: "1000 – 1999",
    regionEn: "Dhaka Metro, Gazipur, Narayanganj, Munshiganj, Manikganj, Narsingdi & Tangail",
    regionBn: "ঢাকা মেট্রো, গাজীপুর, নারায়ণগঞ্জ, মুন্সীগঞ্জ, মানিকগঞ্জ, নরসিংদী ও টাঙ্গাইল",
  },
  {
    prefix: "2000 – 2499",
    regionEn: "Mymensingh, Jamalpur, Sherpur, Netrokona & Kishoreganj",
    regionBn: "ময়মনসিংহ, জামালপুর, শেরপুর, নেত্রকোনা ও কিশোরগঞ্জ",
  },
  {
    prefix: "3000 – 3999",
    regionEn: "Sylhet, Sunamganj, Moulvibazar, Habiganj, Brahmanbaria, Cumilla, Chandpur, Lakshmipur, Noakhali & Feni",
    regionBn: "সিলেট, সুনামগঞ্জ, মৌলভীবাজার, হবিগঞ্জ, ব্রাহ্মণবাড়িয়া, কুমিল্লা, চাঁদপুর, লক্ষ্মীপুর, নোয়াখালী ও ফেনী",
  },
  {
    prefix: "4000 – 4799",
    regionEn: "Chattogram, Cox's Bazar, Rangamati, Khagrachhari & Bandarban",
    regionBn: "চট্টগ্রাম, কক্সবাজার, রাঙ্গামাটি, খাগড়াছড়ি ও বান্দরবান",
  },
  {
    prefix: "5000 – 5999",
    regionEn: "Rangpur, Dinajpur, Thakurgaon, Panchagarh, Nilphamari, Lalmonirhat, Kurigram, Gaibandha, Bogura & Joypurhat",
    regionBn: "রংপুর, দিনাজপুর, ঠাকুরগাঁও, পঞ্চগড়, নীলফামারী, লালমনিরহাট, কুড়িগ্রাম, গাইবান্ধা, বগুড়া ও জয়পুরহাট",
  },
  {
    prefix: "6000 – 6799",
    regionEn: "Rajshahi, Chapai Nawabganj, Naogaon, Natore, Pabna & Sirajganj",
    regionBn: "রাজশাহী, চাঁপাইনবাবগঞ্জ, নওগাঁ, নাটোর, পাবনা ও সিরাজগঞ্জ",
  },
  {
    prefix: "7000 – 7999",
    regionEn: "Kushtia, Meherpur, Chuadanga, Jhenaidah, Jashore, Magura, Narail, Rajbari, Faridpur & Madaripur",
    regionBn: "কুষ্টিয়া, মেহেরপুর, চুয়াডাঙ্গা, ঝিনাইদহ, যশোর, মাগুরা, নড়াইল, রাজবাড়ী, ফরিদপুর ও মাদারীপুর",
  },
  {
    prefix: "8000 – 8799",
    regionEn: "Shariatpur, Gopalganj, Barishal, Bhola, Jhalokati, Pirojpur, Patuakhali & Barguna",
    regionBn: "শরীয়তপুর, গোপালগঞ্জ, বরিশাল, ভোলা, ঝালকাঠি, পিরোজপুর, পটুয়াখালী ও বরগুনা",
  },
  {
    prefix: "9000 – 9499",
    regionEn: "Khulna, Bagerhat & Satkhira",
    regionBn: "খুলনা, বাগেরহাট ও সাতক্ষীরা",
  },
];

const FAQS: FaqItem[] = [
  {
    questionEn: "How many digits is a Bangladesh postal code (ZIP code)?",
    answerEn:
      "Every official Bangladesh postal code is exactly 4 digits (ranging from 1000 for Dhaka GPO to 9499 in the southwestern Khulna region). Bangladesh uses the term 'Post Code' rather than ZIP code, though international forms asking for a ZIP or Postal Code accept the same 4-digit number.",
    questionBn: "বাংলাদেশের পোস্ট কোড (ZIP Code) কত অঙ্কের হয়?",
    answerBn:
      "বাংলাদেশের প্রতিটি অফিসিয়াল পোস্ট কোড ৪ অঙ্কের (ঢাকা জিপিও ১০০০ থেকে শুরু হয়ে খুলনা অঞ্চলের ৯৪৯৯ পর্যন্ত)। আন্তর্জাতিক ফর্মে ZIP Code বা Postal Code চাইলে এই ৪ অঙ্কের পোস্ট কোডই বসাতে হয়।",
  },
  {
    questionEn: "How do I find my postcode by Zila and Upazila?",
    answerEn:
      "Select your Zila (District) in Step 1 above—every postcode in that district loads immediately and Step 2 unlocks with all Upazilas/Thanas inside that Zila. Choose your Upazila from the dropdown or quick chips to narrow down to your nearest Sub-Office (SO), Upazila Post Office (UPO), or Town Sub-Office (TSO).",
    questionBn: "জেলা ও উপজেলা দিয়ে কীভাবে সঠিক পোস্ট কোড খুঁজব?",
    answerBn:
      "উপরের ১ নম্বর ঘরে প্রথমে আপনার জেলা (Zila) বাছাই করুন—সাথে সাথে সেই জেলার সব পোস্ট কোড দেখাবে এবং ২ নম্বর ঘরে উপজেলার তালিকা চলে আসবে। এরপর আপনার উপজেলা বা থানা বাছাই করলেই নির্দিষ্ট ডাকঘর ও পোস্ট কোড পেয়ে যাবেন।",
  },
  {
    questionEn: "What if my village Branch Post Office (BPO) is not listed separately?",
    answerEn:
      "Bangladesh Post assigns 4-digit postcodes at the Head Office (GPO/HO), Upazila Post Office (UPO), and Sub-Office (SO/TSO) level. Smaller rural Branch Post Offices (BPOs) share the 4-digit postcode of their parent Upazila or Sub-Office. Simply select your Zila and Upazila to use your parent Sub-Office's 4-digit code.",
    questionBn: "আমার গ্রামের শাখা ডাকঘর (BPO) আলাদাভাবে তালিকায় না থাকলে কোন কোড দেব?",
    answerBn:
      "বাংলাদেশ ডাক বিভাগ প্রধান ডাকঘর (GPO/HO), উপজেলা ডাকঘর (UPO) এবং সাব-অফিস (SO/TSO) পর্যায়ে ৪-অঙ্কের পোস্ট কোড নির্ধারণ করে। ছোট গ্রামীণ শাখা ডাকঘরগুলো তাদের মূল সাব-অফিস বা উপজেলা ডাকঘরের পোস্ট কোডই ব্যবহার করে।",
  },
  {
    questionEn: "Can I look up an area name from a 4-digit postcode?",
    answerEn:
      "Yes! Type any 4-digit code in English (like 1212 or 4000) or Bangla digits (like ১২১২ or ৪০০০) into the top search box. The reverse lookup spotlight card immediately shows the exact Post Office, Upazila/Thana, Zila, Division, postal zone, and sibling postcodes in the same Upazila.",
    questionBn: "শুধু ৪ অঙ্কের পোস্ট কোড জানা থাকলে কি এলাকার নাম বের করা যায়?",
    answerBn:
      "হ্যাঁ! উপরের সার্চ বক্সে যেকোনো ৪ অঙ্কের কোড ইংরেজি (যেমন 1212) বা বাংলায় (যেমন ১২১২) লিখলেই ডাকঘর, উপজেলা/থানা, জেলা, বিভাগ ও ডাক অঞ্চল সাথে সাথে দেখাবে।",
  },
  {
    questionEn: "Does this tool work with older district spellings like Chittagong, Comilla, Jessore, Bogra, or Barisal?",
    answerEn:
      "Yes. We display the official Bangladesh Government spellings (Chattogram, Cumilla, Jashore, Bogura, Barishal) while indexing both older and newer English and Bangla spellings so your search always matches instantly.",
    questionBn: "পুরনো বানান (যেমন Chittagong, Comilla, Jessore, Bogra) দিয়ে খুঁজলেও কি কাজ করবে?",
    answerBn:
      "হ্যাঁ, সরকারি নতুন বানান (Chattogram, Cumilla, Jashore, Bogura, Barishal) প্রদর্শনের পাশাপাশি পুরনো বানান ও বাংলা বানান—সবভাবেই সার্চ করা যাবে।",
  },
];

export default function BangladeshPostcodePage() {
  const related = getRelatedTools(SLUG);

  // Group districts by division for the server-rendered SEO reference table
  const divisionsWithDistricts = dataset.divisions.map((div) => ({
    ...div,
    districts: dataset.districts
      .filter((d) => d.divisionId === div.id)
      .sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
  }));

  return (
    <>
      <JsonLd
        data={buildWebApplicationSchema({
          name: "Bangladesh Postcode Finder",
          description:
            "Search all 1,347 official Bangladesh 4-digit postal codes by Division, Zila (64 districts), Upazila/Thana, or reverse postcode lookup in English and Bangla.",
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
                Bangladesh Postcode Finder
              </h1>
              <p className="mt-1 font-bangla text-[15px] text-slate-500 dark:text-slate-400">
                বাংলাদেশের ৬৪ জেলা, উপজেলা ও ডাকঘরের অফিসিয়াল পোস্ট কোড অনুসন্ধান
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 tabular-nums dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {dataset.meta.totalPostcodes.toLocaleString("en-US")} Postcodes ·{" "}
              {dataset.meta.totalDistricts} Zilas ·{" "}
              {dataset.meta.totalDivisions} Divisions
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Instant offline browser search
            </span>
            <a
              href={dataset.meta.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-1 font-medium text-slate-500 hover:text-emerald-700 dark:text-slate-400"
            >
              Source: {dataset.meta.officialSource}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Postcode Directory */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PostcodeFinderClient />

        <AdSlot slotId="bangladesh-postcode-mid" size="banner" />

        {/* Server-Rendered SEO Guide, Official Zone Table & 64-District Directory */}
        <article className="mx-auto max-w-5xl space-y-12">
          {/* Section 1: Understanding BD Postcodes + Worked Address Example */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                How Bangladesh&apos;s 4-digit postal code works
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Introduced by the Directorate of Posts on{" "}
                <strong className="text-slate-900 dark:text-white">
                  December 22, 1986
                </strong>
                , Bangladesh&apos;s postal code system assigns a unique 4-digit
                number to every General Post Office (GPO), Head Office (HO),
                Upazila Post Office (UPO), Sub-Office (SO), and Town Sub-Office
                (TSO). The <strong className="text-slate-900 dark:text-white">first digit</strong>{" "}
                identifies the regional sorting circle (for instance,{" "}
                <span className="tabular-nums font-semibold">1</span> for Dhaka,{" "}
                <span className="tabular-nums font-semibold">4</span> for
                Chattogram, <span className="tabular-nums font-semibold">6</span>{" "}
                for Rajshahi, and{" "}
                <span className="tabular-nums font-semibold">9</span> for Khulna),
                the <strong className="text-slate-900 dark:text-white">second digit</strong>{" "}
                narrows down the district or head office, and the last two digits
                pinpoint the local delivery sub-office.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Worked Bangladesh address example (e-Passport, NID &amp; Courier)
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                When filling out a Bangladesh e-Passport form, bank KYC, NID
                correction, or international courier parcel, write the House/Road
                or Village first, followed by the Post Office, Upazila/Thana,
                District, and the 4-digit Post Code:
              </p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                <p className="font-semibold">
                  Md. Arifur Rahman
                  <br />
                  House 14, Road 7, Block C, Gulshan Model Town
                  <br />
                  Gulshan, Dhaka - 1212, Bangladesh
                </p>
              </div>
              <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                Tip: Click &ldquo;Copy full address&rdquo; on any postcode card
                above to copy a clean formatted snippet in English or Bangla.
              </p>
            </div>
          </section>

          {/* Section 2: Regional Postal Code Ranges Table */}
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Bangladesh postal code zones by first digit
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Quick reference to identify which region of Bangladesh any 4-digit
              postal code belongs to.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[540px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="px-4 py-3">Code Range</th>
                    <th className="px-4 py-3">Covered Districts / Region (EN &amp; BN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {POSTAL_ZONES.map((zone) => (
                    <tr key={zone.prefix}>
                      <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {zone.prefix}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {zone.regionEn}
                        </div>
                        <div className="mt-0.5 font-bangla text-xs text-slate-500 dark:text-slate-400">
                          {zone.regionBn}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Complete 8-Division & 64-District Head Postcode Reference */}
          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              All 64 districts of Bangladesh — head postcode directory
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Official head office (GPO / Sadar) postcodes across all 8
              administrative divisions. Click any district above in the finder
              to explore every Upazila and Sub-Office inside that Zila.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {divisionsWithDistricts.map((div) => (
                <div
                  key={div.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {div.nameEn} Division{" "}
                      <span className="font-bangla font-normal text-slate-500 dark:text-slate-400">
                        ({div.nameBn})
                      </span>
                    </h3>
                    <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                      {div.districts.length} Zilas
                    </span>
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {div.districts.map((dist) => (
                      <li
                        key={dist.id}
                        className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1 dark:border-slate-800/60"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {dist.nameEn}{" "}
                          <span className="font-bangla text-slate-400">
                            ({dist.nameBn})
                          </span>
                        </span>
                        <span className="shrink-0 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {dist.headCode}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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

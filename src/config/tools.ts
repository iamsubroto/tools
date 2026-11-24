export type ToolCategory =
  | "finance"
  | "tax"
  | "property"
  | "utilities"
  | "education"
  | "text";

export type ToolStatus = "live" | "planned";

export type ToolIconKey =
  | "piggy-bank"
  | "receipt"
  | "wallet"
  | "landmark"
  | "vault"
  | "send"
  | "zap"
  | "ruler"
  | "gem"
  | "smartphone"
  | "file-text"
  | "tag"
  | "trending-up"
  | "calendar"
  | "camera"
  | "hand-coins"
  | "graduation-cap"
  | "languages"
  | "type"
  | "percent"
  | "arrow-left-right"
  | "heart-pulse"
  | "code"
  | "map-pin"
  | "play-square"
  | "image";

export interface ToolDefinition {
  slug: string;
  category: ToolCategory;
  phase: 1 | 2 | 3;
  status: ToolStatus;
  icon: ToolIconKey;
  titleEn: string;
  titleBn: string;
  shortDescEn: string;
  shortDescBn: string;
  keywords: string[];
  relatedSlugs: string[];
}

export interface CategoryDefinition {
  labelEn: string;
  labelBn: string;
  /** Full literal Tailwind classes (kept literal so Tailwind can detect them) */
  tileClass: string;
  dotClass: string;
}

export const CATEGORY_ORDER: ToolCategory[] = [
  "finance",
  "tax",
  "property",
  "utilities",
  "education",
  "text",
];

export const CATEGORIES: Record<ToolCategory, CategoryDefinition> = {
  finance: {
    labelEn: "Finance & Banking",
    labelBn: "ফাইন্যান্স ও ব্যাংকিং",
    tileClass:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
    dotClass: "bg-emerald-500",
  },
  tax: {
    labelEn: "Tax & Business",
    labelBn: "কর ও ব্যবসা",
    tileClass:
      "bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-400/20",
    dotClass: "bg-indigo-500",
  },
  property: {
    labelEn: "Property & Gold",
    labelBn: "জমি ও স্বর্ণ",
    tileClass:
      "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
    dotClass: "bg-amber-500",
  },
  utilities: {
    labelEn: "Daily Utilities",
    labelBn: "দৈনন্দিন টুলস",
    tileClass:
      "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20",
    dotClass: "bg-sky-500",
  },
  education: {
    labelEn: "Career & Student",
    labelBn: "চাকরি ও শিক্ষা",
    tileClass:
      "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20",
    dotClass: "bg-violet-500",
  },
  text: {
    labelEn: "Bangla & Text",
    labelBn: "বাংলা ও টেক্সট",
    tileClass:
      "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20",
    dotClass: "bg-rose-500",
  },
};

export const TOOLS: ToolDefinition[] = [
  // ── Phase 1 ─────────────────────────────────────────────
  {
    slug: "sanchayapatra-calculator",
    category: "finance",
    phase: 1,
    status: "live",
    icon: "piggy-bank",
    titleEn: "Sanchayapatra Calculator",
    titleBn: "সঞ্চয়পত্র ক্যালকুলেটর",
    shortDescEn:
      "Compare monthly, 3-month and maturity net profit after source tax across all 4 schemes.",
    shortDescBn:
      "৪টি সঞ্চয়পত্রের মাসিক, ৩-মাসিক ও মেয়াদান্তে উৎস কর বাদে নিট মুনাফা তুলনা করুন।",
    keywords: [
      "sanchayapatra",
      "sanchaypatra",
      "paribar",
      "pensioner",
      "savings certificate",
      "সঞ্চয়পত্র",
    ],
    relatedSlugs: [
      "dps-fdr-calculator",
      "bd-income-tax-calculator",
      "zakat-calculator-bd",
    ],
  },
  {
    slug: "bd-income-tax-calculator",
    category: "tax",
    phase: 1,
    status: "planned",
    icon: "receipt",
    titleEn: "Income Tax Calculator",
    titleBn: "আয়কর ক্যালকুলেটর",
    shortDescEn:
      "Latest NBR tax slabs, investment rebate and minimum tax for individuals.",
    shortDescBn: "সর্বশেষ এনবিআর কর স্ল্যাব, বিনিয়োগ রেয়াত ও ন্যূনতম কর।",
    keywords: ["income tax", "nbr", "aykor", "tax", "আয়কর"],
    relatedSlugs: ["bd-salary-calculator", "sanchayapatra-calculator"],
  },
  {
    slug: "bd-salary-calculator",
    category: "tax",
    phase: 1,
    status: "planned",
    icon: "wallet",
    titleEn: "Salary & Take-Home",
    titleBn: "বেতন ও টেক-হোম",
    shortDescEn:
      "Break down basic, house rent, PF, monthly TDS, bonus and gratuity.",
    shortDescBn: "মূল বেতন, বাড়ি ভাড়া, পিএফ, মাসিক টিডিএস ও গ্র্যাচুইটি।",
    keywords: ["salary", "beton", "take home", "gratuity", "বেতন"],
    relatedSlugs: ["bd-income-tax-calculator", "emi-loan-calculator"],
  },
  {
    slug: "emi-loan-calculator",
    category: "finance",
    phase: 1,
    status: "live",
    icon: "landmark",
    titleEn: "EMI & Bank Loan",
    titleBn: "ইএমআই ও ব্যাংক লোন",
    shortDescEn:
      "Home, car and personal loan EMI with amortization and prepayment savings.",
    shortDescBn: "হোম, কার ও পার্সোনাল লোনের কিস্তি ও প্রিপেমেন্ট সাশ্রয়।",
    keywords: ["emi", "loan", "home loan", "kisti", "লোন", "কিস্তি"],
    relatedSlugs: ["dps-fdr-calculator", "bd-salary-calculator"],
  },
  {
    slug: "dps-fdr-calculator",
    category: "finance",
    phase: 1,
    status: "planned",
    icon: "vault",
    titleEn: "DPS & FDR Maturity",
    titleBn: "ডিপিএস ও এফডিআর",
    shortDescEn:
      "Net maturity after 10%/15% source tax and bank excise duty.",
    shortDescBn: "উৎস কর ও আবগারি শুল্ক বাদে নিট মেয়াদপূর্তি মূল্য।",
    keywords: ["dps", "fdr", "fixed deposit", "excise duty", "ডিপিএস"],
    relatedSlugs: ["sanchayapatra-calculator", "emi-loan-calculator"],
  },
  {
    slug: "remittance-freelancer-calculator",
    category: "finance",
    phase: 1,
    status: "planned",
    icon: "send",
    titleEn: "Remittance & Freelancer",
    titleBn: "রেমিট্যান্স ও ফ্রিল্যান্সার",
    shortDescEn:
      "Net BDT received with the 2.5% govt incentive, FX rate and fees.",
    shortDescBn: "২.৫% প্রণোদনা, বিনিময় হার ও ফি বাদে নিট টাকা।",
    keywords: ["remittance", "freelancer", "usd to bdt", "payoneer", "রেমিট্যান্স"],
    relatedSlugs: ["sanchayapatra-calculator", "bd-income-tax-calculator"],
  },
  // ── Phase 2 ─────────────────────────────────────────────
  {
    slug: "bangladesh-postcode",
    category: "utilities",
    phase: 1,
    status: "live",
    icon: "map-pin",
    titleEn: "Bangladesh Postcode Finder",
    titleBn: "বাংলাদেশ পোস্ট কোড খুঁজুন",
    shortDescEn:
      "Search all 64 districts, upazilas, post offices and 4-digit postcodes in English & Bangla.",
    shortDescBn:
      "৬৪ জেলা, উপজেলা, ডাকঘর ও ৪-অঙ্কের পোস্ট কোড সহজেই খুঁজুন (বাংলা ও ইংরেজি)।",
    keywords: [
      "postcode",
      "postal code",
      "zip code",
      "post office",
      "bdpost",
      "bangladesh postcode",
      "zila",
      "upazila",
      "thana",
      "dhaka postcode",
      "পোস্ট কোড",
      "ডাকঘর",
      "জেলা",
      "উপজেলা",
    ],
    relatedSlugs: [
      "age-calculator",
      "word-character-counter",
      "percentage-calculator",
    ],
  },
  {
    slug: "youtube-info-downloader",
    category: "utilities",
    phase: 1,
    status: "live",
    icon: "play-square",
    titleEn: "YouTube Info & Thumbnail Downloader",
    titleBn: "ইউটিউব ইনফো ও থাম্বনেইল ডাউনলোডার",
    shortDescEn:
      "Extract HD thumbnails, subtitles/SRT transcripts, title, description, tags, chapters, embed code & public APIs from any YouTube link or ID.",
    shortDescBn:
      "যেকোনো ইউটিউব লিংক বা আইডি থেকে এইচডি থাম্বনেইল, সাবটাইটেল/এসআরটি, টাইটেল, বিবরণ, ট্যাগ ও এমবেড কোড বের করুন।",
    keywords: [
      "youtube",
      "youtube thumbnail",
      "youtube thumbnail downloader",
      "youtube subtitle",
      "youtube transcript",
      "youtube tags",
      "youtube metadata",
      "youtube info",
      "youtube embed",
      "srt download",
      "yt thumbnail",
      "ইউটিউব",
      "থাম্বনেইল",
      "সাবটাইটেল",
      "ট্রান্সক্রিপ্ট",
    ],
    relatedSlugs: [
      "word-character-counter",
      "bangladesh-postcode",
      "percentage-calculator",
    ],
  },
  {
    slug: "image-to-webp",
    category: "utilities",
    phase: 1,
    status: "live",
    icon: "image",
    titleEn: "Image to WebP Converter",
    titleBn: "ইমেজ টু ওয়েবপি কনভার্টার",
    shortDescEn:
      "Convert JPG & PNG images to WebP locally in your browser with batch resize, quality control, transparency support & ZIP download.",
    shortDescBn:
      "কোনো আপলোড ছাড়াই ব্রাউজারে JPG ও PNG ছবিকে WebP-তে রূপান্তর, রিসাইজ ও একসাথে ZIP ডাউনলোড করুন।",
    keywords: [
      "webp",
      "image to webp",
      "jpg to webp",
      "jpeg to webp",
      "png to webp",
      "webp converter",
      "image converter",
      "image resize",
      "image compress",
      "ইমেজ কনভার্টার",
      "ওয়েবপি",
      "ছবি রিসাইজ",
    ],
    relatedSlugs: [
      "youtube-info-downloader",
      "word-character-counter",
      "bangladesh-postcode",
    ],
  },
  {
    slug: "electricity-bill-calculator-bd",
    category: "utilities",
    phase: 2,
    status: "planned",
    icon: "zap",
    titleEn: "Electricity Bill",
    titleBn: "বিদ্যুৎ বিল",
    shortDescEn:
      "BERC slab-wise bill for DESCO, DPDC, NESCO and Palli Bidyut.",
    shortDescBn: "ডেসকো, ডিপিডিসি, নেসকো ও পল্লী বিদ্যুতের স্ল্যাবভিত্তিক বিল।",
    keywords: ["electricity", "biddut bill", "desco", "dpdc", "বিদ্যুৎ"],
    relatedSlugs: ["mfs-charge-calculator-bd", "percentage-calculator"],
  },
  {
    slug: "land-measurement-calculator-bd",
    category: "property",
    phase: 2,
    status: "planned",
    icon: "ruler",
    titleEn: "Land Measurement",
    titleBn: "জমি পরিমাপ",
    shortDescEn:
      "Shotok, katha, bigha, acre conversions and registration cost.",
    shortDescBn: "শতক, কাঠা, বিঘা, একর রূপান্তর ও রেজিস্ট্রেশন খরচ।",
    keywords: ["land", "jomi", "shotok", "katha", "bigha", "জমি"],
    relatedSlugs: ["gold-vori-calculator-bd", "unit-converter"],
  },
  {
    slug: "gold-vori-calculator-bd",
    category: "property",
    phase: 2,
    status: "planned",
    icon: "gem",
    titleEn: "Gold Price (Vori)",
    titleBn: "স্বর্ণের দাম (ভরি)",
    shortDescEn:
      "Vori, ana, rotti conversion with VAT, making charge and exchange.",
    shortDescBn: "ভরি, আনা, রতি রূপান্তর, ভ্যাট ও মজুরি সহ মোট দাম।",
    keywords: ["gold", "vori", "sona", "bajus", "স্বর্ণ", "ভরি"],
    relatedSlugs: ["zakat-calculator-bd", "land-measurement-calculator-bd"],
  },
  {
    slug: "mfs-charge-calculator-bd",
    category: "utilities",
    phase: 2,
    status: "planned",
    icon: "smartphone",
    titleEn: "bKash, Nagad & Rocket Charge",
    titleBn: "বিকাশ, নগদ ও রকেট চার্জ",
    shortDescEn:
      "Cash-out and send money charges with reverse calculation.",
    shortDescBn: "ক্যাশ-আউট ও সেন্ড মানি চার্জ, রিভার্স হিসাব সহ।",
    keywords: ["bkash", "nagad", "rocket", "cash out", "বিকাশ"],
    relatedSlugs: ["remittance-freelancer-calculator", "percentage-calculator"],
  },
  {
    slug: "vat-ait-calculator-bd",
    category: "tax",
    phase: 2,
    status: "live",
    icon: "file-text",
    titleEn: "VAT, VDS & AIT",
    titleBn: "ভ্যাট, ভিডিএস ও এআইটি",
    shortDescEn:
      "Inclusive and exclusive VAT with VDS and AIT for invoices.",
    shortDescBn: "ইনভয়েসের জন্য ভ্যাট, ভিডিএস ও এআইটি হিসাব।",
    keywords: ["vat", "vds", "ait", "invoice", "ভ্যাট"],
    relatedSlugs: ["discount-margin-calculator", "bd-income-tax-calculator"],
  },
  {
    slug: "discount-margin-calculator",
    category: "tax",
    phase: 2,
    status: "live",
    icon: "tag",
    titleEn: "Discount & Profit Margin",
    titleBn: "ডিসকাউন্ট ও লাভের মার্জিন",
    shortDescEn:
      "F-commerce order profit after COD, delivery, ads and discounts.",
    shortDescBn: "ডেলিভারি, সিওডি ও বিজ্ঞাপন খরচ বাদে প্রকৃত লাভ।",
    keywords: ["discount", "margin", "profit", "f-commerce", "ছাড়"],
    relatedSlugs: ["vat-ait-calculator-bd", "percentage-calculator"],
  },
  {
    slug: "sip-calculator",
    category: "finance",
    phase: 2,
    status: "live",
    icon: "trending-up",
    titleEn: "SIP & Compound Interest",
    titleBn: "এসআইপি ও চক্রবৃদ্ধি মুনাফা",
    shortDescEn:
      "Monthly investment growth with step-up and inflation adjustment.",
    shortDescBn: "স্টেপ-আপ ও মূল্যস্ফীতি সমন্বয়সহ মাসিক বিনিয়োগ প্রবৃদ্ধি।",
    keywords: ["sip", "compound interest", "mutual fund", "investment"],
    relatedSlugs: ["dps-fdr-calculator", "sanchayapatra-calculator"],
  },
  // ── Phase 3 ─────────────────────────────────────────────
  {
    slug: "age-calculator",
    category: "education",
    phase: 3,
    status: "live",
    icon: "calendar",
    titleEn: "Age & Govt Job Eligibility",
    titleBn: "বয়স ও সরকারি চাকরির যোগ্যতা",
    shortDescEn:
      "Exact age on any circular date with the 32-year BCS limit check.",
    shortDescBn: "সার্কুলারের তারিখে সঠিক বয়স ও ৩২ বছরের বিসিএস সীমা যাচাই।",
    keywords: ["age", "boyosh", "bcs", "govt job", "বয়স"],
    relatedSlugs: ["bd-job-photo-signature-resizer", "gpa-cgpa-calculator-bd"],
  },
  {
    slug: "bd-job-photo-signature-resizer",
    category: "education",
    phase: 3,
    status: "planned",
    icon: "camera",
    titleEn: "Job Photo & Signature Resizer",
    titleBn: "চাকরির ছবি ও স্বাক্ষর রিসাইজার",
    shortDescEn:
      "Teletalk/BCS photo 300×300 and signature 300×80 under KB limits.",
    shortDescBn: "টেলিটক/বিসিএস ছবি ৩০০×৩০০ ও স্বাক্ষর ৩০০×৮০ সাইজে।",
    keywords: ["photo resize", "signature", "teletalk", "bcs", "ছবি"],
    relatedSlugs: ["age-calculator", "gpa-cgpa-calculator-bd"],
  },
  {
    slug: "zakat-calculator-bd",
    category: "finance",
    phase: 3,
    status: "planned",
    icon: "hand-coins",
    titleEn: "Zakat Calculator",
    titleBn: "যাকাত ক্যালকুলেটর",
    shortDescEn:
      "Gold and silver nisab with cash, savings, gold and liabilities.",
    shortDescBn: "নিসাব, নগদ, সঞ্চয়, স্বর্ণ ও দায় হিসাব করে যাকাত।",
    keywords: ["zakat", "jakat", "nisab", "যাকাত"],
    relatedSlugs: ["gold-vori-calculator-bd", "sanchayapatra-calculator"],
  },
  {
    slug: "gpa-cgpa-calculator-bd",
    category: "education",
    phase: 3,
    status: "planned",
    icon: "graduation-cap",
    titleEn: "GPA & CGPA Calculator",
    titleBn: "জিপিএ ও সিজিপিএ",
    shortDescEn:
      "SSC/HSC GPA with 4th subject rule and university CGPA.",
    shortDescBn: "৪র্থ বিষয়সহ এসএসসি/এইচএসসি জিপিএ ও বিশ্ববিদ্যালয় সিজিপিএ।",
    keywords: ["gpa", "cgpa", "ssc", "hsc", "result", "জিপিএ"],
    relatedSlugs: ["age-calculator", "percentage-calculator"],
  },
  {
    slug: "bijoy-to-unicode-converter",
    category: "text",
    phase: 3,
    status: "planned",
    icon: "languages",
    titleEn: "Bijoy ⇄ Unicode Converter",
    titleBn: "বিজয় ⇄ ইউনিকোড কনভার্টার",
    shortDescEn: "Convert SutonnyMJ Bijoy text to Unicode and back.",
    shortDescBn: "সুতন্নিএমজে বিজয় লেখা ইউনিকোডে ও উল্টোভাবে রূপান্তর।",
    keywords: ["bijoy", "unicode", "sutonny", "avro", "বিজয়"],
    relatedSlugs: ["word-character-counter", "code-beautifier"],
  },
  {
    slug: "word-character-counter",
    category: "text",
    phase: 3,
    status: "live",
    icon: "type",
    titleEn: "Word & Character Counter",
    titleBn: "শব্দ ও অক্ষর গণনা",
    shortDescEn: "Count Bangla and English words, characters and SMS parts.",
    shortDescBn: "বাংলা ও ইংরেজি শব্দ, অক্ষর ও এসএমএস সংখ্যা গণনা।",
    keywords: ["word count", "character count", "sms", "শব্দ"],
    relatedSlugs: ["bijoy-to-unicode-converter", "code-beautifier"],
  },
  {
    slug: "percentage-calculator",
    category: "utilities",
    phase: 3,
    status: "live",
    icon: "percent",
    titleEn: "Percentage Calculator",
    titleBn: "শতাংশ ক্যালকুলেটর",
    shortDescEn: "Percent of, change, increase and decrease with BD presets.",
    shortDescBn: "শতকরা হার, বৃদ্ধি ও হ্রাস দ্রুত হিসাব।",
    keywords: ["percentage", "percent", "shotangsho", "শতাংশ"],
    relatedSlugs: ["discount-margin-calculator", "gpa-cgpa-calculator-bd"],
  },
  {
    slug: "unit-converter",
    category: "utilities",
    phase: 3,
    status: "planned",
    icon: "arrow-left-right",
    titleEn: "Unit Converter",
    titleBn: "একক রূপান্তর",
    shortDescEn: "Length, area, weight and local BD units in one place.",
    shortDescBn: "দৈর্ঘ্য, ক্ষেত্রফল, ওজন ও দেশীয় একক রূপান্তর।",
    keywords: ["unit converter", "convert", "maund", "seer", "একক"],
    relatedSlugs: ["land-measurement-calculator-bd", "percentage-calculator"],
  },
  {
    slug: "bmi-calculator",
    category: "utilities",
    phase: 3,
    status: "live",
    icon: "heart-pulse",
    titleEn: "BMI Calculator",
    titleBn: "বিএমআই ক্যালকুলেটর",
    shortDescEn: "Body mass index in kg/cm or feet/inch (informational only).",
    shortDescBn: "কেজি/সেমি বা ফুট/ইঞ্চিতে বিএমআই (শুধু তথ্যের জন্য)।",
    keywords: ["bmi", "weight", "height", "ওজন"],
    relatedSlugs: ["age-calculator", "unit-converter"],
  },
  {
    slug: "code-beautifier",
    category: "text",
    phase: 3,
    status: "planned",
    icon: "code",
    titleEn: "HTML & JS Beautifier",
    titleBn: "এইচটিএমএল ও জেএস বিউটিফায়ার",
    shortDescEn: "Format messy HTML and JavaScript right in your browser.",
    shortDescBn: "ব্রাউজারেই এলোমেলো এইচটিএমএল ও জাভাস্ক্রিপ্ট সাজান।",
    keywords: ["html beautifier", "javascript formatter", "code format"],
    relatedSlugs: ["word-character-counter", "bijoy-to-unicode-converter"],
  },
];

export function getLiveTools(): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.status === "live");
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

export function getRelatedTools(slug: string): ToolDefinition[] {
  const tool = getToolBySlug(slug);
  if (!tool) return [];
  return tool.relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is ToolDefinition => t !== undefined);
}

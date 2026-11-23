export type ToolCategory =
  | "finance"
  | "tax"
  | "property"
  | "utilities"
  | "career";

export type ToolStatus = "live" | "planned";

export interface ToolDefinition {
  slug: string;
  category: ToolCategory;
  phase: 1 | 2 | 3;
  status: ToolStatus;
  titleEn: string;
  titleBn: string;
  shortDescEn: string;
  shortDescBn: string;
  keywords: string[];
  relatedSlugs: string[];
}

export const TOOLS: ToolDefinition[] = [
  {
    slug: "sanchayapatra-calculator",
    category: "finance",
    phase: 1,
    status: "live",
    titleEn: "Sanchayapatra Calculator",
    titleBn: "সঞ্চয়পত্র মুনাফা ক্যালকুলেটর",
    shortDescEn:
      "Compare monthly, 3-month, and maturity net profit after source tax across all 4 Bangladesh Sanchayapatra schemes.",
    shortDescBn:
      "বাংলাদেশের ৪টি সঞ্চয়পত্রের মাসিক, ৩-মাসিক ও মেয়াদান্তে উৎস কর বাদে নিট মুনাফা একসাথে হিসাব ও তুলনা করুন।",
    keywords: [
      "sanchayapatra",
      "sanchaypatra",
      "paribar sanchayapatra",
      "pensioner sanchayapatra",
      "3 month sanchayapatra",
      "5 year sanchayapatra",
      "bangladesh savings certificate",
      "সঞ্চয়পত্র",
      "পরিবার সঞ্চয়পত্র",
      "পেনশনার সঞ্চয়পত্র",
    ],
    relatedSlugs: [
      "dps-fdr-calculator",
      "bd-income-tax-calculator",
      "emi-loan-calculator",
    ],
  },
  {
    slug: "bd-income-tax-calculator",
    category: "tax",
    phase: 1,
    status: "planned",
    titleEn: "BD Income Tax Calculator",
    titleBn: "বাংলাদেশ আয়কর ক্যালকুলেটর",
    shortDescEn:
      "Calculate FY 2025-26 / 2026-27 NBR income tax slabs, investment rebate, and minimum tax.",
    shortDescBn:
      "সর্বশেষ এনবিআর কর স্ল্যাব, বিনিয়োগ রেয়াত ও ন্যূনতম আয়কর হিসাব করুন।",
    keywords: ["income tax", "nbr", "aykor", "tax bd", "আয়কর"],
    relatedSlugs: ["bd-salary-calculator", "sanchayapatra-calculator"],
  },
  {
    slug: "bd-salary-calculator",
    category: "tax",
    phase: 1,
    status: "planned",
    titleEn: "BD Salary & Take-Home Calculator",
    titleBn: "বেতন ও টেক-হোম ক্যালকুলেটর",
    shortDescEn:
      "Break down Basic, House Rent, PF, monthly TDS, festival bonus, and gratuity.",
    shortDescBn:
      "মূল বেতন, বাড়ি ভাড়া, পিএফ, মাসিক টিডিএস ও গ্র্যাচুইটি হিসাব করুন।",
    keywords: ["salary", "beton", "take home", "tds", "gratuity", "বেতন"],
    relatedSlugs: ["bd-income-tax-calculator", "emi-loan-calculator"],
  },
  {
    slug: "emi-loan-calculator",
    category: "finance",
    phase: 1,
    status: "planned",
    titleEn: "EMI & Bank Loan Calculator (BD)",
    titleBn: "ইএমআই ও ব্যাংক লোন ক্যালকুলেটর",
    shortDescEn:
      "Calculate Home, Car & Personal loan EMI in BDT Lakh/Crore with prepayment savings.",
    shortDescBn:
      "হোম, কার ও পার্সোনাল লোনের মাসিক কিস্তি ও প্রিপেমেন্ট সাশ্রয় হিসাব করুন।",
    keywords: ["emi", "loan", "home loan", "bank loan", "কিস্তি", "লোন"],
    relatedSlugs: ["sanchayapatra-calculator", "dps-fdr-calculator"],
  },
  {
    slug: "dps-fdr-calculator",
    category: "finance",
    phase: 1,
    status: "planned",
    titleEn: "DPS & FDR Maturity Calculator (BD)",
    titleBn: "ডিপিএস ও এফডিআর ক্যালকুলেটর",
    shortDescEn:
      "Compute net DPS & FDR maturity after 10%/15% PSR source tax and BD bank excise duty.",
    shortDescBn:
      "উৎস কর ও আবগারি শুল্ক বাদে ডিপিএস ও এফডিআর এর নিট মেয়াদপূর্তি হিসাব করুন।",
    keywords: ["dps", "fdr", "fixed deposit", "excise duty", "ডিপিএস", "এফডিআর"],
    relatedSlugs: ["sanchayapatra-calculator", "emi-loan-calculator"],
  },
  {
    slug: "remittance-freelancer-calculator",
    category: "finance",
    phase: 1,
    status: "planned",
    titleEn: "Remittance (2.5% Incentive) & Freelancer Calculator",
    titleBn: "রেমিট্যান্স (২.৫% প্রণোদনা) ও ফ্রিল্যান্সার ক্যালকুলেটর",
    shortDescEn:
      "Compare net BDT received with the 2.5% govt incentive, FX rates, and transfer fees.",
    shortDescBn:
      "২.৫% সরকারি প্রণোদনা ও ব্যাংক/পেওনিয়ার/ওয়াইজ ফি বাদে নিট টাকা হিসাব করুন।",
    keywords: ["remittance", "freelancer", "usd to bdt", "2.5%", "রেমিট্যান্স"],
    relatedSlugs: ["sanchayapatra-calculator", "bd-income-tax-calculator"],
  },
];

export function getLiveTools(): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.status === "live");
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

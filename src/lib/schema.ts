import { siteConfig } from "@/config/site";

export interface FaqItem {
  questionEn: string;
  answerEn: string;
  questionBn: string;
  answerBn: string;
}

export function buildWebApplicationSchema(params: {
  name: string;
  description: string;
  slug: string;
  applicationCategory?: "FinanceApplication" | "UtilitiesApplication";
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: params.name,
    description: params.description,
    url: `${siteConfig.url}/${params.slug}`,
    applicationCategory: params.applicationCategory ?? "FinanceApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    inLanguage: ["en", "bn"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BDT",
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function buildFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.questionEn,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answerEn,
      },
    })),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}

export function resolveSiteUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercelProd = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) {
    return `https://${vercelProd.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  const vercelPreview = env.VERCEL_URL?.trim();
  if (vercelPreview) {
    return `https://${vercelPreview.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

export const isPreviewDeployment = process.env.VERCEL_ENV === "preview";

export const siteConfig = {
  name: "Tools BD",
  nameBn: "টুলস বিডি",
  tagline: "Free, Accurate Calculators & Daily Utilities for Bangladesh & NRBs",
  taglineBn: "বাংলাদেশ ও প্রবাসীদের জন্য ফ্রি ও নির্ভুল ক্যালকুলেটর এবং দৈনন্দিন টুলস",
  url: resolveSiteUrl(),
  email: "contact@toolsbd.com",
  defaultLocale: "en" as const,
};

import Link from "next/link";
import { Separator, Text } from "@radix-ui/themes";
import { siteConfig } from "@/config/site";

export function Footer() {
  const year = 2026;

  return (
    <footer className="print:hidden mt-16 border-t border-[var(--gray-5)] bg-[var(--gray-2)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Text as="p" size="4" weight="bold">
              {siteConfig.name}
            </Text>
            <Text as="p" size="2" color="gray" className="max-w-sm leading-relaxed">
              {siteConfig.tagline}. 100% browser-side calculations with zero
              signup and zero personal data collection.
            </Text>
          </div>

          <div className="space-y-2">
            <Text as="p" size="2" weight="bold" color="gray">
              LIVE TOOLS
            </Text>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href="/sanchayapatra-calculator"
                  className="text-[var(--gray-11)] hover:text-[var(--accent-11)]"
                >
                  Sanchayapatra Calculator (All 4 Schemes)
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Text as="p" size="2" weight="bold" color="gray">
              ACCURACY & DISCLAIMER
            </Text>
            <Text as="p" size="1" color="gray" className="leading-relaxed">
              Rates are sourced from official Bangladesh authorities (NSD, NBR,
              BERC, Bangladesh Bank) and updated periodically. Figures are for
              informational planning—always verify final figures with your bank
              or National Savings Bureau before investing.
            </Text>
          </div>
        </div>

        <Separator size="4" my="6" />

        <div className="flex flex-col items-start justify-between gap-2 text-xs text-[var(--gray-10)] sm:flex-row sm:items-center">
          <span>
            © {year} {siteConfig.name}. Free public utility for Bangladesh &
            NRBs.
          </span>
          <span>100% Client-Side • Privacy First</span>
        </div>
      </div>
    </footer>
  );
}

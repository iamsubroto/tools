"use client";

import Link from "next/link";
import { Button, Flex, SegmentedControl, Text } from "@radix-ui/themes";
import { Calculator, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useThemeMode } from "./ThemeProvider";
import { siteConfig } from "@/config/site";

export function Header() {
  const { locale, setLocale } = useLanguage();
  const { appearance, toggleAppearance } = useThemeMode();

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-[var(--gray-5)] bg-[var(--color-background)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[var(--gray-12)] no-underline"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-3)] bg-[var(--accent-9)] text-white">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <Text size="4" weight="bold">
              {locale === "bn" ? siteConfig.nameBn : siteConfig.name}
            </Text>
            <Text size="1" color="gray" className="hidden sm:inline">
              {locale === "bn"
                ? "বাংলাদেশ ক্যালকুলেটর ও টুলস"
                : "Bangladesh Calculators & Utilities"}
            </Text>
          </span>
        </Link>

        <Flex align="center" gap="2">
          <nav
            aria-label="Primary"
            className="hidden items-center gap-4 pr-2 text-sm md:flex"
          >
            <Link
              href="/sanchayapatra-calculator"
              className="text-[var(--gray-11)] transition-colors hover:text-[var(--accent-11)]"
            >
              {locale === "bn" ? "সঞ্চয়পত্র" : "Sanchayapatra"}
            </Link>
          </nav>

          <SegmentedControl.Root
            size="1"
            value={locale}
            onValueChange={(val) => {
              if (val === "en" || val === "bn") setLocale(val);
            }}
            aria-label="Language"
          >
            <SegmentedControl.Item value="en">EN</SegmentedControl.Item>
            <SegmentedControl.Item value="bn">বাং</SegmentedControl.Item>
          </SegmentedControl.Root>

          <Button
            variant="soft"
            color="gray"
            size="2"
            onClick={toggleAppearance}
            aria-label={
              appearance === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
            className="min-h-[36px] min-w-[36px] cursor-pointer"
          >
            {appearance === "light" ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </Flex>
      </div>
    </header>
  );
}

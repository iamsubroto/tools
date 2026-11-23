"use client";

import { useLanguage, type Locale } from "@/i18n/LanguageContext";

const OPTIONS: Array<{ value: Locale; label: string; aria: string }> = [
  { value: "en", label: "EN", aria: "English" },
  { value: "bn", label: "বাং", aria: "বাংলা" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900"
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.aria}
            onClick={() => setLocale(opt.value)}
            className={`h-8 min-w-[42px] rounded-lg px-2.5 text-[13px] font-semibold transition-all ${
              active
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

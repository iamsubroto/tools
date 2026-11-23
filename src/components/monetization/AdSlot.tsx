interface AdSlotProps {
  slotId: string;
  size?: "banner" | "rectangle";
  className?: string;
}

/**
 * CLS-safe reserved ad container.
 * Fixed min-height guarantees zero layout shift once AdSense loads.
 */
export function AdSlot({ slotId, size = "banner", className = "" }: AdSlotProps) {
  const minHeightClass = size === "rectangle" ? "min-h-[250px]" : "min-h-[90px]";

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={slotId}
      className={`my-10 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-100/50 print:hidden dark:border-slate-800 dark:bg-slate-900/40 ${minHeightClass} ${className}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">
        Advertisement
      </span>
    </aside>
  );
}

interface AdSlotProps {
  slotId: string;
  size?: "banner" | "rectangle";
  className?: string;
}

/**
 * CLS-safe reserved ad container.
 * Renders a fixed-height placeholder with zero layout shift until AdSense is connected.
 */
export function AdSlot({
  slotId,
  size = "banner",
  className = "",
}: AdSlotProps) {
  const minHeightClass =
    size === "rectangle" ? "min-h-[250px]" : "min-h-[90px]";

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={slotId}
      className={`print:hidden my-6 flex w-full items-center justify-center rounded-[var(--radius-3)] border border-dashed border-[var(--gray-5)] bg-[var(--gray-2)]/60 px-4 text-xs text-[var(--gray-9)] ${minHeightClass} ${className}`}
    >
      <span>Advertisement</span>
    </aside>
  );
}

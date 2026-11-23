import {
  ArrowLeftRight,
  CalendarDays,
  Camera,
  Code,
  FileText,
  Gem,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Landmark,
  Languages,
  Percent,
  PiggyBank,
  Receipt,
  Ruler,
  Send,
  Smartphone,
  Tag,
  TrendingUp,
  Type,
  Vault,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, type ToolCategory, type ToolIconKey } from "@/config/tools";

const ICONS: Record<ToolIconKey, LucideIcon> = {
  "piggy-bank": PiggyBank,
  receipt: Receipt,
  wallet: Wallet,
  landmark: Landmark,
  vault: Vault,
  send: Send,
  zap: Zap,
  ruler: Ruler,
  gem: Gem,
  smartphone: Smartphone,
  "file-text": FileText,
  tag: Tag,
  "trending-up": TrendingUp,
  calendar: CalendarDays,
  camera: Camera,
  "hand-coins": HandCoins,
  "graduation-cap": GraduationCap,
  languages: Languages,
  type: Type,
  percent: Percent,
  "arrow-left-right": ArrowLeftRight,
  "heart-pulse": HeartPulse,
  code: Code,
};

const SIZES = {
  sm: { box: "h-9 w-9 rounded-lg", icon: "h-[18px] w-[18px]" },
  md: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7" },
} as const;

interface ToolIconProps {
  icon: ToolIconKey;
  category: ToolCategory;
  size?: keyof typeof SIZES;
}

export function ToolIcon({ icon, category, size = "md" }: ToolIconProps) {
  const Icon = ICONS[icon];
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ring-1 ring-inset ${s.box} ${CATEGORIES[category].tileClass}`}
    >
      <Icon className={s.icon} strokeWidth={1.9} aria-hidden="true" />
    </span>
  );
}

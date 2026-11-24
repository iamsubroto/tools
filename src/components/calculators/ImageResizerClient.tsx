"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  AlertCircle,
  Archive,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Crop,
  Download,
  Eye,
  FileImage,
  Info,
  Maximize2,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  buildResizedFilename,
  computeLinkedDimension,
  deduplicateResizedName,
  DEFAULT_LOSSY_QUALITY,
  detectSupportedImageFormat,
  formatBytesCompact,
  MAX_LOSSY_QUALITY,
  MAX_RESIZE_DIMENSION,
  MAX_RESIZE_PERCENT,
  MIN_LOSSY_QUALITY,
  parsePositiveDimension,
  parseScalePercent,
  parseTargetKbInput,
  probeImageSize,
  RESIZE_PRESETS,
  resizeImageSameFormat,
  type ImageFormatInfo,
  type ResizeFitMode,
  type ResizeInputMode,
  type ResizePreset,
  type SameFormatResizeOptions,
  type SameFormatResizeResult,
} from "@/lib/image-resize";
import { toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

type ItemStatus = "queued" | "resizing" | "done" | "error";

interface ResizeQueueItem {
  id: string;
  file: File;
  format: ImageFormatInfo;
  sourcePreviewUrl: string;
  originalWidth: number | null;
  originalHeight: number | null;
  status: ItemStatus;
  result: SameFormatResizeResult | null;
  resultUrl: string | null;
  errorMessage: string | null;
}

const PERCENT_CHIPS = [25, 50, 75, 100] as const;
const TARGET_KB_CHIPS = [60, 100, 200, 500] as const;

const CHECKER_STYLE = {
  backgroundImage:
    "linear-gradient(45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.18) 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
} as const;

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white";
const primaryBtn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400";
const inputBase =
  "h-10 w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950";

function createUid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function yieldPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function triggerFileDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function ImageResizerClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = useCallback((en: string, bn: string) => (isBn ? bn : en), [isBn]);

  const fileInputId = useId();
  const widthId = useId();
  const heightId = useId();
  const percentId = useId();
  const qualityId = useId();
  const targetKbId = useId();
  const allowEnlargeId = useId();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeUrlsRef = useRef<Set<string>>(new Set());
  const runIdRef = useRef(0);
  const itemsRef = useRef<ResizeQueueItem[]>([]);

  // Resize settings state
  const [mode, setMode] = useState<ResizeInputMode>("dimensions");
  const [fitMode, setFitMode] = useState<ResizeFitMode>("fit");
  const [widthText, setWidthText] = useState<string>("1280");
  const [heightText, setHeightText] = useState<string>("720");
  const [percentText, setPercentText] = useState<string>("50");
  const [allowEnlarging, setAllowEnlarging] = useState<boolean>(false);
  const [quality, setQuality] = useState<number>(DEFAULT_LOSSY_QUALITY);
  const [targetKbText, setTargetKbText] = useState<string>("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Batch queue & UI state
  const [items, setItems] = useState<ResizeQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [isZipping, setIsZipping] = useState(false);
  const [lastAppliedSignature, setLastAppliedSignature] = useState<string | null>(null);
  const [compareItemId, setCompareItemId] = useState<string | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const createTrackedUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    activeUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedUrl = useCallback((url: string | null | undefined) => {
    if (!url) return;
    if (activeUrlsRef.current.has(url)) {
      activeUrlsRef.current.delete(url);
    }
    URL.revokeObjectURL(url);
  }, []);

  // Revoke all object URLs on unmount
  useEffect(() => {
    const urls = activeUrlsRef.current;
    return () => {
      runIdRef.current += 1;
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  // Escape key closes Before/After comparison modal
  useEffect(() => {
    if (!compareItemId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCompareItemId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [compareItemId]);

  const widthCheck = useMemo(
    () =>
      mode === "dimensions"
        ? parsePositiveDimension(widthText)
        : { value: null, error: null },
    [mode, widthText]
  );
  const heightCheck = useMemo(
    () =>
      mode === "dimensions"
        ? parsePositiveDimension(heightText)
        : { value: null, error: null },
    [mode, heightText]
  );
  const percentCheck = useMemo(
    () =>
      mode === "percentage"
        ? parseScalePercent(percentText, allowEnlarging)
        : { value: 100, error: null },
    [mode, percentText, allowEnlarging]
  );
  const targetKbCheck = useMemo(
    () => parseTargetKbInput(targetKbText),
    [targetKbText]
  );

  const missingBothDimensions =
    mode === "dimensions" &&
    !widthCheck.error &&
    !heightCheck.error &&
    widthCheck.value === null &&
    heightCheck.value === null &&
    targetKbCheck.value === null;

  const missingCoverDimension =
    mode === "dimensions" &&
    fitMode === "cover" &&
    !widthCheck.error &&
    !heightCheck.error &&
    (widthCheck.value !== null || heightCheck.value !== null) &&
    (widthCheck.value === null || heightCheck.value === null);

  const hasValidationError = Boolean(
    widthCheck.error ||
      heightCheck.error ||
      percentCheck.error ||
      targetKbCheck.error ||
      missingBothDimensions ||
      missingCoverDimension
  );

  const currentOptions: SameFormatResizeOptions = useMemo(
    () => ({
      mode,
      fitMode,
      width: widthCheck.value,
      height: heightCheck.value,
      percentage: percentCheck.value ?? 100,
      allowEnlarging,
      quality,
      targetMaxKb: targetKbCheck.value,
    }),
    [
      mode,
      fitMode,
      widthCheck.value,
      heightCheck.value,
      percentCheck.value,
      allowEnlarging,
      quality,
      targetKbCheck.value,
    ]
  );

  const settingsSignature = useMemo(
    () => JSON.stringify(currentOptions),
    [currentOptions]
  );

  const settingsDirty =
    items.length > 0 &&
    lastAppliedSignature !== null &&
    lastAppliedSignature !== settingsSignature;

  // Reference dimensions from first loaded image (for live aspect-ratio linking in Fit mode)
  const refDims = useMemo(() => {
    const first = items.find(
      (it) => it.originalWidth !== null && it.originalHeight !== null
    );
    if (first && first.originalWidth && first.originalHeight) {
      return { width: first.originalWidth, height: first.originalHeight };
    }
    return { width: 1920, height: 1080 };
  }, [items]);

  const handleWidthInput = (raw: string) => {
    setActivePresetId(null);
    setWidthText(raw);
    if (fitMode !== "fit") return;
    const parsed = parsePositiveDimension(raw);
    if (parsed.value !== null && !parsed.error) {
      const paired = computeLinkedDimension(
        "width",
        parsed.value,
        refDims.width,
        refDims.height
      );
      setHeightText(String(paired));
    } else if (!raw.trim()) {
      setHeightText("");
    }
  };

  const handleHeightInput = (raw: string) => {
    setActivePresetId(null);
    setHeightText(raw);
    if (fitMode !== "fit") return;
    const parsed = parsePositiveDimension(raw);
    if (parsed.value !== null && !parsed.error) {
      const paired = computeLinkedDimension(
        "height",
        parsed.value,
        refDims.width,
        refDims.height
      );
      setWidthText(String(paired));
    } else if (!raw.trim()) {
      setWidthText("");
    }
  };

  const handleSwapDimensions = () => {
    setActivePresetId(null);
    setWidthText(heightText);
    setHeightText(widthText);
  };

  const applyPreset = (preset: ResizePreset) => {
    setMode("dimensions");
    setWidthText(String(preset.width));
    setHeightText(String(preset.height));
    setFitMode(preset.recommendedFit);
    setActivePresetId(preset.id);
  };

  // Sequential batch processor
  const processBatch = useCallback(
    async (
      targets: ResizeQueueItem[],
      options: SameFormatResizeOptions,
      signature: string
    ) => {
      if (targets.length === 0) return;

      const myRunId = ++runIdRef.current;
      setIsProcessing(true);
      setProgress({ current: 0, total: targets.length });
      setLastAppliedSignature(signature);

      for (let i = 0; i < targets.length; i += 1) {
        if (runIdRef.current !== myRunId) return;
        const target = targets[i];
        setProgress({ current: i + 1, total: targets.length });

        setItems((prev) =>
          prev.map((it) =>
            it.id === target.id
              ? { ...it, status: "resizing", errorMessage: null }
              : it
          )
        );

        await yieldPaint();
        if (runIdRef.current !== myRunId) return;

        try {
          const result = await resizeImageSameFormat(target.file, options);
          if (runIdRef.current !== myRunId) return;

          const nextUrl = createTrackedUrl(result.blob);
          setItems((prev) =>
            prev.map((it) => {
              if (it.id !== target.id) return it;
              if (it.resultUrl) revokeTrackedUrl(it.resultUrl);
              return {
                ...it,
                originalWidth: result.originalWidth,
                originalHeight: result.originalHeight,
                status: "done",
                result,
                resultUrl: nextUrl,
                errorMessage: null,
              };
            })
          );
        } catch {
          if (runIdRef.current !== myRunId) return;
          setItems((prev) =>
            prev.map((it) =>
              it.id === target.id
                ? {
                    ...it,
                    status: "error",
                    errorMessage: t(
                      "Could not decode or resize this image. The file may be corrupted.",
                      "এই ছবিটি ডিকোড বা রিসাইজ করা যায়নি। ফাইলটি ক্ষতিগ্রস্ত হতে পারে।"
                    ),
                  }
                : it
            )
          );
        }
      }

      if (runIdRef.current === myRunId) {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [createTrackedUrl, revokeTrackedUrl, t]
  );

  const handleIncomingFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const accepted: Array<{ file: File; format: ImageFormatInfo }> = [];
      const rejected: string[] = [];

      for (const file of incoming) {
        const fmt = detectSupportedImageFormat(file);
        if (fmt) {
          accepted.push({ file, format: fmt });
        } else {
          rejected.push(file.name || "Unknown file");
        }
      }

      setRejectedNames(rejected);
      if (accepted.length === 0) return;

      const newItems: ResizeQueueItem[] = accepted.map(({ file, format }) => ({
        id: createUid(),
        file,
        format,
        sourcePreviewUrl: createTrackedUrl(file),
        originalWidth: null,
        originalHeight: null,
        status: "queued",
        result: null,
        resultUrl: null,
        errorMessage: null,
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Probe first image dimensions if first upload so linked aspect ratio is exact
      if (itemsRef.current.length === 0 && newItems[0]) {
        try {
          const dims = await probeImageSize(newItems[0].file);
          setItems((prev) =>
            prev.map((it) =>
              it.id === newItems[0].id
                ? { ...it, originalWidth: dims.width, originalHeight: dims.height }
                : it
            )
          );
        } catch {
          // Handled during batch processing
        }
      }

      if (!hasValidationError) {
        const queued = [
          ...itemsRef.current.filter((it) => it.status === "queued"),
          ...newItems,
        ];
        const seen = new Set<string>();
        const unique = queued.filter((it) => {
          if (seen.has(it.id)) return false;
          seen.add(it.id);
          return true;
        });
        void processBatch(unique, currentOptions, settingsSignature);
      }
    },
    [
      createTrackedUrl,
      hasValidationError,
      processBatch,
      currentOptions,
      settingsSignature,
    ]
  );

  const handleResizeAll = () => {
    if (hasValidationError || items.length === 0) return;
    const reset = items.map((it) => ({
      ...it,
      status: "queued" as const,
      errorMessage: null,
    }));
    setItems(reset);
    void processBatch(reset, currentOptions, settingsSignature);
  };

  const handleRemoveItem = (id: string) => {
    if (compareItemId === id) setCompareItemId(null);
    setItems((prev) => {
      const found = prev.find((it) => it.id === id);
      if (found) {
        revokeTrackedUrl(found.sourcePreviewUrl);
        revokeTrackedUrl(found.resultUrl);
      }
      const next = prev.filter((it) => it.id !== id);
      if (next.length === 0) {
        runIdRef.current += 1;
        setIsProcessing(false);
        setProgress(null);
        setLastAppliedSignature(null);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    runIdRef.current += 1;
    setCompareItemId(null);
    setIsProcessing(false);
    setProgress(null);
    setRejectedNames([]);
    setLastAppliedSignature(null);
    setItems((prev) => {
      for (const it of prev) {
        revokeTrackedUrl(it.sourcePreviewUrl);
        revokeTrackedUrl(it.resultUrl);
      }
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const completedItems = useMemo(
    () => items.filter((it) => it.status === "done" && it.result && it.resultUrl),
    [items]
  );

  const summary = useMemo(() => {
    let origTotal = 0;
    let newTotal = 0;
    for (const it of completedItems) {
      if (!it.result) continue;
      origTotal += it.result.originalSize;
      newTotal += it.result.newSize;
    }
    const saved = origTotal - newTotal;
    const pct = origTotal > 0 ? (saved / origTotal) * 100 : 0;
    return { count: completedItems.length, origTotal, newTotal, saved, pct };
  }, [completedItems]);

  const compareItem = useMemo(
    () => (compareItemId ? items.find((it) => it.id === compareItemId) ?? null : null),
    [compareItemId, items]
  );

  const handleDownloadZip = async () => {
    if (completedItems.length < 2 || isZipping) return;
    setIsZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const used = new Set<string>();
      for (const it of completedItems) {
        if (!it.result) continue;
        const name = deduplicateResizedName(it.result.outputFilename, used);
        zip.file(name, it.result.blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      triggerFileDownload(url, "resized-images.zip");
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setIsZipping(false);
    }
  };

  const socialPresets = useMemo(
    () => RESIZE_PRESETS.filter((p) => p.group === "social"),
    []
  );
  const formPresets = useMemo(
    () => RESIZE_PRESETS.filter((p) => p.group === "forms"),
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        {/* ── Left Panel: Resize Controls & Presets ────────────────── */}
        <aside className={`${card} p-5 sm:p-6 lg:sticky lg:top-24`}>
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <SlidersHorizontal
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              {t("Resize Settings", "রিসাইজ সেটিংস")}
            </h2>
            {settingsDirty && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25">
                {t("Apply changes", "আপডেট বাকি")}
              </span>
            )}
          </div>

          <div className="mt-5 space-y-5">
            {/* Mode Switcher: Custom px vs Scale % */}
            <div
              role="radiogroup"
              aria-label={t("Resize method", "রিসাইজ পদ্ধতি")}
              className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
            >
              {(
                [
                  { id: "dimensions" as const, en: "By Dimensions (px)", bn: "পিক্সেল (px)" },
                  { id: "percentage" as const, en: "By Percentage (%)", bn: "শতাংশ (%)" },
                ] as const
              ).map((tab) => {
                const active = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(tab.id)}
                    className={`min-h-9 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {isBn ? tab.bn : tab.en}
                  </button>
                );
              })}
            </div>

            {/* Dimensions Mode */}
            {mode === "dimensions" && (
              <div className="space-y-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
                  <div>
                    <label
                      htmlFor={widthId}
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t("Width (px)", "প্রস্থ (px)")}
                    </label>
                    <input
                      id={widthId}
                      type="text"
                      inputMode="numeric"
                      value={widthText}
                      onChange={(e) => handleWidthInput(e.target.value)}
                      placeholder={String(refDims.width)}
                      aria-invalid={Boolean(widthCheck.error)}
                      className={`mt-1 ${inputBase} ${
                        widthCheck.error
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={handleSwapDimensions}
                      title={t("Swap width & height", "প্রস্থ ও উচ্চতা অদলবদল করুন")}
                      aria-label={t("Swap width and height", "প্রস্থ ও উচ্চতা অদলবদল করুন")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor={heightId}
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t("Height (px)", "উচ্চতা (px)")}
                    </label>
                    <input
                      id={heightId}
                      type="text"
                      inputMode="numeric"
                      value={heightText}
                      onChange={(e) => handleHeightInput(e.target.value)}
                      placeholder={String(refDims.height)}
                      aria-invalid={Boolean(heightCheck.error)}
                      className={`mt-1 ${inputBase} ${
                        heightCheck.error
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                {(widthCheck.error ||
                  heightCheck.error ||
                  missingBothDimensions ||
                  missingCoverDimension) && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {widthCheck.error ||
                      heightCheck.error ||
                      (missingCoverDimension
                        ? t(
                            "Enter both width and height for Exact Center Crop.",
                            "সেন্টার ক্রপের জন্য প্রস্থ ও উচ্চতা দুটিই দিন।"
                          )
                        : t(
                            "Enter at least a width or height.",
                            "অন্তত প্রস্থ অথবা উচ্চতা লিখুন।"
                          ))}
                  </p>
                )}

                {/* 3 Fit Modes */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("Fit Mode", "ফিট মোড")}
                    </span>
                    <span className="text-[11px] tabular-nums text-slate-400">
                      {t("Max", "সর্বোচ্চ")} {MAX_RESIZE_DIMENSION.toLocaleString("en-US")}px
                    </span>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label={t("Aspect ratio fit mode", "ফিট মোড")}
                    className="mt-2 grid gap-1.5"
                  >
                    {(
                      [
                        {
                          id: "fit" as const,
                          titleEn: "Keep Aspect Ratio (Fit)",
                          titleBn: "অনুপাত ঠিক রাখুন (Fit)",
                          descEn: "Scales proportionally without cropping or distortion.",
                          descBn: "ছবি না কেটে ও বিকৃতি ছাড়াই আনুপাতিকভাবে ছোট করে।",
                        },
                        {
                          id: "cover" as const,
                          titleEn: "Exact Size (Smart Center Crop)",
                          titleBn: "সঠিক সাইজ (সেন্টার ক্রপ)",
                          descEn: "Matches exact W × H by cropping overflow from edges.",
                          descBn: "বিকৃতি ছাড়াই মাঝখান থেকে ক্রপ করে হুবহু সাইজ করে।",
                        },
                        {
                          id: "stretch" as const,
                          titleEn: "Exact Size (Stretch)",
                          titleBn: "সঠিক সাইজ (স্ট্রেচ)",
                          descEn: "Forces exact W × H ignoring original proportions.",
                          descBn: "মূল অনুপাত উপেক্ষা করে সরাসরি নির্দিষ্ট সাইজে আনে।",
                        },
                      ] as const
                    ).map((opt) => {
                      const active = fitMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setFitMode(opt.id)}
                          className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                            active
                              ? "border-emerald-500 bg-emerald-50/70 dark:border-emerald-500/60 dark:bg-emerald-500/10"
                              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              active
                                ? "border-emerald-600 bg-emerald-600 dark:border-emerald-400 dark:bg-emerald-400"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {active && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-950" />
                            )}
                          </span>
                          <span>
                            <span className="block text-xs font-bold text-slate-900 dark:text-white">
                              {isBn ? opt.titleBn : opt.titleEn}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                              {isBn ? opt.descBn : opt.descEn}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("Quick Size Presets", "দ্রুত সাইজ প্রিসেট")}
                  </p>

                  <div className="mt-2.5 space-y-2.5">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">
                        {t("Social & Web", "সোশ্যাল ও ওয়েব")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {socialPresets.map((preset) => {
                          const active = activePresetId === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                active
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300"
                                  : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                              }`}
                            >
                              <span>{isBn ? preset.labelBn : preset.labelEn}</span>
                              <span className="font-mono text-[10px] opacity-70">
                                {preset.width}×{preset.height}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-slate-400">
                        {t("Forms & IDs (BD)", "চাকরির ফর্ম ও আইডি")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {formPresets.map((preset) => {
                          const active = activePresetId === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                active
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300"
                                  : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                              }`}
                            >
                              <span>{isBn ? preset.labelBn : preset.labelEn}</span>
                              <span className="font-mono text-[10px] opacity-70">
                                {preset.width}×{preset.height}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Percentage Mode */}
            {mode === "percentage" && (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor={percentId}
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t("Scale percentage (%)", "স্কেল শতাংশ (%)")}
                  </label>
                  <div className="relative mt-1">
                    <input
                      id={percentId}
                      type="text"
                      inputMode="numeric"
                      value={percentText}
                      onChange={(e) => setPercentText(e.target.value)}
                      aria-invalid={Boolean(percentCheck.error)}
                      className={`${inputBase} pr-9 ${
                        percentCheck.error
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500"
                          : ""
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      %
                    </span>
                  </div>
                  {percentCheck.error && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {percentCheck.error}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {PERCENT_CHIPS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setPercentText(String(pct))}
                      className={`min-h-8 rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                        percentText === String(pct)
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Allow Enlarging Toggle */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
              <label
                htmlFor={allowEnlargeId}
                className="flex cursor-pointer items-start gap-2.5 text-xs"
              >
                <input
                  id={allowEnlargeId}
                  type="checkbox"
                  checked={allowEnlarging}
                  onChange={(e) => setAllowEnlarging(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-600"
                />
                <span>
                  <span className="block font-semibold text-slate-800 dark:text-slate-200">
                    {t("Allow enlarging", "মূল সাইজের চেয়ে বড় করার অনুমতি")}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(
                      `Off by default to prevent blurry upscaling. Max ${MAX_RESIZE_PERCENT}%.`,
                      "ডিফল্টভাবে বন্ধ থাকে যাতে ছোট ছবি বড় হয়ে ঝাপসা না হয়।"
                    )}
                  </span>
                </span>
              </label>
            </div>

            {/* Target Max File Size (KB) */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={targetKbId}
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {t("Target Max File Size (Optional)", "সর্বোচ্চ ফাইল সাইজ (ঐচ্ছিক)")}
                </label>
                {targetKbCheck.value !== null && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold tabular-nums text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    ≤ {isBn ? toBanglaDigits(targetKbCheck.value) : targetKbCheck.value} KB
                  </span>
                )}
              </div>

              <div className="relative mt-2">
                <input
                  id={targetKbId}
                  type="text"
                  inputMode="numeric"
                  value={targetKbText}
                  onChange={(e) => setTargetKbText(e.target.value)}
                  placeholder={t("e.g. 200 (leave blank for no cap)", "যেমন 200 (ফাঁকা রাখলে সীমা নেই)")}
                  aria-invalid={Boolean(targetKbCheck.error)}
                  className={`${inputBase} pr-16 ${
                    targetKbCheck.error
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500"
                      : ""
                  }`}
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {targetKbText && (
                    <button
                      type="button"
                      onClick={() => setTargetKbText("")}
                      aria-label={t("Clear target file size", "ফাইল সাইজ সীমা মুছুন")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <span className="pr-1 text-xs font-bold text-slate-400">KB</span>
                </div>
              </div>

              {targetKbCheck.error && (
                <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {targetKbCheck.error}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTargetKbText("")}
                  className={`min-h-8 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${
                    !targetKbText
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                  }`}
                >
                  {t("Off", "বন্ধ")}
                </button>
                {TARGET_KB_CHIPS.map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKbText(String(kb))}
                    className={`min-h-8 rounded-lg border px-2.5 text-[11px] font-semibold tabular-nums transition-colors ${
                      targetKbText === String(kb)
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    }`}
                  >
                    ≤ {kb} KB
                  </button>
                ))}
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {t(
                  "Automatically tunes JPG/WebP quality (and steps down dimensions if needed for PNG or very large images) to stay under your KB limit.",
                  "আপনার নির্ধারিত KB সীমার মধ্যে রাখতে স্বয়ংক্রিয়ভাবে কোয়ালিটি ও প্রয়োজনে ডাইমেনশন সমন্বয় করে।"
                )}
              </p>
            </div>

            {/* Quality Slider (JPG & WebP only; PNG lossless) */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={qualityId}
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {targetKbCheck.value !== null
                    ? t("Max Starting Quality", "সর্বোচ্চ শুরুর কোয়ালিটি")
                    : t("Output Quality (JPG / WebP)", "আউটপুট কোয়ালিটি")}
                </label>
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-extrabold tabular-nums text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {isBn ? toBanglaDigits(quality) : quality}%
                </span>
              </div>
              <input
                id={qualityId}
                type="range"
                min={MIN_LOSSY_QUALITY}
                max={MAX_LOSSY_QUALITY}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-slate-800 dark:accent-emerald-400"
              />
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                {t(
                  "PNG files always stay lossless with transparency preserved.",
                  "PNG ছবি সবসময় লসলেস ও স্বচ্ছ ব্যাকগ্রাউন্ডসহ সংরক্ষিত হয়।"
                )}
              </p>
            </div>

            {/* Apply / Resize All Button */}
            {items.length > 0 && (
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  disabled={hasValidationError || isProcessing}
                  onClick={handleResizeAll}
                  className={`${primaryBtn} w-full`}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  {isProcessing
                    ? t("Resizing…", "রিসাইজ চলছে…")
                    : t(
                        `Resize all (${items.length})`,
                        `সব রিসাইজ করুন (${toBanglaDigits(items.length)})`
                      )}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Panel: Dropzone + Batch Summary + Results ──────── */}
        <div className="space-y-5">
          {/* Drag-and-Drop / Multi-File Picker */}
          <div
            role="button"
            tabIndex={0}
            aria-label={t(
              "Upload JPG, PNG, or WebP images by clicking or dragging and dropping",
              "JPG, PNG বা WebP ছবি আপলোড করতে ক্লিক করুন বা ড্র্যাগ অ্যান্ড ড্রপ করুন"
            )}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDragging) setIsDragging(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDragging) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                void handleIncomingFiles(e.dataTransfer.files);
              }
            }}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/70 dark:border-emerald-400 dark:bg-emerald-500/10"
                : "border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/60 dark:hover:bg-slate-800/50"
            }`}
          >
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleIncomingFiles(e.target.files);
                  e.target.value = "";
                }
              }}
              className="sr-only"
            />

            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset transition-colors ${
                isDragging
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 ring-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-600/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:group-hover:bg-emerald-500/15 dark:group-hover:text-emerald-300"
              }`}
            >
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            </span>

            <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
              {isDragging
                ? t("Drop your JPG, PNG, or WebP images here", "এখানে ছবি ছাড়ুন")
                : t(
                    "Drop JPG, PNG, or WebP images here, or click to browse",
                    "JPG, PNG বা WebP ছবি এখানে ড্রপ করুন বা ব্রাউজ করুন"
                  )}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t(
                "Original file format is preserved (JPG→JPG, PNG→PNG, WebP→WebP) · 100% private in your browser",
                "মূল ফাইল ফরম্যাট অপরিবর্তিত থাকে (JPG→JPG, PNG→PNG, WebP→WebP) · সম্পূর্ণ নিরাপদ"
              )}
            </p>
          </div>

          {/* Rejected Files Alert */}
          {rejectedNames.length > 0 && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    {t(
                      "Skipped unsupported files (JPG/JPEG, PNG, and WebP only):",
                      "অসমর্থিত ফাইল বাদ দেওয়া হয়েছে (শুধুমাত্র JPG, PNG ও WebP):"
                    )}
                  </p>
                  <p className="mt-1 break-all opacity-90">
                    {rejectedNames.join(", ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectedNames([])}
                aria-label={t("Dismiss notice", "বার্তা বন্ধ করুন")}
                className="rounded-lg p-1 hover:bg-amber-200/50 dark:hover:bg-amber-500/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Batch Progress & Summary Bar */}
          {items.length > 0 && (
            <section className={`${card} p-4 sm:p-5`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  {isProcessing && progress ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <RefreshCw
                        className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span className="tabular-nums">
                        {isBn
                          ? `রিসাইজ চলছে: ${toBanglaDigits(progress.current)} / ${toBanglaDigits(progress.total)}`
                          : `Resizing ${progress.current} of ${progress.total}…`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span className="tabular-nums">
                        {isBn
                          ? `${toBanglaDigits(summary.count)}টি ছবি প্রস্তুত`
                          : `${summary.count} of ${items.length} resized`}
                      </span>
                    </div>
                  )}

                  {summary.count > 0 && (
                    <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {formatBytesCompact(summary.origTotal)} →{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {formatBytesCompact(summary.newTotal)}
                      </strong>{" "}
                      {summary.saved >= 0 ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          (−{summary.pct.toFixed(1)}% ·{" "}
                          {formatBytesCompact(summary.saved)} {t("smaller", "ছোট")})
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          (+{Math.abs(summary.pct).toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {completedItems.length >= 2 && (
                    <button
                      type="button"
                      disabled={isZipping || isProcessing}
                      onClick={() => void handleDownloadZip()}
                      className={primaryBtn}
                    >
                      {isZipping ? (
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Archive className="h-4 w-4" aria-hidden="true" />
                      )}
                      {isZipping
                        ? t("Creating ZIP…", "ZIP তৈরি হচ্ছে…")
                        : t(
                            `Download all as ZIP (${completedItems.length})`,
                            `সব ZIP ডাউনলোড (${toBanglaDigits(completedItems.length)})`
                          )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className={`${ghostBtn} text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("Clear all", "সব মুছুন")}
                  </button>
                </div>
              </div>

              {isProcessing && progress && (
                <div
                  role="progressbar"
                  aria-valuenow={progress.current}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                >
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-200 dark:bg-emerald-400"
                    style={{
                      width: `${Math.round((progress.current / progress.total) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </section>
          )}

          {/* Per-File Result Cards */}
          {items.length > 0 && (
            <ul className="space-y-3" aria-live="polite">
              {items.map((item) => {
                const previewSrc = item.resultUrl ?? item.sourcePreviewUrl;
                const outName =
                  item.result?.outputFilename ??
                  buildResizedFilename(item.file.name, item.format);

                return (
                  <li key={item.id} className={`${card} p-4`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {/* Clickable Thumbnail Preview */}
                      <button
                        type="button"
                        disabled={item.status !== "done"}
                        onClick={() => item.status === "done" && setCompareItemId(item.id)}
                        title={
                          item.status === "done"
                            ? t("Click to compare Before & After", "আগে ও পরের ছবি তুলনা করুন")
                            : undefined
                        }
                        className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 disabled:cursor-default dark:border-slate-700"
                        style={CHECKER_STYLE}
                      >
                        <Image
                          src={previewSrc}
                          alt={item.file.name}
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-contain"
                        />
                        {item.status === "done" && (
                          <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition-all group-hover:bg-slate-950/40 group-hover:opacity-100">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </button>

                      {/* Metadata */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            title={item.file.name}
                            className="truncate text-sm font-bold text-slate-900 dark:text-white"
                          >
                            {outName}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                            {item.format.label}
                            <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
                            {item.format.label}
                          </span>
                          {item.result?.wasCropped && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                              <Crop className="h-2.5 w-2.5" aria-hidden="true" />
                              {t("Center-cropped", "সেন্টার ক্রপ")}
                            </span>
                          )}
                          {item.result?.targetMaxKb !== null &&
                            item.result?.targetMaxKb !== undefined && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                                  item.result.targetMet
                                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                                    : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                                }`}
                              >
                                {item.result.targetMet ? (
                                  <>
                                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                                    ≤ {item.result.targetMaxKb} KB
                                    {item.result.appliedQuality !== null
                                      ? ` · Q${item.result.appliedQuality}%`
                                      : ""}
                                    {item.result.autoDownscaledForTarget
                                      ? ` · ${t("Auto-scaled", "অটো-স্কেলড")}`
                                      : ""}
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
                                    {t(
                                      `Smallest possible (target ${item.result.targetMaxKb} KB)`,
                                      `সর্বনিম্ন সাইজ (লক্ষ্য ${toBanglaDigits(item.result.targetMaxKb)} KB)`
                                    )}
                                  </>
                                )}
                              </span>
                            )}
                        </div>

                        {item.status === "queued" && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("Queued for resizing…", "রিসাইজের জন্য অপেক্ষমাণ…")}
                          </p>
                        )}

                        {item.status === "resizing" && (
                          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <RefreshCw
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                            {t("Resizing image…", "রিসাইজ হচ্ছে…")}
                          </p>
                        )}

                        {item.status === "error" && (
                          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {item.errorMessage}
                          </p>
                        )}

                        {item.status === "done" && item.result && (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums text-slate-600 dark:text-slate-400">
                              <span>
                                {t("Dimensions:", "সাইজ:")}{" "}
                                <span>
                                  {item.result.originalWidth}×{item.result.originalHeight}
                                </span>
                                {" → "}
                                <strong className="text-slate-900 dark:text-white">
                                  {item.result.width}×{item.result.height}
                                </strong>
                              </span>

                              <span>
                                {t("File size:", "আকার:")}{" "}
                                <span>{formatBytesCompact(item.result.originalSize)}</span>
                                {" → "}
                                <strong className="text-slate-900 dark:text-white">
                                  {formatBytesCompact(item.result.newSize)}
                                </strong>
                              </span>

                              {item.result.sizeDeltaPercent >= 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                                  <Check className="h-3 w-3" aria-hidden="true" />−
                                  {item.result.sizeDeltaPercent.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  +{Math.abs(item.result.sizeDeltaPercent).toFixed(1)}%
                                </span>
                              )}
                            </div>

                            {item.result.wasClampedToOriginal && (
                              <p className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                                {t(
                                  "Kept within original resolution (enable 'Allow enlarging' to upscale).",
                                  "মূল রেজোলিউশনের ভেতরে রাখা হয়েছে (বড় করতে 'Allow enlarging' চালু করুন)।"
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {item.status === "done" && item.result && item.resultUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => setCompareItemId(item.id)}
                              className={ghostBtn}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                              {t("Compare", "তুলনা")}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                triggerFileDownload(
                                  item.resultUrl!,
                                  item.result!.outputFilename
                                )
                              }
                              className={primaryBtn}
                            >
                              <Download className="h-4 w-4" aria-hidden="true" />
                              {t("Download", "ডাউনলোড")}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label={t(`Remove ${item.file.name}`, `${item.file.name} সরান`)}
                          title={t("Remove", "সরান")}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-rose-400"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Feature Cards When Empty */}
          {items.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: FileImage,
                  titleEn: "Exact Same File Type",
                  titleBn: "একই ফাইল ফরম্যাট",
                  descEn:
                    "JPG stays JPG, PNG keeps lossless transparency, and WebP stays WebP—no unwanted conversion.",
                  descBn:
                    "JPG থাকে JPG, PNG-এর স্বচ্ছতা অক্ষুণ্ণ থাকে এবং WebP থাকে WebP।",
                },
                {
                  icon: Crop,
                  titleEn: "Fit, Smart Crop & Presets",
                  titleBn: "ফিট, স্মার্ট ক্রপ ও প্রিসেট",
                  descEn:
                    "Use 1-click presets for YouTube, Instagram, or Teletalk 300×300 without stretching faces.",
                  descBn:
                    "ইউটিউব, ইনস্টাগ্রাম বা টেলিটক ৩০০×৩০০ প্রিসেটে এক ক্লিকে নিখুঁত সাইজ।",
                },
                {
                  icon: Maximize2,
                  titleEn: "Batch & Before/After Preview",
                  titleBn: "ব্যাচ ও তুলনা প্রিভিউ",
                  descEn:
                    "Resize dozens of photos locally, inspect before/after crispness, and download one ZIP.",
                  descBn:
                    "একসাথে অনেক ছবি রিসাইজ করুন, আগে-পরে তুলনা দেখুন ও ZIP ডাউনলোড করুন।",
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.titleEn} className={`${card} p-4`}>
                    <div className="flex items-center gap-2">
                      <Icon
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isBn ? feat.titleBn : feat.titleEn}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {isBn ? feat.descBn : feat.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Before / After Side-by-Side Comparison Modal ───────────── */}
      {compareItem && compareItem.result && compareItem.resultUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("Before and after image comparison", "আগে ও পরের ছবির তুলনা")}
          onClick={() => setCompareItemId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {compareItem.result.outputFilename}
                </h3>
                <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {t("Format preserved:", "ফরম্যাট:")} {compareItem.format.label} ·{" "}
                  {compareItem.result.originalWidth}×{compareItem.result.originalHeight} →{" "}
                  {compareItem.result.width}×{compareItem.result.height}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    triggerFileDownload(
                      compareItem.resultUrl!,
                      compareItem.result!.outputFilename
                    )
                  }
                  className={primaryBtn}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t("Download", "ডাউনলোড")}
                </button>
                <button
                  type="button"
                  onClick={() => setCompareItemId(null)}
                  aria-label={t("Close preview", "প্রিভিউ বন্ধ করুন")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Side-by-Side Images */}
            <div className="grid flex-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {t("Original", "মূল ছবি")}
                  </span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">
                    {compareItem.result.originalWidth}×{compareItem.result.originalHeight} ·{" "}
                    {formatBytesCompact(compareItem.result.originalSize)}
                  </span>
                </div>
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                  style={CHECKER_STYLE}
                >
                  <Image
                    src={compareItem.sourcePreviewUrl}
                    alt={`${compareItem.file.name} original`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {t("Resized", "রিসাইজড ছবি")} ({compareItem.format.label})
                  </span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">
                    {compareItem.result.width}×{compareItem.result.height} ·{" "}
                    {formatBytesCompact(compareItem.result.newSize)}
                  </span>
                </div>
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-500/30"
                  style={CHECKER_STYLE}
                >
                  <Image
                    src={compareItem.resultUrl}
                    alt={`${compareItem.file.name} resized`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

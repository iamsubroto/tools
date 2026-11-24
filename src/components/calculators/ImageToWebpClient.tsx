"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileImage,
  Info,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Unlock,
  UploadCloud,
  X,
} from "lucide-react";
import {
  checkWebpEncodingSupport,
  computeProportionalDimension,
  computeSavingsPercent,
  convertImageToWebp,
  deduplicateFilename,
  DEFAULT_WEBP_QUALITY,
  formatFileSize,
  isAcceptedSourceImage,
  MAX_IMAGE_DIMENSION,
  MAX_SCALE_PERCENT,
  MAX_WEBP_QUALITY,
  MIN_WEBP_QUALITY,
  parseDimensionInput,
  parsePercentageInput,
  readImageDimensions,
  toWebpFilename,
  type ConversionResult,
  type ConvertOptions,
  type ResizeMode,
} from "@/lib/image-convert";
import { toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

type ItemStatus = "queued" | "converting" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  sourcePreviewUrl: string;
  originalWidth: number | null;
  originalHeight: number | null;
  status: ItemStatus;
  result: ConversionResult | null;
  resultUrl: string | null;
  errorMessage: string | null;
}

const QUALITY_PRESETS = [
  { value: 60, labelEn: "Small (60)", labelBn: "ছোট (৬০)" },
  { value: 80, labelEn: "Balanced (80)", labelBn: "ব্যালান্সড (৮০)" },
  { value: 92, labelEn: "Crisp (92)", labelBn: "উচ্চ মান (৯২)" },
] as const;

const PERCENT_PRESETS = [25, 50, 75, 100] as const;

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white";
const primaryBtn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400";
const inputBase =
  "h-10 w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950";

let cachedWebpSupport: boolean | null = null;
function subscribeNoop(): () => void {
  return () => {};
}
function getClientWebpSupport(): boolean {
  if (cachedWebpSupport === null) {
    cachedWebpSupport = checkWebpEncodingSupport();
  }
  return cachedWebpSupport;
}
function getServerWebpSupport(): boolean {
  return true;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function triggerBlobDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function ImageToWebpClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = useCallback((en: string, bn: string) => (isBn ? bn : en), [isBn]);

  const fileInputId = useId();
  const qualitySliderId = useId();
  const widthInputId = useId();
  const heightInputId = useId();
  const percentInputId = useId();
  const allowEnlargeId = useId();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeUrlsRef = useRef<Set<string>>(new Set());
  const runIdRef = useRef(0);
  const itemsRef = useRef<QueueItem[]>([]);

  const webpSupported = useSyncExternalStore(
    subscribeNoop,
    getClientWebpSupport,
    getServerWebpSupport
  );

  // Settings state
  const [quality, setQuality] = useState<number>(DEFAULT_WEBP_QUALITY);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("original");
  const [widthText, setWidthText] = useState<string>("");
  const [heightText, setHeightText] = useState<string>("");
  const [percentText, setPercentText] = useState<string>("75");
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [allowEnlarging, setAllowEnlarging] = useState<boolean>(false);

  // Queue & UI state
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [isZipping, setIsZipping] = useState(false);
  const [lastAppliedSignature, setLastAppliedSignature] = useState<string | null>(null);

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

  // Revoke all object URLs on unmount to prevent memory leaks
  useEffect(() => {
    const urlSet = activeUrlsRef.current;
    return () => {
      runIdRef.current += 1;
      for (const url of urlSet) {
        URL.revokeObjectURL(url);
      }
      urlSet.clear();
    };
  }, []);

  // Validation
  const widthValidation = useMemo(
    () => (resizeMode === "dimensions" ? parseDimensionInput(widthText) : { value: null, error: null }),
    [resizeMode, widthText]
  );
  const heightValidation = useMemo(
    () => (resizeMode === "dimensions" ? parseDimensionInput(heightText) : { value: null, error: null }),
    [resizeMode, heightText]
  );
  const percentValidation = useMemo(
    () =>
      resizeMode === "percentage"
        ? parsePercentageInput(percentText, allowEnlarging)
        : { value: 100, error: null },
    [resizeMode, percentText, allowEnlarging]
  );

  const hasValidationError = Boolean(
    widthValidation.error || heightValidation.error || percentValidation.error
  );

  const currentConvertOptions: ConvertOptions = useMemo(
    () => ({
      quality,
      resize: {
        mode: resizeMode,
        width: widthValidation.value,
        height: heightValidation.value,
        percentage: percentValidation.value ?? 100,
        keepAspectRatio,
        allowEnlarging,
      },
    }),
    [
      quality,
      resizeMode,
      widthValidation.value,
      heightValidation.value,
      percentValidation.value,
      keepAspectRatio,
      allowEnlarging,
    ]
  );

  const settingsSignature = useMemo(
    () => JSON.stringify(currentConvertOptions),
    [currentConvertOptions]
  );

  const settingsDirty =
    items.length > 0 &&
    lastAppliedSignature !== null &&
    lastAppliedSignature !== settingsSignature;

  // Reference aspect ratio from first decoded image (for live linked width/height inputs)
  const referenceDimensions = useMemo(() => {
    const firstDecoded = items.find(
      (it) => it.originalWidth !== null && it.originalHeight !== null
    );
    if (firstDecoded && firstDecoded.originalWidth && firstDecoded.originalHeight) {
      return {
        width: firstDecoded.originalWidth,
        height: firstDecoded.originalHeight,
        fromImage: true,
      };
    }
    return { width: 1920, height: 1080, fromImage: false };
  }, [items]);

  const handleWidthChange = (raw: string) => {
    setWidthText(raw);
    if (!keepAspectRatio) return;
    const parsed = parseDimensionInput(raw);
    if (parsed.value !== null && !parsed.error) {
      const paired = computeProportionalDimension(
        "width",
        parsed.value,
        referenceDimensions.width,
        referenceDimensions.height
      );
      setHeightText(String(paired));
    } else if (!raw.trim()) {
      setHeightText("");
    }
  };

  const handleHeightChange = (raw: string) => {
    setHeightText(raw);
    if (!keepAspectRatio) return;
    const parsed = parseDimensionInput(raw);
    if (parsed.value !== null && !parsed.error) {
      const paired = computeProportionalDimension(
        "height",
        parsed.value,
        referenceDimensions.width,
        referenceDimensions.height
      );
      setWidthText(String(paired));
    } else if (!raw.trim()) {
      setWidthText("");
    }
  };

  const handleToggleAspectRatio = () => {
    const next = !keepAspectRatio;
    setKeepAspectRatio(next);
    if (next) {
      const wParsed = parseDimensionInput(widthText);
      const hParsed = parseDimensionInput(heightText);
      if (wParsed.value !== null && !wParsed.error) {
        const paired = computeProportionalDimension(
          "width",
          wParsed.value,
          referenceDimensions.width,
          referenceDimensions.height
        );
        setHeightText(String(paired));
      } else if (hParsed.value !== null && !hParsed.error) {
        const paired = computeProportionalDimension(
          "height",
          hParsed.value,
          referenceDimensions.width,
          referenceDimensions.height
        );
        setWidthText(String(paired));
      }
    }
  };

  // Sequential batch processor
  const processItemsSequentially = useCallback(
    async (targets: QueueItem[], options: ConvertOptions, signature: string) => {
      if (targets.length === 0) return;

      const myRunId = ++runIdRef.current;
      setIsProcessing(true);
      setProgress({ current: 0, total: targets.length });
      setLastAppliedSignature(signature);

      for (let idx = 0; idx < targets.length; idx += 1) {
        if (runIdRef.current !== myRunId) return;

        const target = targets[idx];
        setProgress({ current: idx + 1, total: targets.length });

        setItems((prev) =>
          prev.map((it) =>
            it.id === target.id
              ? { ...it, status: "converting", errorMessage: null }
              : it
          )
        );

        await yieldToMainThread();
        if (runIdRef.current !== myRunId) return;

        try {
          const result = await convertImageToWebp(target.file, options);
          if (runIdRef.current !== myRunId) return;

          const newResultUrl = createTrackedUrl(result.blob);

          setItems((prev) =>
            prev.map((it) => {
              if (it.id !== target.id) return it;
              if (it.resultUrl) {
                revokeTrackedUrl(it.resultUrl);
              }
              return {
                ...it,
                originalWidth: result.originalWidth,
                originalHeight: result.originalHeight,
                status: "done",
                result,
                resultUrl: newResultUrl,
                errorMessage: null,
              };
            })
          );
        } catch (err) {
          if (runIdRef.current !== myRunId) return;
          const code = err instanceof Error ? err.message : "DECODE_FAILED";
          const readableError =
            code === "WEBP_UNSUPPORTED"
              ? t(
                  "This browser does not support WebP canvas encoding.",
                  "এই ব্রাউজার ক্যানভাসের মাধ্যমে WebP এনকোডিং সমর্থন করে না।"
                )
              : t(
                  "Could not decode this image. The file may be corrupted or unsupported.",
                  "এই ছবিটি ডিকোড করা যায়নি। ফাইলটি ক্ষতিগ্রস্ত হতে পারে।"
                );

          setItems((prev) =>
            prev.map((it) =>
              it.id === target.id
                ? {
                    ...it,
                    status: "error",
                    errorMessage: readableError,
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
      if (!webpSupported) return;
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const accepted: File[] = [];
      const rejected: string[] = [];

      for (const file of incoming) {
        if (isAcceptedSourceImage(file)) {
          accepted.push(file);
        } else {
          rejected.push(file.name || "Unknown file");
        }
      }

      setRejectedNames(rejected);
      if (accepted.length === 0) return;

      const newItems: QueueItem[] = accepted.map((file) => ({
        id: createId(),
        file,
        sourcePreviewUrl: createTrackedUrl(file),
        originalWidth: null,
        originalHeight: null,
        status: "queued",
        result: null,
        resultUrl: null,
        errorMessage: null,
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Probe first image dimensions immediately if none loaded yet so aspect lock is accurate
      if (itemsRef.current.length === 0 && newItems[0]) {
        try {
          const dims = await readImageDimensions(newItems[0].file);
          setItems((prev) =>
            prev.map((it) =>
              it.id === newItems[0].id
                ? { ...it, originalWidth: dims.width, originalHeight: dims.height }
                : it
            )
          );
        } catch {
          // Will be handled cleanly during sequential conversion
        }
      }

      if (!hasValidationError) {
        const queuedTargets = [...itemsRef.current.filter((it) => it.status === "queued"), ...newItems];
        // Deduplicate by id in case itemsRef already included newItems
        const seen = new Set<string>();
        const uniqueTargets = queuedTargets.filter((it) => {
          if (seen.has(it.id)) return false;
          seen.add(it.id);
          return true;
        });
        void processItemsSequentially(
          uniqueTargets,
          currentConvertOptions,
          settingsSignature
        );
      }
    },
    [
      webpSupported,
      createTrackedUrl,
      hasValidationError,
      processItemsSequentially,
      currentConvertOptions,
      settingsSignature,
    ]
  );

  const handleReconvertAll = () => {
    if (!webpSupported || hasValidationError || items.length === 0) return;

    // Reset statuses to queued while keeping source files intact
    const snapshot = items.map((it) => ({
      ...it,
      status: "queued" as const,
      errorMessage: null,
    }));
    setItems(snapshot);
    void processItemsSequentially(snapshot, currentConvertOptions, settingsSignature);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        revokeTrackedUrl(target.sourcePreviewUrl);
        revokeTrackedUrl(target.resultUrl);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const completedItems = useMemo(
    () => items.filter((it) => it.status === "done" && it.result && it.resultUrl),
    [items]
  );

  const batchSummary = useMemo(() => {
    let totalOriginal = 0;
    let totalNew = 0;
    for (const it of completedItems) {
      if (!it.result) continue;
      totalOriginal += it.result.originalSize;
      totalNew += it.result.newSize;
    }
    const savedBytes = totalOriginal - totalNew;
    const savedPercent = computeSavingsPercent(totalOriginal, totalNew);
    return {
      count: completedItems.length,
      totalOriginal,
      totalNew,
      savedBytes,
      savedPercent,
    };
  }, [completedItems]);

  const handleDownloadZip = async () => {
    if (completedItems.length < 2 || isZipping) return;
    setIsZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const usedNames = new Set<string>();

      for (const it of completedItems) {
        if (!it.result) continue;
        const uniqueName = deduplicateFilename(it.result.outputFilename, usedNames);
        zip.file(uniqueName, it.result.blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      triggerBlobDownload(zipUrl, "converted-webp-images.zip");
      window.setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDropzoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDropzoneDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  };

  const handleDropzoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Browser Support Banner */}
      {!webpSupported && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {t(
                "WebP encoding is not supported in this browser",
                "এই ব্রাউজারে WebP এনকোডিং সমর্থিত নয়"
              )}
            </p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              {t(
                "Your browser's HTML5 Canvas API does not support exporting to image/webp. Please switch to a modern version of Chrome, Edge, Firefox, or Safari 16+.",
                "আপনার ব্রাউজারের ক্যানভাস API সরাসরি image/webp তৈরি করতে পারছে না। অনুগ্রহ করে আধুনিক Chrome, Edge, Firefox বা Safari ব্যবহার করুন।"
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        {/* ── Left Panel: Conversion & Resize Controls ──────────────── */}
        <aside className={`${card} p-5 sm:p-6 lg:sticky lg:top-24`}>
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <SlidersHorizontal
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              {t("Conversion Settings", "কনভার্সন সেটিংস")}
            </h2>
            {settingsDirty && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25">
                {t("Changes pending", "আপডেট বাকি")}
              </span>
            )}
          </div>

          <div className="mt-5 space-y-6">
            {/* Quality Slider */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={qualitySliderId}
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {t("WebP Quality", "WebP কোয়ালিটি")}
                </label>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-sm font-extrabold tabular-nums text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {isBn ? toBanglaDigits(quality) : quality}%
                </span>
              </div>

              <input
                id={qualitySliderId}
                type="range"
                min={MIN_WEBP_QUALITY}
                max={MAX_WEBP_QUALITY}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                aria-valuemin={MIN_WEBP_QUALITY}
                aria-valuemax={MAX_WEBP_QUALITY}
                aria-valuenow={quality}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-slate-800 dark:accent-emerald-400"
              />

              <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-slate-400">
                <span>10 ({t("Smallest", "ছোট ফাইল")})</span>
                <span>100 ({t("Best quality", "সর্বোচ্চ মান")})</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {QUALITY_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setQuality(preset.value)}
                    className={`min-h-8 rounded-lg border px-2 text-xs font-medium transition-colors ${
                      quality === preset.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    }`}
                  >
                    {isBn ? preset.labelBn : preset.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize Mode Selector */}
            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("Resize Before Converting", "রিসাইজ অপশন")}
              </p>

              <div
                role="radiogroup"
                aria-label={t("Resize mode", "রিসাইজ মোড")}
                className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              >
                {(
                  [
                    { id: "original" as const, en: "Original", bn: "মূল সাইজ" },
                    { id: "dimensions" as const, en: "Custom px", bn: "পিক্সেল" },
                    { id: "percentage" as const, en: "Scale %", bn: "শতাংশ %" },
                  ] as const
                ).map((mode) => {
                  const active = resizeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setResizeMode(mode.id)}
                      className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {isBn ? mode.bn : mode.en}
                    </button>
                  );
                })}
              </div>

              {/* Mode 2: Custom Pixel Dimensions */}
              {resizeMode === "dimensions" && (
                <div className="mt-4 space-y-3.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
                    <div>
                      <label
                        htmlFor={widthInputId}
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        {t("Width (px)", "প্রস্থ (px)")}
                      </label>
                      <input
                        id={widthInputId}
                        type="text"
                        inputMode="numeric"
                        value={widthText}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        placeholder={String(referenceDimensions.width)}
                        aria-invalid={Boolean(widthValidation.error)}
                        className={`mt-1 ${inputBase} ${
                          widthValidation.error
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500"
                            : ""
                        }`}
                      />
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={handleToggleAspectRatio}
                        aria-pressed={keepAspectRatio}
                        title={
                          keepAspectRatio
                            ? t("Aspect ratio locked — click to unlock", "অনুপাত লক করা আছে")
                            : t("Aspect ratio unlocked — click to lock", "অনুপাত আনলক করা আছে")
                        }
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                          keepAspectRatio
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-400 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-white"
                        }`}
                      >
                        {keepAspectRatio ? (
                          <Lock className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Unlock className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    <div>
                      <label
                        htmlFor={heightInputId}
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        {t("Height (px)", "উচ্চতা (px)")}
                      </label>
                      <input
                        id={heightInputId}
                        type="text"
                        inputMode="numeric"
                        value={heightText}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        placeholder={String(referenceDimensions.height)}
                        aria-invalid={Boolean(heightValidation.error)}
                        className={`mt-1 ${inputBase} ${
                          heightValidation.error
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  {(widthValidation.error || heightValidation.error) && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {widthValidation.error || heightValidation.error}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={handleToggleAspectRatio}
                      className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          keepAspectRatio ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      {t("Keep aspect ratio", "অনুপাত ঠিক রাখুন")}:{" "}
                      <strong>{keepAspectRatio ? t("On", "চালু") : t("Off", "বন্ধ")}</strong>
                    </button>
                    <span className="tabular-nums text-[11px]">
                      {t("Max", "সর্বোচ্চ")} {MAX_IMAGE_DIMENSION.toLocaleString("en-US")}px
                    </span>
                  </div>
                </div>
              )}

              {/* Mode 3: Scale by Percentage */}
              {resizeMode === "percentage" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor={percentInputId}
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      {t("Scale percentage (%)", "স্কেল শতাংশ (%)")}
                    </label>
                    <div className="relative mt-1">
                      <input
                        id={percentInputId}
                        type="text"
                        inputMode="numeric"
                        value={percentText}
                        onChange={(e) => setPercentText(e.target.value)}
                        aria-invalid={Boolean(percentValidation.error)}
                        className={`${inputBase} pr-9 ${
                          percentValidation.error
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500"
                            : ""
                        }`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        %
                      </span>
                    </div>
                    {percentValidation.error && (
                      <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                        {percentValidation.error}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {PERCENT_PRESETS.map((pct) => (
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

              {/* Allow Enlarging Checkbox (for both Dimensions & Percentage modes) */}
              {resizeMode !== "original" && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
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
                          `Off by default so smaller images are never upscaled. Max scale ${MAX_SCALE_PERCENT}%.`,
                          "ডিফল্টভাবে বন্ধ থাকে যাতে ছোট ছবি বড় হয়ে ঝাপসা না হয়।"
                        )}
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Re-convert Button */}
            {items.length > 0 && (
              <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  disabled={!webpSupported || hasValidationError || isProcessing}
                  onClick={handleReconvertAll}
                  className={`${primaryBtn} w-full`}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  {isProcessing
                    ? t("Converting…", "রূপান্তর চলছে…")
                    : t(
                        `Re-convert all (${items.length})`,
                        `সব পুনরায় রূপান্তর (${toBanglaDigits(items.length)})`
                      )}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                  {t(
                    "Applies your current quality & resize settings without re-uploading.",
                    "পুনরায় আপলোড ছাড়াই নতুন সেটিংস প্রয়োগ হবে।"
                  )}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Panel: Dropzone + Batch Summary + Per-File Results ─ */}
        <div className="space-y-5">
          {/* Drag-and-Drop / File Picker Zone */}
          <div
            role="button"
            tabIndex={webpSupported ? 0 : -1}
            aria-label={t(
              "Upload JPG or PNG images by clicking or dragging and dropping",
              "JPG বা PNG ছবি আপলোড করতে ক্লিক করুন বা ড্র্যাগ অ্যান্ড ড্রপ করুন"
            )}
            aria-disabled={!webpSupported}
            onClick={() => webpSupported && fileInputRef.current?.click()}
            onKeyDown={handleDropzoneKeyDown}
            onDragOver={handleDropzoneDragOver}
            onDragEnter={handleDropzoneDragOver}
            onDragLeave={handleDropzoneDragLeave}
            onDrop={handleDropzoneDrop}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${
              !webpSupported
                ? "cursor-not-allowed border-slate-200 bg-slate-100/60 opacity-60 dark:border-slate-800 dark:bg-slate-900/50"
                : isDragging
                  ? "border-emerald-500 bg-emerald-50/70 dark:border-emerald-400 dark:bg-emerald-500/10"
                  : "border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/60 dark:hover:bg-slate-800/50"
            }`}
          >
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              disabled={!webpSupported}
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
                ? t("Drop your JPG or PNG images here", "এখানে JPG বা PNG ছবি ছাড়ুন")
                : t(
                    "Drop JPG / PNG images here, or click to browse",
                    "JPG / PNG ছবি এখানে ড্রপ করুন বা ব্রাউজ করতে ক্লিক করুন"
                  )}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t(
                "Select one or multiple files · PNG transparency preserved · Processed 100% locally in your browser",
                "এক বা একাধিক ফাইল বাছাই করুন · PNG স্বচ্ছতা অক্ষুণ্ণ থাকে · সম্পূর্ণ ব্রাউজারেই প্রসেস হয়"
              )}
            </p>
          </div>

          {/* Inline Rejected Files Notice */}
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
                      "Some files were skipped (only JPG/JPEG and PNG are supported):",
                      "কিছু ফাইল বাদ দেওয়া হয়েছে (শুধুমাত্র JPG/JPEG ও PNG সমর্থিত):"
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

          {/* Batch Progress & Summary Toolbar */}
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
                          ? `রূপান্তর চলছে: ${toBanglaDigits(progress.current)} / ${toBanglaDigits(progress.total)}`
                          : `Converting ${progress.current} of ${progress.total}…`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span className="tabular-nums">
                        {isBn
                          ? `${toBanglaDigits(batchSummary.count)}টি ছবি রূপান্তরিত`
                          : `${batchSummary.count} of ${items.length} converted`}
                      </span>
                    </div>
                  )}

                  {batchSummary.count > 0 && (
                    <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {formatFileSize(batchSummary.totalOriginal)} →{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {formatFileSize(batchSummary.totalNew)}
                      </strong>{" "}
                      {batchSummary.savedBytes >= 0 ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          (−{batchSummary.savedPercent.toFixed(1)}% ·{" "}
                          {formatFileSize(batchSummary.savedBytes)}{" "}
                          {t("saved", "সাশ্রয়")})
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          (+{Math.abs(batchSummary.savedPercent).toFixed(1)}%{" "}
                          {t("larger", "বড়")})
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

          {/* Per-File Result List */}
          {items.length > 0 && (
            <ul className="space-y-3" aria-live="polite">
              {items.map((item) => {
                const previewSrc = item.resultUrl ?? item.sourcePreviewUrl;
                const outputName =
                  item.result?.outputFilename ?? toWebpFilename(item.file.name);

                return (
                  <li key={item.id} className={`${card} p-4`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {/* Thumbnail Preview (checkered backdrop shows PNG transparency) */}
                      <div
                        className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.18) 75%)",
                          backgroundSize: "12px 12px",
                          backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
                        }}
                      >
                        <Image
                          src={previewSrc}
                          alt={item.file.name}
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-contain"
                        />
                      </div>

                      {/* File Info & Metrics */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            title={item.file.name}
                            className="truncate text-sm font-bold text-slate-900 dark:text-white"
                          >
                            {item.file.name}
                          </p>
                          {item.status === "done" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <ArrowRight className="h-3 w-3" aria-hidden="true" />
                              {outputName}
                            </span>
                          )}
                        </div>

                        {item.status === "queued" && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("Queued for conversion…", "রূপান্তরের জন্য অপেক্ষমাণ…")}
                          </p>
                        )}

                        {item.status === "converting" && (
                          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <RefreshCw
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                            {t("Converting to WebP…", "WebP-তে রূপান্তর হচ্ছে…")}
                          </p>
                        )}

                        {item.status === "error" && (
                          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {item.errorMessage}
                          </p>
                        )}

                        {item.status === "done" && item.result && (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums text-slate-600 dark:text-slate-400">
                              <span>
                                {t("Dimensions:", "সাইজ:")}{" "}
                                <span className="text-slate-500 dark:text-slate-400">
                                  {item.result.originalWidth}×{item.result.originalHeight}
                                </span>
                                {(item.result.width !== item.result.originalWidth ||
                                  item.result.height !== item.result.originalHeight) && (
                                  <>
                                    {" → "}
                                    <strong className="text-slate-900 dark:text-white">
                                      {item.result.width}×{item.result.height}
                                    </strong>
                                  </>
                                )}
                              </span>

                              <span>
                                {t("Size:", "আকার:")}{" "}
                                <span className="text-slate-500 dark:text-slate-400">
                                  {formatFileSize(item.result.originalSize)}
                                </span>
                                {" → "}
                                <strong className="text-slate-900 dark:text-white">
                                  {formatFileSize(item.result.newSize)}
                                </strong>
                              </span>

                              {!item.result.isLarger ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                                  <Check className="h-3 w-3" aria-hidden="true" />−
                                  {item.result.savedPercent.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                  +{Math.abs(item.result.savedPercent).toFixed(1)}%
                                </span>
                              )}
                            </div>

                            {item.result.isLarger && (
                              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                {t(
                                  "WebP is larger than the original (often happens on already-compressed JPGs or high quality settings). Try lowering quality.",
                                  "WebP ফাইলটি মূলের চেয়ে বড় হয়েছে। ভালো সাশ্রয়ের জন্য কোয়ালিটি কিছুটা কমিয়ে পুনরায় রূপান্তর করুন।"
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {item.status === "done" && item.result && item.resultUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              triggerBlobDownload(
                                item.resultUrl!,
                                item.result!.outputFilename
                              )
                            }
                            className={primaryBtn}
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            {t("Download", "ডাউনলোড")}
                          </button>
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

          {/* Empty State Info Strip */}
          {items.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  titleEn: "100% Private & Local",
                  titleBn: "সম্পূর্ণ নিরাপদ ও লোকাল",
                  descEn:
                    "Images never leave your device. Conversion runs directly on the HTML5 Canvas API.",
                  descBn:
                    "আপনার ছবি কখনো সার্ভারে যায় না; সরাসরি আপনার ব্রাউজারেই রূপান্তর হয়।",
                },
                {
                  titleEn: "Smart Resize & Aspect Lock",
                  titleBn: "স্মার্ট রিসাইজ ও অনুপাত লক",
                  descEn:
                    "Downscale by exact pixels or percentage with high-quality smoothing and anti-upscale protection.",
                  descBn:
                    "সঠিক পিক্সেল বা শতাংশে উচ্চ মানের রিসাইজ করুন অনুপাত ঠিক রেখে।",
                },
                {
                  titleEn: "Batch Convert & ZIP Export",
                  titleBn: "ব্যাচ কনভার্ট ও ZIP ডাউনলোড",
                  descEn:
                    "Drop multiple JPG/PNG images, tweak quality live without re-uploading, and grab one ZIP.",
                  descBn:
                    "একসাথে অনেক ছবি রূপান্তর করে এক ক্লিকে ZIP ফাইল ডাউনলোড করুন।",
                },
              ].map((feat) => (
                <div key={feat.titleEn} className={`${card} p-4`}>
                  <div className="flex items-center gap-2">
                    <FileImage
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

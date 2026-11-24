export const MAX_RESIZE_DIMENSION = 10000;
export const MIN_RESIZE_DIMENSION = 1;
export const MIN_RESIZE_PERCENT = 1;
export const MAX_RESIZE_PERCENT = 400;
export const DEFAULT_LOSSY_QUALITY = 92;
export const MIN_LOSSY_QUALITY = 50;
export const MAX_LOSSY_QUALITY = 100;
export const MIN_TARGET_KB = 5;
export const MAX_TARGET_KB = 20000;
const MIN_AUTO_QUALITY = 0.08;
const MIN_AUTO_DIMENSION = 32;

export type SupportedFormatKey = "jpeg" | "png" | "webp";
export type ResizeInputMode = "dimensions" | "percentage";
export type ResizeFitMode = "fit" | "cover" | "stretch";

export interface ImageFormatInfo {
  key: SupportedFormatKey;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  label: "JPG" | "PNG" | "WebP";
  extension: string;
  supportsQuality: boolean;
  supportsAlpha: boolean;
}

export interface ResizePreset {
  id: string;
  group: "social" | "forms";
  labelEn: string;
  labelBn: string;
  width: number;
  height: number;
  recommendedFit: ResizeFitMode;
}

export interface SameFormatResizeOptions {
  mode: ResizeInputMode;
  fitMode: ResizeFitMode;
  width: number | null;
  height: number | null;
  percentage: number;
  allowEnlarging: boolean;
  /** Used only for lossy formats (JPG & WebP); PNG remains lossless */
  quality: number;
  /** Optional maximum output file size in kilobytes (e.g. 200 for "Under 200 KB") */
  targetMaxKb: number | null;
}

export interface ResizeDrawPlan {
  destWidth: number;
  destHeight: number;
  srcX: number;
  srcY: number;
  srcWidth: number;
  srcHeight: number;
  wasResized: boolean;
  wasCropped: boolean;
  wasClampedToOriginal: boolean;
}

export interface SameFormatResizeResult {
  blob: Blob;
  outputFilename: string;
  format: ImageFormatInfo;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
  sizeDeltaPercent: number;
  wasCropped: boolean;
  wasClampedToOriginal: boolean;
  targetMaxKb: number | null;
  targetMet: boolean | null;
  appliedQuality: number | null;
  autoDownscaledForTarget: boolean;
}

export const RESIZE_PRESETS: readonly ResizePreset[] = [
  {
    id: "yt-thumb",
    group: "social",
    labelEn: "YouTube Thumbnail",
    labelBn: "ইউটিউব থাম্বনেইল",
    width: 1280,
    height: 720,
    recommendedFit: "cover",
  },
  {
    id: "ig-square",
    group: "social",
    labelEn: "Instagram Post",
    labelBn: "ইনস্টাগ্রাম পোস্ট",
    width: 1080,
    height: 1080,
    recommendedFit: "cover",
  },
  {
    id: "ig-story",
    group: "social",
    labelEn: "Story / Reels",
    labelBn: "স্টোরি / রিলস",
    width: 1080,
    height: 1920,
    recommendedFit: "cover",
  },
  {
    id: "fb-cover",
    group: "social",
    labelEn: "Facebook Cover",
    labelBn: "ফেসবুক কভার",
    width: 820,
    height: 312,
    recommendedFit: "cover",
  },
  {
    id: "full-hd",
    group: "social",
    labelEn: "Full HD 1080p",
    labelBn: "ফুল এইচডি ১০৮০পি",
    width: 1920,
    height: 1080,
    recommendedFit: "fit",
  },
  {
    id: "bd-job-photo",
    group: "forms",
    labelEn: "Teletalk / BCS Photo",
    labelBn: "টেলিটক / বিসিএস ছবি",
    width: 300,
    height: 300,
    recommendedFit: "cover",
  },
  {
    id: "bd-job-sig",
    group: "forms",
    labelEn: "Teletalk Signature",
    labelBn: "টেলিটক স্বাক্ষর",
    width: 300,
    height: 80,
    recommendedFit: "cover",
  },
  {
    id: "passport",
    group: "forms",
    labelEn: "Passport Square",
    labelBn: "পাসপোর্ট (৬০০×৬০০)",
    width: 600,
    height: 600,
    recommendedFit: "cover",
  },
];

/**
 * Detects an accepted source image format (JPG/JPEG, PNG, WebP) and preserves its exact MIME/extension.
 */
export function detectSupportedImageFormat(
  file: Pick<File, "name" | "type">
): ImageFormatInfo | null {
  const mime = file.type.trim().toLowerCase();
  const name = file.name.trim();
  const extMatch = name.match(/\.([a-z0-9]+)$/i);
  const rawExt = extMatch ? extMatch[1].toLowerCase() : "";

  if (mime === "image/jpeg" || mime === "image/jpg" || (!mime && (rawExt === "jpg" || rawExt === "jpeg"))) {
    return {
      key: "jpeg",
      mimeType: "image/jpeg",
      label: "JPG",
      extension: rawExt === "jpeg" ? ".jpeg" : ".jpg",
      supportsQuality: true,
      supportsAlpha: false,
    };
  }

  if (mime === "image/png" || (!mime && rawExt === "png")) {
    return {
      key: "png",
      mimeType: "image/png",
      label: "PNG",
      extension: ".png",
      supportsQuality: false,
      supportsAlpha: true,
    };
  }

  if (mime === "image/webp" || (!mime && rawExt === "webp")) {
    return {
      key: "webp",
      mimeType: "image/webp",
      label: "WebP",
      extension: ".webp",
      supportsQuality: true,
      supportsAlpha: true,
    };
  }

  return null;
}

/**
 * Preserves the exact original filename & extension (falling back to format extension if missing).
 */
export function buildResizedFilename(
  originalName: string,
  format: ImageFormatInfo
): string {
  const trimmed = originalName.trim();
  if (!trimmed) return `resized-image${format.extension}`;
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) {
    return `${trimmed}${format.extension}`;
  }
  const base = trimmed.slice(0, lastDot);
  const currentExt = trimmed.slice(lastDot).toLowerCase();
  if (
    (format.key === "jpeg" && (currentExt === ".jpg" || currentExt === ".jpeg")) ||
    (format.key === "png" && currentExt === ".png") ||
    (format.key === "webp" && currentExt === ".webp")
  ) {
    return `${base}${currentExt}`;
  }
  return `${base}${format.extension}`;
}

export function deduplicateResizedName(
  desiredName: string,
  usedNames: Set<string>
): string {
  const key = desiredName.toLowerCase();
  if (!usedNames.has(key)) {
    usedNames.add(key);
    return desiredName;
  }
  const lastDot = desiredName.lastIndexOf(".");
  const base = lastDot > 0 ? desiredName.slice(0, lastDot) : desiredName;
  const ext = lastDot > 0 ? desiredName.slice(lastDot) : "";

  let n = 2;
  while (n < 10000) {
    const candidate = `${base} (${n})${ext}`;
    if (!usedNames.has(candidate.toLowerCase())) {
      usedNames.add(candidate.toLowerCase());
      return candidate;
    }
    n += 1;
  }
  return `${base}-${Date.now()}${ext}`;
}

export function parsePositiveDimension(raw: string): {
  value: number | null;
  error: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };
  if (!/^\d+$/.test(trimmed)) {
    return { value: null, error: "Enter a whole positive number." };
  }
  const num = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(num) || num < MIN_RESIZE_DIMENSION) {
    return { value: null, error: `Minimum is ${MIN_RESIZE_DIMENSION}px.` };
  }
  if (num > MAX_RESIZE_DIMENSION) {
    return {
      value: null,
      error: `Maximum is ${MAX_RESIZE_DIMENSION.toLocaleString("en-US")}px.`,
    };
  }
  return { value: num, error: null };
}

export function parseScalePercent(
  raw: string,
  allowEnlarging: boolean
): { value: number | null; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: "Enter a percentage." };
  if (!/^\d+$/.test(trimmed)) {
    return { value: null, error: "Enter a whole positive percentage." };
  }
  const num = Number.parseInt(trimmed, 10);
  const maxAllowed = allowEnlarging ? MAX_RESIZE_PERCENT : 100;
  if (num < MIN_RESIZE_PERCENT) {
    return { value: null, error: `Minimum is ${MIN_RESIZE_PERCENT}%.` };
  }
  if (num > maxAllowed) {
    return {
      value: null,
      error: allowEnlarging
        ? `Maximum is ${MAX_RESIZE_PERCENT}%.`
        : "Enable 'Allow enlarging' to scale above 100%.",
    };
  }
  return { value: num, error: null };
}

/**
 * Validates an optional target max file size in KB (empty string = disabled).
 */
export function parseTargetKbInput(raw: string): {
  value: number | null;
  error: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };
  if (!/^\d+$/.test(trimmed)) {
    return { value: null, error: "Enter a whole number in KB (e.g. 200)." };
  }
  const num = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(num) || num < MIN_TARGET_KB) {
    return { value: null, error: `Minimum target size is ${MIN_TARGET_KB} KB.` };
  }
  if (num > MAX_TARGET_KB) {
    return {
      value: null,
      error: `Maximum target size is ${MAX_TARGET_KB.toLocaleString("en-US")} KB.`,
    };
  }
  return { value: num, error: null };
}

/**
 * Estimates a safe proportional scale factor (< 1) to reduce encoded byte size toward targetBytes.
 */
export function computeNextDownscaleFactor(
  currentBytes: number,
  targetBytes: number
): number {
  if (currentBytes <= 0 || targetBytes <= 0 || currentBytes <= targetBytes) {
    return 1;
  }
  const ratio = Math.sqrt(targetBytes / currentBytes) * 0.92;
  return Math.max(0.45, Math.min(0.88, ratio));
}

export function computeLinkedDimension(
  axis: "width" | "height",
  value: number,
  refWidth: number,
  refHeight: number
): number {
  if (refWidth <= 0 || refHeight <= 0 || value <= 0) return value;
  const computed =
    axis === "width"
      ? Math.round((value * refHeight) / refWidth)
      : Math.round((value * refWidth) / refHeight);
  return Math.max(MIN_RESIZE_DIMENSION, Math.min(MAX_RESIZE_DIMENSION, computed));
}

function clampPx(v: number): number {
  return Math.max(MIN_RESIZE_DIMENSION, Math.min(MAX_RESIZE_DIMENSION, Math.round(v)));
}

/**
 * Pure resize & center-crop draw plan supporting Fit (aspect locked), Cover (smart center crop),
 * Stretch (exact fill), Percentage scaling, and anti-upscale clamping.
 */
export function computeResizePlan(
  originalWidth: number,
  originalHeight: number,
  options: SameFormatResizeOptions
): ResizeDrawPlan {
  const origW = Math.max(1, Math.round(originalWidth));
  const origH = Math.max(1, Math.round(originalHeight));

  if (options.mode === "percentage") {
    const rawPct = Number.isFinite(options.percentage) ? options.percentage : 100;
    const effectivePct = options.allowEnlarging
      ? Math.min(MAX_RESIZE_PERCENT, Math.max(MIN_RESIZE_PERCENT, rawPct))
      : Math.min(100, Math.max(MIN_RESIZE_PERCENT, rawPct));
    const wasClamped = !options.allowEnlarging && rawPct > 100;
    const scale = effectivePct / 100;
    const destW = clampPx(origW * scale);
    const destH = clampPx(origH * scale);
    return {
      destWidth: destW,
      destHeight: destH,
      srcX: 0,
      srcY: 0,
      srcWidth: origW,
      srcHeight: origH,
      wasResized: destW !== origW || destH !== origH,
      wasCropped: false,
      wasClampedToOriginal: wasClamped,
    };
  }

  // mode === "dimensions"
  const reqW = options.width && options.width > 0 ? clampPx(options.width) : null;
  const reqH = options.height && options.height > 0 ? clampPx(options.height) : null;

  if (reqW === null && reqH === null) {
    return {
      destWidth: origW,
      destHeight: origH,
      srcX: 0,
      srcY: 0,
      srcWidth: origW,
      srcHeight: origH,
      wasResized: false,
      wasCropped: false,
      wasClampedToOriginal: false,
    };
  }

  // 1. Fit (Keep Aspect Ratio — never crops, never stretches)
  if (options.fitMode === "fit" || reqW === null || reqH === null) {
    let scale: number;
    if (reqW !== null && reqH !== null) {
      scale = Math.min(reqW / origW, reqH / origH);
    } else if (reqW !== null) {
      scale = reqW / origW;
    } else {
      scale = (reqH as number) / origH;
    }

    let wasClamped = false;
    if (!options.allowEnlarging && scale > 1) {
      scale = 1;
      wasClamped = true;
    }

    const maxScale = Math.min(
      MAX_RESIZE_DIMENSION / origW,
      MAX_RESIZE_DIMENSION / origH
    );
    scale = Math.min(scale, maxScale);

    const destW = clampPx(origW * scale);
    const destH = clampPx(origH * scale);
    return {
      destWidth: destW,
      destHeight: destH,
      srcX: 0,
      srcY: 0,
      srcWidth: origW,
      srcHeight: origH,
      wasResized: destW !== origW || destH !== origH,
      wasCropped: false,
      wasClampedToOriginal: wasClamped,
    };
  }

  // 2. Smart Center-Crop (Cover — exact target aspect ratio without distortion)
  if (options.fitMode === "cover") {
    const targetRatio = reqW / reqH;
    const origRatio = origW / origH;

    let cropW = origW;
    let cropH = origH;
    if (origRatio > targetRatio) {
      // Source is wider than target -> crop left/right equally
      cropW = Math.max(1, Math.round(origH * targetRatio));
      cropH = origH;
    } else if (origRatio < targetRatio) {
      // Source is taller than target -> crop top/bottom equally
      cropW = origW;
      cropH = Math.max(1, Math.round(origW / targetRatio));
    }

    const srcX = Math.max(0, Math.floor((origW - cropW) / 2));
    const srcY = Math.max(0, Math.floor((origH - cropH) / 2));

    let destW = reqW;
    let destH = reqH;
    let wasClamped = false;

    if (!options.allowEnlarging && (destW > cropW || destH > cropH)) {
      // Preserve exact target aspect ratio without upscaling beyond cropped source pixels
      const downScale = Math.min(cropW / destW, cropH / destH);
      destW = clampPx(destW * downScale);
      destH = clampPx(destH * downScale);
      wasClamped = true;
    }

    return {
      destWidth: destW,
      destHeight: destH,
      srcX,
      srcY,
      srcWidth: cropW,
      srcHeight: cropH,
      wasResized: destW !== origW || destH !== origH,
      wasCropped: cropW !== origW || cropH !== origH,
      wasClampedToOriginal: wasClamped,
    };
  }

  // 3. Stretch (Exact Fill — ignores aspect ratio)
  let destW = reqW;
  let destH = reqH;
  let wasClamped = false;
  if (!options.allowEnlarging) {
    if (destW > origW || destH > origH) {
      wasClamped = true;
    }
    destW = Math.min(destW, origW);
    destH = Math.min(destH, origH);
  }

  return {
    destWidth: clampPx(destW),
    destHeight: clampPx(destH),
    srcX: 0,
    srcY: 0,
    srcWidth: origW,
    srcHeight: origH,
    wasResized: destW !== origW || destH !== origH,
    wasCropped: false,
    wasClampedToOriginal: wasClamped,
  };
}

export function formatBytesCompact(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface DecodedSource {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decodeImage(file: File): Promise<DecodedSource> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fallback to HTMLImageElement
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export async function probeImageSize(
  file: File
): Promise<{ width: number; height: number }> {
  const decoded = await decodeImage(file);
  try {
    return { width: decoded.width, height: decoded.height };
  } finally {
    decoded.cleanup();
  }
}

function drawToCanvas(
  source: CanvasImageSource,
  format: ImageFormatInfo,
  srcX: number,
  srcY: number,
  srcWidth: number,
  srcHeight: number,
  destWidth: number,
  destHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = destWidth;
  canvas.height = destHeight;

  const ctx = canvas.getContext("2d", { alpha: format.supportsAlpha });
  if (!ctx) {
    throw new Error("CANVAS_UNAVAILABLE");
  }

  if (format.supportsAlpha) {
    ctx.clearRect(0, 0, destWidth, destHeight);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, destWidth, destHeight);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    srcX,
    srcY,
    srcWidth,
    srcHeight,
    0,
    0,
    destWidth,
    destHeight
  );
  return canvas;
}

function encodeCanvasBlob(
  canvas: HTMLCanvasElement,
  mimeType: ImageFormatInfo["mimeType"],
  quality?: number
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("ENCODE_FAILED"));
          return;
        }
        resolve(result);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Binary-searches lossy quality (0.08..maxQuality) to find the highest visual quality
 * that stays at or below targetBytes.
 */
async function binarySearchLossyQuality(
  canvas: HTMLCanvasElement,
  mimeType: ImageFormatInfo["mimeType"],
  maxQuality: number,
  targetBytes: number
): Promise<{ blob: Blob; quality: number; met: boolean }> {
  // Check minimum quality first to know whether this canvas size can fit at all
  const minBlob = await encodeCanvasBlob(canvas, mimeType, MIN_AUTO_QUALITY);
  if (minBlob.size > targetBytes) {
    return { blob: minBlob, quality: MIN_AUTO_QUALITY, met: false };
  }

  let low = MIN_AUTO_QUALITY;
  let high = maxQuality;
  let bestBlob = minBlob;
  let bestQuality = MIN_AUTO_QUALITY;

  for (let step = 0; step < 7; step += 1) {
    const mid = (low + high) / 2;
    const candidate = await encodeCanvasBlob(canvas, mimeType, mid);
    if (candidate.size <= targetBytes) {
      bestBlob = candidate;
      bestQuality = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return { blob: bestBlob, quality: bestQuality, met: true };
}

/**
 * Resizes a JPG/JPEG, PNG, or WebP file client-side while preserving its exact original file format.
 * When `targetMaxKb` is provided, automatically optimizes quality (JPG/WebP) and progressively
 * downscales if necessary (PNG or very large lossy images) to stay under the target KB budget.
 */
export async function resizeImageSameFormat(
  file: File,
  options: SameFormatResizeOptions
): Promise<SameFormatResizeResult> {
  const format = detectSupportedImageFormat(file);
  if (!format) {
    throw new Error("UNSUPPORTED_FORMAT");
  }

  const decoded = await decodeImage(file);
  try {
    const { width: origW, height: origH } = decoded;
    if (origW <= 0 || origH <= 0) {
      throw new Error("INVALID_IMAGE_DIMENSIONS");
    }

    const plan = computeResizePlan(origW, origH, options);
    const startQuality = format.supportsQuality
      ? Math.min(
          MAX_LOSSY_QUALITY,
          Math.max(MIN_LOSSY_QUALITY, Math.round(options.quality))
        ) / 100
      : undefined;

    let finalWidth = plan.destWidth;
    let finalHeight = plan.destHeight;
    let canvas = drawToCanvas(
      decoded.source,
      format,
      plan.srcX,
      plan.srcY,
      plan.srcWidth,
      plan.srcHeight,
      finalWidth,
      finalHeight
    );

    let blob = await encodeCanvasBlob(canvas, format.mimeType, startQuality);
    let appliedQuality: number | null =
      startQuality !== undefined ? Math.round(startQuality * 100) : null;
    let autoDownscaledForTarget = false;
    let targetMet: boolean | null = null;

    const targetKb =
      options.targetMaxKb && options.targetMaxKb >= MIN_TARGET_KB
        ? Math.round(options.targetMaxKb)
        : null;

    if (targetKb !== null) {
      const targetBytes = targetKb * 1024;

      if (blob.size <= targetBytes) {
        targetMet = true;
      } else if (format.supportsQuality && startQuality !== undefined) {
        // Step 1: Try keeping requested dimensions and optimizing JPG/WebP quality
        const search = await binarySearchLossyQuality(
          canvas,
          format.mimeType,
          startQuality,
          targetBytes
        );
        blob = search.blob;
        appliedQuality = Math.round(search.quality * 100);
        targetMet = search.met;

        // Step 2: If even minimum quality exceeds targetBytes, progressively downscale dimensions
        let attempts = 0;
        while (
          !targetMet &&
          attempts < 6 &&
          Math.max(finalWidth, finalHeight) > MIN_AUTO_DIMENSION
        ) {
          attempts += 1;
          const factor = computeNextDownscaleFactor(blob.size, targetBytes);
          const nextW = Math.max(MIN_AUTO_DIMENSION, Math.round(finalWidth * factor));
          const nextH = Math.max(MIN_AUTO_DIMENSION, Math.round(finalHeight * factor));
          if (nextW === finalWidth && nextH === finalHeight) break;

          finalWidth = nextW;
          finalHeight = nextH;
          autoDownscaledForTarget = true;

          canvas = drawToCanvas(
            decoded.source,
            format,
            plan.srcX,
            plan.srcY,
            plan.srcWidth,
            plan.srcHeight,
            finalWidth,
            finalHeight
          );

          // Try a balanced quality at the smaller dimensions before binary searching
          const balanced = Math.min(startQuality, 0.78);
          const trial = await encodeCanvasBlob(canvas, format.mimeType, balanced);
          if (trial.size <= targetBytes) {
            blob = trial;
            appliedQuality = Math.round(balanced * 100);
            targetMet = true;
            break;
          }

          const stepSearch = await binarySearchLossyQuality(
            canvas,
            format.mimeType,
            balanced,
            targetBytes
          );
          blob = stepSearch.blob;
          appliedQuality = Math.round(stepSearch.quality * 100);
          targetMet = stepSearch.met;
        }
      } else {
        // Lossless PNG: progressively downscale dimensions while keeping PNG transparency
        targetMet = false;
        let attempts = 0;
        while (
          blob.size > targetBytes &&
          attempts < 8 &&
          Math.max(finalWidth, finalHeight) > MIN_AUTO_DIMENSION
        ) {
          attempts += 1;
          const factor = computeNextDownscaleFactor(blob.size, targetBytes);
          const nextW = Math.max(MIN_AUTO_DIMENSION, Math.round(finalWidth * factor));
          const nextH = Math.max(MIN_AUTO_DIMENSION, Math.round(finalHeight * factor));
          if (nextW === finalWidth && nextH === finalHeight) break;

          finalWidth = nextW;
          finalHeight = nextH;
          autoDownscaledForTarget = true;

          canvas = drawToCanvas(
            decoded.source,
            format,
            plan.srcX,
            plan.srcY,
            plan.srcWidth,
            plan.srcHeight,
            finalWidth,
            finalHeight
          );
          blob = await encodeCanvasBlob(canvas, format.mimeType);
          if (blob.size <= targetBytes) {
            targetMet = true;
            break;
          }
        }
      }
    }

    const sizeDeltaPercent =
      file.size > 0 ? ((file.size - blob.size) / file.size) * 100 : 0;

    return {
      blob,
      outputFilename: buildResizedFilename(file.name, format),
      format,
      originalWidth: origW,
      originalHeight: origH,
      width: finalWidth,
      height: finalHeight,
      originalSize: file.size,
      newSize: blob.size,
      sizeDeltaPercent,
      wasCropped: plan.wasCropped,
      wasClampedToOriginal: plan.wasClampedToOriginal,
      targetMaxKb: targetKb,
      targetMet,
      appliedQuality,
      autoDownscaledForTarget,
    };
  } finally {
    decoded.cleanup();
  }
}

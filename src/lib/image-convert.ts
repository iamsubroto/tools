export const MAX_IMAGE_DIMENSION = 10000;
export const MIN_IMAGE_DIMENSION = 1;
export const MIN_WEBP_QUALITY = 10;
export const MAX_WEBP_QUALITY = 100;
export const DEFAULT_WEBP_QUALITY = 80;
export const MIN_SCALE_PERCENT = 1;
export const MAX_SCALE_PERCENT = 400;

export type ResizeMode = "original" | "dimensions" | "percentage";

export interface ResizeOptions {
  mode: ResizeMode;
  width: number | null;
  height: number | null;
  percentage: number;
  keepAspectRatio: boolean;
  allowEnlarging: boolean;
}

export interface ConvertOptions {
  quality: number;
  resize: ResizeOptions;
}

export interface ComputedDimensions {
  width: number;
  height: number;
  wasResized: boolean;
  wasClampedToOriginal: boolean;
}

export interface ConversionResult {
  blob: Blob;
  outputFilename: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
  savedPercent: number;
  isLarger: boolean;
}

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const ACCEPTED_EXTENSION_REGEX = /\.(jpe?g|png)$/i;

/**
 * Validates whether a file is an accepted JPG/JPEG or PNG image.
 */
export function isAcceptedSourceImage(file: Pick<File, "name" | "type">): boolean {
  const mime = file.type.trim().toLowerCase();
  if (mime) {
    return ACCEPTED_MIME_TYPES.has(mime);
  }
  return ACCEPTED_EXTENSION_REGEX.test(file.name.trim());
}

/**
 * Replaces a filename's extension with `.webp`.
 */
export function toWebpFilename(originalName: string): string {
  const trimmed = originalName.trim();
  if (!trimmed) return "image.webp";
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  return `${base}.webp`;
}

/**
 * Ensures unique filenames when bundling multiple converted images into a ZIP archive.
 */
export function deduplicateFilename(
  desiredName: string,
  usedNames: Set<string>
): string {
  const normalized = desiredName.toLowerCase();
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return desiredName;
  }

  const lastDot = desiredName.lastIndexOf(".");
  const base = lastDot > 0 ? desiredName.slice(0, lastDot) : desiredName;
  const ext = lastDot > 0 ? desiredName.slice(lastDot) : "";

  let counter = 2;
  while (counter < 10000) {
    const candidate = `${base} (${counter})${ext}`;
    if (!usedNames.has(candidate.toLowerCase())) {
      usedNames.add(candidate.toLowerCase());
      return candidate;
    }
    counter += 1;
  }
  return `${base}-${Date.now()}${ext}`;
}

/**
 * Validates a positive integer pixel dimension string (empty string allowed as unset).
 */
export function parseDimensionInput(raw: string): {
  value: number | null;
  error: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { value: null, error: null };
  }
  if (!/^\d+$/.test(trimmed)) {
    return {
      value: null,
      error: "Enter a whole positive number.",
    };
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_IMAGE_DIMENSION) {
    return {
      value: null,
      error: `Minimum value is ${MIN_IMAGE_DIMENSION}px.`,
    };
  }
  if (parsed > MAX_IMAGE_DIMENSION) {
    return {
      value: null,
      error: `Maximum supported dimension is ${MAX_IMAGE_DIMENSION.toLocaleString("en-US")}px.`,
    };
  }
  return { value: parsed, error: null };
}

/**
 * Validates a positive integer percentage string.
 */
export function parsePercentageInput(
  raw: string,
  allowEnlarging: boolean
): {
  value: number | null;
  error: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { value: null, error: "Enter a scale percentage." };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { value: null, error: "Enter a whole positive percentage." };
  }
  const parsed = Number.parseInt(trimmed, 10);
  const maxAllowed = allowEnlarging ? MAX_SCALE_PERCENT : 100;
  if (parsed < MIN_SCALE_PERCENT) {
    return { value: null, error: `Minimum scale is ${MIN_SCALE_PERCENT}%.` };
  }
  if (parsed > maxAllowed) {
    return {
      value: null,
      error: allowEnlarging
        ? `Maximum scale is ${MAX_SCALE_PERCENT}%.`
        : "Enable 'Allow enlarging' to scale above 100%.",
    };
  }
  return { value: parsed, error: null };
}

/**
 * Computes paired dimension preserving aspect ratio when the user edits width or height.
 */
export function computeProportionalDimension(
  changedAxis: "width" | "height",
  newValue: number,
  refWidth: number,
  refHeight: number
): number {
  if (refWidth <= 0 || refHeight <= 0 || newValue <= 0) return newValue;
  const computed =
    changedAxis === "width"
      ? Math.round((newValue * refHeight) / refWidth)
      : Math.round((newValue * refWidth) / refHeight);
  return Math.max(MIN_IMAGE_DIMENSION, Math.min(MAX_IMAGE_DIMENSION, computed));
}

function clampDim(val: number): number {
  return Math.max(
    MIN_IMAGE_DIMENSION,
    Math.min(MAX_IMAGE_DIMENSION, Math.round(val))
  );
}

/**
 * Pure resize dimension calculation applying original/dimensions/percentage modes,
 * aspect ratio lock, anti-upscale clamping, and 1..10000px bounds.
 */
export function computeTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ResizeOptions
): ComputedDimensions {
  const origW = Math.max(1, Math.round(originalWidth));
  const origH = Math.max(1, Math.round(originalHeight));

  if (options.mode === "original") {
    return {
      width: origW,
      height: origH,
      wasResized: false,
      wasClampedToOriginal: false,
    };
  }

  let targetW = origW;
  let targetH = origH;
  let wasClampedToOriginal = false;

  if (options.mode === "percentage") {
    const rawPct = Number.isFinite(options.percentage) ? options.percentage : 100;
    const effectivePct = options.allowEnlarging
      ? Math.min(MAX_SCALE_PERCENT, Math.max(MIN_SCALE_PERCENT, rawPct))
      : Math.min(100, Math.max(MIN_SCALE_PERCENT, rawPct));
    if (!options.allowEnlarging && rawPct > 100) {
      wasClampedToOriginal = true;
    }
    const scale = effectivePct / 100;
    targetW = clampDim(origW * scale);
    targetH = clampDim(origH * scale);
  } else {
    // mode === "dimensions"
    const reqW =
      options.width && options.width > 0
        ? clampDim(options.width)
        : null;
    const reqH =
      options.height && options.height > 0
        ? clampDim(options.height)
        : null;

    if (reqW === null && reqH === null) {
      targetW = origW;
      targetH = origH;
    } else if (options.keepAspectRatio) {
      let scale: number;
      if (reqW !== null && reqH !== null) {
        scale = Math.min(reqW / origW, reqH / origH);
      } else if (reqW !== null) {
        scale = reqW / origW;
      } else {
        scale = (reqH as number) / origH;
      }

      if (!options.allowEnlarging && scale > 1) {
        scale = 1;
        wasClampedToOriginal = true;
      }

      // Guard against exceeding MAX_IMAGE_DIMENSION on either axis
      const maxScale = Math.min(
        MAX_IMAGE_DIMENSION / origW,
        MAX_IMAGE_DIMENSION / origH
      );
      scale = Math.min(scale, maxScale);

      targetW = clampDim(origW * scale);
      targetH = clampDim(origH * scale);
    } else {
      const rawW = reqW ?? origW;
      const rawH = reqH ?? origH;
      if (!options.allowEnlarging) {
        if (rawW > origW || rawH > origH) {
          wasClampedToOriginal = true;
        }
        targetW = clampDim(Math.min(rawW, origW));
        targetH = clampDim(Math.min(rawH, origH));
      } else {
        targetW = clampDim(rawW);
        targetH = clampDim(rawH);
      }
    }
  }

  return {
    width: targetW,
    height: targetH,
    wasResized: targetW !== origW || targetH !== origH,
    wasClampedToOriginal,
  };
}

/**
 * Computes percentage saved (positive means smaller WebP, negative means larger).
 */
export function computeSavingsPercent(
  originalSize: number,
  newSize: number
): number {
  if (originalSize <= 0) return 0;
  return ((originalSize - newSize) / originalSize) * 100;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Checks whether the current browser can encode `image/webp` via HTML5 Canvas.
 */
export function checkWebpEncodingSupport(): boolean {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL("image/webp");
    return dataUrl.startsWith("data:image/webp");
  } catch {
    return false;
  }
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

/**
 * Decodes an image File cleanly in the browser without leaking object URLs or bitmaps.
 */
async function decodeImageFile(file: File): Promise<DecodedImage> {
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
      // Fall back to HTMLImageElement for broader compatibility
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
      el.src = objectUrl;
    });
    return {
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

/**
 * Reads only the natural dimensions of an image file.
 */
export async function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  const decoded = await decodeImageFile(file);
  try {
    return { width: decoded.width, height: decoded.height };
  } finally {
    decoded.cleanup();
  }
}

/**
 * Converts a JPG/JPEG or PNG File into a WebP Blob entirely in the browser using Canvas,
 * preserving PNG transparency and applying high-quality downscaling.
 */
export async function convertImageToWebp(
  file: File,
  options: ConvertOptions
): Promise<ConversionResult> {
  const decoded = await decodeImageFile(file);

  try {
    const { width: origW, height: origH } = decoded;
    if (origW <= 0 || origH <= 0) {
      throw new Error("Could not read valid image dimensions.");
    }

    const target = computeTargetDimensions(origW, origH, options.resize);

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable in this browser.");
    }

    // Ensure transparent canvas so PNG alpha channels are preserved cleanly
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.source, 0, 0, target.width, target.height);

    const clampedQuality = Math.min(
      MAX_WEBP_QUALITY,
      Math.max(MIN_WEBP_QUALITY, Math.round(options.quality))
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("Failed to encode image as WebP."));
            return;
          }
          if (result.type && result.type !== "image/webp") {
            reject(new Error("WEBP_UNSUPPORTED"));
            return;
          }
          resolve(result);
        },
        "image/webp",
        clampedQuality / 100
      );
    });

    const savedPercent = computeSavingsPercent(file.size, blob.size);

    return {
      blob,
      outputFilename: toWebpFilename(file.name),
      originalWidth: origW,
      originalHeight: origH,
      width: target.width,
      height: target.height,
      originalSize: file.size,
      newSize: blob.size,
      savedPercent,
      isLarger: blob.size > file.size,
    };
  } finally {
    decoded.cleanup();
  }
}

import { describe, expect, it } from "vitest";
import {
  buildResizedFilename,
  computeLinkedDimension,
  computeNextDownscaleFactor,
  computeResizePlan,
  deduplicateResizedName,
  detectSupportedImageFormat,
  parsePositiveDimension,
  parseScalePercent,
  parseTargetKbInput,
  RESIZE_PRESETS,
} from "./image-resize";

describe("detectSupportedImageFormat & filenames", () => {
  it("preserves exact format metadata for JPG, JPEG, PNG, and WebP", () => {
    expect(detectSupportedImageFormat({ name: "a.jpg", type: "image/jpeg" })).toMatchObject({
      key: "jpeg",
      mimeType: "image/jpeg",
      extension: ".jpg",
      supportsAlpha: false,
      supportsQuality: true,
    });
    expect(detectSupportedImageFormat({ name: "a.JPEG", type: "image/jpeg" })?.extension).toBe(
      ".jpeg"
    );
    expect(detectSupportedImageFormat({ name: "logo.png", type: "image/png" })).toMatchObject({
      key: "png",
      mimeType: "image/png",
      extension: ".png",
      supportsAlpha: true,
      supportsQuality: false,
    });
    expect(detectSupportedImageFormat({ name: "hero.webp", type: "image/webp" })).toMatchObject({
      key: "webp",
      mimeType: "image/webp",
      extension: ".webp",
      supportsAlpha: true,
      supportsQuality: true,
    });
  });

  it("rejects unsupported file formats", () => {
    expect(detectSupportedImageFormat({ name: "anim.gif", type: "image/gif" })).toBeNull();
    expect(detectSupportedImageFormat({ name: "icon.svg", type: "image/svg+xml" })).toBeNull();
    expect(detectSupportedImageFormat({ name: "file.pdf", type: "application/pdf" })).toBeNull();
  });

  it("keeps the original filename & extension and deduplicates for ZIP", () => {
    const jpg = detectSupportedImageFormat({ name: "holiday.jpg", type: "image/jpeg" })!;
    expect(buildResizedFilename("holiday.jpg", jpg)).toBe("holiday.jpg");

    const used = new Set<string>();
    expect(deduplicateResizedName("holiday.jpg", used)).toBe("holiday.jpg");
    expect(deduplicateResizedName("holiday.jpg", used)).toBe("holiday (2).jpg");
  });
});

describe("input validators", () => {
  it("validates dimensions, scale percentage, and target KB cap", () => {
    expect(parsePositiveDimension("1080")).toEqual({ value: 1080, error: null });
    expect(parsePositiveDimension("0").error).toBeTruthy();
    expect(parsePositiveDimension("10001").error).toBeTruthy();
    expect(parseScalePercent("50", false)).toEqual({ value: 50, error: null });
    expect(parseScalePercent("150", false).error).toBeTruthy();
    expect(parseScalePercent("150", true)).toEqual({ value: 150, error: null });
    expect(parseTargetKbInput("")).toEqual({ value: null, error: null });
    expect(parseTargetKbInput("200")).toEqual({ value: 200, error: null });
    expect(parseTargetKbInput("3").error).toBeTruthy();
    expect(parseTargetKbInput("25000").error).toBeTruthy();
    expect(parseTargetKbInput("abc").error).toBeTruthy();
    expect(computeLinkedDimension("width", 960, 1920, 1080)).toBe(540);
    expect(computeNextDownscaleFactor(400_000, 200_000)).toBeGreaterThan(0.5);
    expect(computeNextDownscaleFactor(400_000, 200_000)).toBeLessThan(0.88);
    expect(computeNextDownscaleFactor(100_000, 200_000)).toBe(1);
  });
});

describe("computeResizePlan", () => {
  it("fits proportionally without distortion in fit mode", () => {
    const plan = computeResizePlan(1920, 1080, {
      mode: "dimensions",
      fitMode: "fit",
      width: 1000,
      height: 1000,
      percentage: 100,
      allowEnlarging: false,
      quality: 92,
      targetMaxKb: null,
    });
    expect(plan).toEqual({
      destWidth: 1000,
      destHeight: 563,
      srcX: 0,
      srcY: 0,
      srcWidth: 1920,
      srcHeight: 1080,
      wasResized: true,
      wasCropped: false,
      wasClampedToOriginal: false,
    });
  });

  it("smart center-crops a 16:9 image to an exact 300x300 square in cover mode", () => {
    const plan = computeResizePlan(1920, 1080, {
      mode: "dimensions",
      fitMode: "cover",
      width: 300,
      height: 300,
      percentage: 100,
      allowEnlarging: false,
      quality: 92,
      targetMaxKb: null,
    });
    expect(plan).toEqual({
      destWidth: 300,
      destHeight: 300,
      srcX: 420,
      srcY: 0,
      srcWidth: 1080,
      srcHeight: 1080,
      wasResized: true,
      wasCropped: true,
      wasClampedToOriginal: false,
    });
  });

  it("prevents upscaling in cover mode when allowEnlarging is false", () => {
    const plan = computeResizePlan(400, 300, {
      mode: "dimensions",
      fitMode: "cover",
      width: 1080,
      height: 1080,
      percentage: 100,
      allowEnlarging: false,
      quality: 92,
      targetMaxKb: null,
    });
    expect(plan.destWidth).toBe(300);
    expect(plan.destHeight).toBe(300);
    expect(plan.wasCropped).toBe(true);
    expect(plan.wasClampedToOriginal).toBe(true);
  });

  it("allows upscaling in cover & stretch modes when allowEnlarging is true", () => {
    const cover = computeResizePlan(400, 300, {
      mode: "dimensions",
      fitMode: "cover",
      width: 1080,
      height: 1080,
      percentage: 100,
      allowEnlarging: true,
      quality: 92,
      targetMaxKb: null,
    });
    expect(cover.destWidth).toBe(1080);
    expect(cover.destHeight).toBe(1080);
    expect(cover.wasClampedToOriginal).toBe(false);

    const stretch = computeResizePlan(800, 600, {
      mode: "dimensions",
      fitMode: "stretch",
      width: 500,
      height: 500,
      percentage: 100,
      allowEnlarging: false,
      quality: 92,
      targetMaxKb: null,
    });
    expect(stretch.destWidth).toBe(500);
    expect(stretch.destHeight).toBe(500);
    expect(stretch.wasCropped).toBe(false);
  });

  it("scales cleanly by percentage and includes standard presets", () => {
    const plan = computeResizePlan(2000, 1000, {
      mode: "percentage",
      fitMode: "fit",
      width: null,
      height: null,
      percentage: 25,
      allowEnlarging: false,
      quality: 92,
      targetMaxKb: null,
    });
    expect(plan.destWidth).toBe(500);
    expect(plan.destHeight).toBe(250);
    expect(RESIZE_PRESETS.some((p) => p.width === 300 && p.height === 300)).toBe(true);
    expect(RESIZE_PRESETS.some((p) => p.width === 1280 && p.height === 720)).toBe(true);
  });
});

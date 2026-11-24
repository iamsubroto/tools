import { describe, expect, it } from "vitest";
import {
  computeProportionalDimension,
  computeSavingsPercent,
  computeTargetDimensions,
  deduplicateFilename,
  formatFileSize,
  isAcceptedSourceImage,
  parseDimensionInput,
  parsePercentageInput,
  toWebpFilename,
} from "./image-convert";

describe("isAcceptedSourceImage", () => {
  it("accepts JPG, JPEG, and PNG files by MIME or extension", () => {
    expect(isAcceptedSourceImage({ name: "photo.jpg", type: "image/jpeg" })).toBe(true);
    expect(isAcceptedSourceImage({ name: "photo.JPEG", type: "image/jpeg" })).toBe(true);
    expect(isAcceptedSourceImage({ name: "logo.png", type: "image/png" })).toBe(true);
    expect(isAcceptedSourceImage({ name: "fallback.png", type: "" })).toBe(true);
  });

  it("rejects non-JPG/PNG formats", () => {
    expect(isAcceptedSourceImage({ name: "anim.gif", type: "image/gif" })).toBe(false);
    expect(isAcceptedSourceImage({ name: "already.webp", type: "image/webp" })).toBe(false);
    expect(isAcceptedSourceImage({ name: "vector.svg", type: "image/svg+xml" })).toBe(false);
    expect(isAcceptedSourceImage({ name: "doc.pdf", type: "application/pdf" })).toBe(false);
  });
});

describe("filename helpers", () => {
  it("converts filename extension to .webp", () => {
    expect(toWebpFilename("hero-banner.png")).toBe("hero-banner.webp");
    expect(toWebpFilename("my.photo.v2.JPEG")).toBe("my.photo.v2.webp");
    expect(toWebpFilename("noextension")).toBe("noextension.webp");
  });

  it("deduplicates filenames case-insensitively for ZIP export", () => {
    const used = new Set<string>();
    expect(deduplicateFilename("photo.webp", used)).toBe("photo.webp");
    expect(deduplicateFilename("photo.webp", used)).toBe("photo (2).webp");
    expect(deduplicateFilename("PHOTO.webp", used)).toBe("PHOTO (3).webp");
  });
});

describe("input validation", () => {
  it("validates pixel dimensions as positive integers up to 10000", () => {
    expect(parseDimensionInput("")).toEqual({ value: null, error: null });
    expect(parseDimensionInput("1200")).toEqual({ value: 1200, error: null });
    expect(parseDimensionInput("0").error).toBeTruthy();
    expect(parseDimensionInput("-50").error).toBeTruthy();
    expect(parseDimensionInput("12.5").error).toBeTruthy();
    expect(parseDimensionInput("10001").error).toBeTruthy();
  });

  it("validates percentage scale against allowEnlarging", () => {
    expect(parsePercentageInput("75", false)).toEqual({ value: 75, error: null });
    expect(parsePercentageInput("150", false).error).toBeTruthy();
    expect(parsePercentageInput("150", true)).toEqual({ value: 150, error: null });
    expect(parsePercentageInput("401", true).error).toBeTruthy();
  });
});

describe("computeTargetDimensions", () => {
  it("keeps original size in original mode", () => {
    expect(
      computeTargetDimensions(1920, 1080, {
        mode: "original",
        width: 800,
        height: 600,
        percentage: 50,
        keepAspectRatio: true,
        allowEnlarging: false,
      })
    ).toEqual({
      width: 1920,
      height: 1080,
      wasResized: false,
      wasClampedToOriginal: false,
    });
  });

  it("downscales proportionally by width when keepAspectRatio is true", () => {
    expect(
      computeTargetDimensions(1920, 1080, {
        mode: "dimensions",
        width: 960,
        height: null,
        percentage: 100,
        keepAspectRatio: true,
        allowEnlarging: false,
      })
    ).toEqual({
      width: 960,
      height: 540,
      wasResized: true,
      wasClampedToOriginal: false,
    });
  });

  it("prevents upscaling unless allowEnlarging is enabled", () => {
    const clamped = computeTargetDimensions(800, 600, {
      mode: "dimensions",
      width: 1600,
      height: 1200,
      percentage: 100,
      keepAspectRatio: true,
      allowEnlarging: false,
    });
    expect(clamped).toEqual({
      width: 800,
      height: 600,
      wasResized: false,
      wasClampedToOriginal: true,
    });

    const enlarged = computeTargetDimensions(800, 600, {
      mode: "dimensions",
      width: 1600,
      height: 1200,
      percentage: 100,
      keepAspectRatio: true,
      allowEnlarging: true,
    });
    expect(enlarged).toEqual({
      width: 1600,
      height: 1200,
      wasResized: true,
      wasClampedToOriginal: false,
    });
  });

  it("allows stretching to exact custom dimensions when keepAspectRatio is false", () => {
    expect(
      computeTargetDimensions(1000, 800, {
        mode: "dimensions",
        width: 500,
        height: 500,
        percentage: 100,
        keepAspectRatio: false,
        allowEnlarging: false,
      })
    ).toEqual({
      width: 500,
      height: 500,
      wasResized: true,
      wasClampedToOriginal: false,
    });
  });

  it("scales accurately by percentage and respects allowEnlarging", () => {
    expect(
      computeTargetDimensions(1200, 800, {
        mode: "percentage",
        width: null,
        height: null,
        percentage: 50,
        keepAspectRatio: true,
        allowEnlarging: false,
      })
    ).toEqual({
      width: 600,
      height: 400,
      wasResized: true,
      wasClampedToOriginal: false,
    });

    expect(
      computeTargetDimensions(1200, 800, {
        mode: "percentage",
        width: null,
        height: null,
        percentage: 150,
        keepAspectRatio: true,
        allowEnlarging: false,
      })
    ).toEqual({
      width: 1200,
      height: 800,
      wasResized: false,
      wasClampedToOriginal: true,
    });
  });

  it("computes paired proportional dimensions accurately", () => {
    expect(computeProportionalDimension("width", 640, 1920, 1080)).toBe(360);
    expect(computeProportionalDimension("height", 540, 1920, 1080)).toBe(960);
  });
});

describe("savings & formatting", () => {
  it("calculates positive savings and negative increase accurately", () => {
    expect(computeSavingsPercent(1000, 250)).toBeCloseTo(75, 5);
    expect(computeSavingsPercent(1000, 1200)).toBeCloseTo(-20, 5);
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.00 MB");
  });
});

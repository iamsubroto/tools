import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("prefers explicit NEXT_PUBLIC_SITE_URL and strips trailing slashes", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://toolsbd.com///",
        VERCEL_PROJECT_PRODUCTION_URL: "tools-bd.vercel.app",
      })
    ).toBe("https://toolsbd.com");
  });

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL with https://", () => {
    expect(
      resolveSiteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "tools-bd.vercel.app/",
        VERCEL_URL: "tools-bd-git-main.vercel.app",
      })
    ).toBe("https://tools-bd.vercel.app");
  });

  it("falls back to VERCEL_URL for preview deployments", () => {
    expect(
      resolveSiteUrl({
        VERCEL_URL: "tools-bd-preview-123.vercel.app",
      })
    ).toBe("https://tools-bd-preview-123.vercel.app");
  });

  it("uses http://localhost:3000 locally instead of an unowned external domain", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});

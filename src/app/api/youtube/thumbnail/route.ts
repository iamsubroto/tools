import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ALLOWED_THUMBNAIL_VARIANTS,
  buildThumbnailUrl,
  isValidYouTubeId,
  type ThumbnailFormat,
  type ThumbnailVariant,
} from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("v")?.trim() ?? "";
  const variant = request.nextUrl.searchParams.get("variant")?.trim() ?? "maxresdefault";
  const formatParam = request.nextUrl.searchParams.get("format")?.trim() ?? "jpg";

  if (!isValidYouTubeId(videoId)) {
    return NextResponse.json({ error: "Invalid YouTube Video ID." }, { status: 400 });
  }

  if (!ALLOWED_THUMBNAIL_VARIANTS.has(variant as ThumbnailVariant)) {
    return NextResponse.json({ error: "Invalid thumbnail variant." }, { status: 400 });
  }

  const format: ThumbnailFormat = formatParam === "webp" ? "webp" : "jpg";
  const upstreamUrl = buildThumbnailUrl(videoId, variant as ThumbnailVariant, format);

  try {
    const res = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Requested thumbnail resolution is not available for this video." },
        { status: 404 }
      );
    }

    const bytes = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type") ||
      (format === "webp" ? "image/webp" : "image/jpeg");

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="youtube-${videoId}-${variant}.${format}"`,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to download thumbnail from YouTube CDN." },
      { status: 502 }
    );
  }
}

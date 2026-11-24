import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isValidYouTubeId, parseYouTubeInput } from "@/lib/youtube";
import { getYouTubeVideoInfo } from "@/lib/youtubeServer";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("v")?.trim() ?? "";
  const parsed = isValidYouTubeId(raw) ? { videoId: raw } : parseYouTubeInput(raw);

  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "Please provide a valid YouTube video URL, Shorts link, embed code, or 11-character Video ID.",
      },
      { status: 400 }
    );
  }

  try {
    const info = await getYouTubeVideoInfo(parsed.videoId);
    return NextResponse.json(info, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    if (message === "VIDEO_NOT_FOUND") {
      return NextResponse.json(
        {
          error:
            "Video not found or unavailable. Make sure the video is public or unlisted and the ID is correct.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to fetch YouTube resources right now. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}

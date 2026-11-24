import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isValidYouTubeId, parseYouTubeInput } from "@/lib/youtube";
import { getYouTubeTranscript } from "@/lib/youtubeServer";

const LANG_REGEX = /^[a-zA-Z0-9_-]{2,20}$/;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("v")?.trim() ?? "";
  const parsed = isValidYouTubeId(raw) ? { videoId: raw } : parseYouTubeInput(raw);

  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid YouTube Video ID." },
      { status: 400 }
    );
  }

  const rawLang = request.nextUrl.searchParams.get("lang")?.trim() ?? "";
  if (rawLang && !LANG_REGEX.test(rawLang)) {
    return NextResponse.json(
      { error: "Invalid caption language code." },
      { status: 400 }
    );
  }

  const rawKind = request.nextUrl.searchParams.get("kind")?.trim() ?? "";
  const kind = rawKind === "asr" ? "asr" : rawKind === "manual" ? "manual" : undefined;

  try {
    const result = await getYouTubeTranscript({
      videoId: parsed.videoId,
      lang: rawLang || undefined,
      kind,
    });
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load subtitles for this video." },
      { status: 502 }
    );
  }
}

import {
  buildThumbnailAssets,
  extractChapters,
  extractHashtags,
  formatTranscriptToPlainText,
  isValidYouTubeId,
  parseIso8601Duration,
  parseJson3Transcript,
  parseXmlTranscript,
  type CaptionTrackInfo,
  type DataSourceName,
  type ThumbnailAsset,
  type TranscriptSegment,
  type YouTubeTranscriptResponse,
  type YouTubeVideoInfo,
} from "./youtube";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface InnertubeClientProfile {
  name: "IOS" | "ANDROID";
  userAgent: string;
  client: Record<string, string>;
}

const INNERTUBE_PROFILES: readonly InnertubeClientProfile[] = [
  {
    name: "IOS",
    userAgent:
      "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
    client: {
      clientName: "IOS",
      clientVersion: "20.10.4",
      deviceMake: "Apple",
      deviceModel: "iPhone16,2",
      hl: "en",
      gl: "US",
    },
  },
  {
    name: "ANDROID",
    userAgent:
      "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip",
    client: {
      clientName: "ANDROID",
      clientVersion: "20.10.38",
      hl: "en",
      gl: "US",
    },
  },
];

const YOUTUBE_CATEGORY_MAP: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "18": "Short Movies",
  "19": "Travel & Events",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
};

interface OEmbedResult {
  title: string;
  authorName: string;
  authorUrl: string | null;
  width: number | null;
  height: number | null;
  html: string | null;
}

interface InternalCaptionTrack extends CaptionTrackInfo {
  baseUrl: string;
  userAgent: string;
}

interface PublicPlayerResult {
  title: string | null;
  description: string | null;
  channelName: string | null;
  channelId: string | null;
  publishDate: string | null;
  uploadDate: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  likeCount: number | null;
  category: string | null;
  tags: string[];
  isLiveContent: boolean;
  embeddable: boolean | null;
  captionTracks: InternalCaptionTrack[];
}

interface DataApiV3Result {
  title: string | null;
  description: string | null;
  channelName: string | null;
  channelId: string | null;
  publishDate: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  category: string | null;
  tags: string[];
  isLiveContent: boolean;
  embeddable: boolean | null;
  defaultLanguage: string | null;
}

async function fetchOEmbed(videoId: string): Promise<OEmbedResult | null> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  )}&format=json`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  return {
    title: typeof data.title === "string" ? data.title : "",
    authorName: typeof data.author_name === "string" ? data.author_name : "",
    authorUrl: typeof data.author_url === "string" ? data.author_url : null,
    width: typeof data.width === "number" ? data.width : null,
    height: typeof data.height === "number" ? data.height : null,
    html: typeof data.html === "string" ? data.html : null,
  };
}

async function fetchDataApiV3(videoId: string): Promise<DataApiV3Result | null> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,statistics,status");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    items?: Array<{
      snippet?: {
        title?: string;
        description?: string;
        channelTitle?: string;
        channelId?: string;
        publishedAt?: string;
        categoryId?: string;
        tags?: string[];
        liveBroadcastContent?: string;
        defaultAudioLanguage?: string;
        defaultLanguage?: string;
      };
      contentDetails?: { duration?: string };
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
      status?: { embeddable?: boolean };
    }>;
  };

  const item = json.items?.[0];
  if (!item) return null;

  const snippet = item.snippet;
  const stats = item.statistics;
  const parseNum = (v?: string) => {
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };

  return {
    title: snippet?.title ?? null,
    description: snippet?.description ?? null,
    channelName: snippet?.channelTitle ?? null,
    channelId: snippet?.channelId ?? null,
    publishDate: snippet?.publishedAt ?? null,
    durationSeconds: parseIso8601Duration(item.contentDetails?.duration),
    viewCount: parseNum(stats?.viewCount),
    likeCount: parseNum(stats?.likeCount),
    commentCount: parseNum(stats?.commentCount),
    category: snippet?.categoryId
      ? YOUTUBE_CATEGORY_MAP[snippet.categoryId] ?? `Category #${snippet.categoryId}`
      : null,
    tags: Array.isArray(snippet?.tags) ? snippet.tags : [],
    isLiveContent: snippet?.liveBroadcastContent === "live",
    embeddable: typeof item.status?.embeddable === "boolean" ? item.status.embeddable : null,
    defaultLanguage: snippet?.defaultAudioLanguage ?? snippet?.defaultLanguage ?? null,
  };
}

function extractPlayerObjectFromJson(
  data: unknown,
  userAgent: string
): PublicPlayerResult | null {
  if (!data || typeof data !== "object") return null;
  const root = data as {
    videoDetails?: {
      title?: string;
      shortDescription?: string;
      author?: string;
      channelId?: string;
      lengthSeconds?: string;
      viewCount?: string;
      keywords?: string[];
      isLiveContent?: boolean;
    };
    microformat?: {
      playerMicroformatRenderer?: {
        publishDate?: string;
        uploadDate?: string;
        category?: string;
      };
    };
    playabilityStatus?: {
      playableInEmbed?: boolean;
    };
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: Array<{
          baseUrl?: string;
          vssId?: string;
          languageCode?: string;
          kind?: string;
          isTranslatable?: boolean;
          name?: { simpleText?: string; runs?: Array<{ text?: string }> };
        }>;
      };
    };
  };

  const details = root.videoDetails;
  if (!details) return null;

  const micro = root.microformat?.playerMicroformatRenderer;
  const rawTracks = root.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const captionTracks: InternalCaptionTrack[] = [];

  for (const track of rawTracks) {
    if (!track.baseUrl || !track.languageCode) continue;
    // Validate caption baseUrl points strictly to YouTube's timedtext endpoint
    let validBaseUrl = "";
    try {
      const parsed = new URL(track.baseUrl);
      if (
        parsed.protocol === "https:" &&
        (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") &&
        parsed.pathname.startsWith("/api/timedtext")
      ) {
        validBaseUrl = parsed.toString();
      }
    } catch {
      continue;
    }
    if (!validBaseUrl) continue;

    const label =
      track.name?.simpleText ??
      track.name?.runs?.map((r) => r.text ?? "").join("") ??
      track.languageCode;

    captionTracks.push({
      lang: track.languageCode,
      name: label || track.languageCode,
      vssId: track.vssId ?? track.languageCode,
      kind: track.kind === "asr" ? "asr" : "manual",
      isTranslatable: Boolean(track.isTranslatable),
      baseUrl: validBaseUrl,
      userAgent,
    });
  }

  const lengthSeconds = details.lengthSeconds
    ? Number.parseInt(details.lengthSeconds, 10)
    : null;
  const viewCount = details.viewCount
    ? Number.parseInt(details.viewCount, 10)
    : null;

  return {
    title: details.title ?? null,
    description: typeof details.shortDescription === "string" ? details.shortDescription : null,
    channelName: details.author ?? null,
    channelId: details.channelId ?? null,
    publishDate: micro?.publishDate ?? null,
    uploadDate: micro?.uploadDate ?? null,
    durationSeconds: Number.isFinite(lengthSeconds ?? NaN) ? lengthSeconds : null,
    viewCount: Number.isFinite(viewCount ?? NaN) ? viewCount : null,
    likeCount: null,
    category: micro?.category ?? null,
    tags: Array.isArray(details.keywords) ? details.keywords : [],
    isLiveContent: Boolean(details.isLiveContent),
    embeddable:
      typeof root.playabilityStatus?.playableInEmbed === "boolean"
        ? root.playabilityStatus.playableInEmbed
        : null,
    captionTracks,
  };
}

/**
 * Queries YouTube's public Innertube player endpoint with a specific mobile client profile,
 * which reliably exposes videoDetails, microformat, and downloadable captionTracks without an API key.
 */
async function fetchInnertubePlayer(
  videoId: string,
  profile: InnertubeClientProfile
): Promise<PublicPlayerResult | null> {
  const res = await fetch(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": profile.userAgent,
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({
        context: {
          client: profile.client,
        },
        videoId,
      }),
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const json: unknown = await res.json();
  return extractPlayerObjectFromJson(json, profile.userAgent);
}

/**
 * Extracts balanced JSON object assigned to `ytInitialPlayerResponse` from watch HTML.
 */
function extractAssignedJson(html: string, marker: string): unknown | null {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const startBrace = html.indexOf("{", idx + marker.length);
  if (startBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startBrace; i < html.length && i - startBrace < 2_500_000; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(startBrace, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function fetchWatchPagePlayer(videoId: string): Promise<PublicPlayerResult | null> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: {
      "User-Agent": BROWSER_USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();
  const raw =
    extractAssignedJson(html, "var ytInitialPlayerResponse =") ??
    extractAssignedJson(html, "ytInitialPlayerResponse =");
  return extractPlayerObjectFromJson(raw, BROWSER_USER_AGENT);
}

async function fetchPublicPlayerMetadata(videoId: string): Promise<PublicPlayerResult | null> {
  let fallbackMetadata: PublicPlayerResult | null = null;

  for (const profile of INNERTUBE_PROFILES) {
    try {
      const result = await fetchInnertubePlayer(videoId, profile);
      if (result && result.captionTracks.length > 0) {
        return result;
      }
      if (result && result.title && !fallbackMetadata) {
        fallbackMetadata = result;
      }
    } catch {
      // Try next profile
    }
  }

  if (fallbackMetadata) return fallbackMetadata;

  try {
    return await fetchWatchPagePlayer(videoId);
  } catch {
    return null;
  }
}

async function probeThumbnails(assets: ThumbnailAsset[]): Promise<ThumbnailAsset[]> {
  const results = await Promise.all(
    assets.map(async (asset): Promise<ThumbnailAsset> => {
      try {
        const res = await fetch(asset.url, {
          method: "HEAD",
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        });
        const lengthHeader = res.headers.get("content-length");
        const parsedSize = lengthHeader ? Number.parseInt(lengthHeader, 10) : null;
        return {
          ...asset,
          available: res.ok,
          sizeBytes: res.ok && Number.isFinite(parsedSize ?? NaN) ? parsedSize : null,
        };
      } catch {
        return {
          ...asset,
          available: undefined,
          sizeBytes: null,
        };
      }
    })
  );
  return results;
}

export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
  if (!isValidYouTubeId(videoId)) {
    throw new Error("INVALID_VIDEO_ID");
  }

  const baseThumbnails = buildThumbnailAssets(videoId);

  const [oembedSettled, apiV3Settled, publicSettled, thumbsSettled] =
    await Promise.allSettled([
      fetchOEmbed(videoId),
      fetchDataApiV3(videoId),
      fetchPublicPlayerMetadata(videoId),
      probeThumbnails(baseThumbnails),
    ]);

  const oembed = oembedSettled.status === "fulfilled" ? oembedSettled.value : null;
  const apiV3 = apiV3Settled.status === "fulfilled" ? apiV3Settled.value : null;
  const pub = publicSettled.status === "fulfilled" ? publicSettled.value : null;
  const thumbnails =
    thumbsSettled.status === "fulfilled" ? thumbsSettled.value : baseThumbnails;

  if (!oembed && !apiV3 && !pub) {
    throw new Error("VIDEO_NOT_FOUND");
  }

  const sourcesUsed: DataSourceName[] = [];
  if (apiV3) sourcesUsed.push("youtube-data-api");
  if (pub) sourcesUsed.push("public-player");
  if (oembed) sourcesUsed.push("oembed");

  const warnings: string[] = [];
  if (!apiV3 && !pub) {
    warnings.push(
      "Extended metadata (full description, tags, and subtitles) was limited by YouTube for this request. Official oEmbed details and all thumbnails are ready."
    );
  }

  const title = apiV3?.title || pub?.title || oembed?.title || `YouTube Video (${videoId})`;
  const description = apiV3?.description ?? pub?.description ?? "";
  const channelName = apiV3?.channelName || pub?.channelName || oembed?.authorName || "";
  const channelId = apiV3?.channelId ?? pub?.channelId ?? null;
  const channelUrl =
    oembed?.authorUrl ??
    (channelId ? `https://www.youtube.com/channel/${channelId}` : null);
  const channelRssUrl = channelId
    ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    : null;
  const durationSeconds = apiV3?.durationSeconds ?? pub?.durationSeconds ?? null;
  const tags = (apiV3?.tags?.length ? apiV3.tags : pub?.tags) ?? [];
  const hashtags = extractHashtags(`${title}\n${description}`);
  const chapters = extractChapters(description, durationSeconds);

  // Strip private baseUrl before sending caption tracks to client
  const captionTracks: CaptionTrackInfo[] = (pub?.captionTracks ?? []).map(
    ({ lang, name, vssId, kind, isTranslatable }) => ({
      lang,
      name,
      vssId,
      kind,
      isTranslatable,
    })
  );

  const isShorts =
    Boolean(
      oembed?.width &&
        oembed?.height &&
        oembed.height > oembed.width
    ) ||
    (durationSeconds !== null && durationSeconds <= 60 && hashtags.some((h) => h.toLowerCase() === "#shorts"));

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    shortUrl: `https://youtu.be/${videoId}`,
    title,
    description,
    channelName,
    channelId,
    channelUrl,
    channelRssUrl,
    publishDate: apiV3?.publishDate ?? pub?.publishDate ?? null,
    uploadDate: pub?.uploadDate ?? apiV3?.publishDate ?? null,
    durationSeconds,
    viewCount: apiV3?.viewCount ?? pub?.viewCount ?? null,
    likeCount: apiV3?.likeCount ?? pub?.likeCount ?? null,
    commentCount: apiV3?.commentCount ?? null,
    category: apiV3?.category ?? pub?.category ?? null,
    tags,
    hashtags,
    chapters,
    isLiveContent: apiV3?.isLiveContent ?? pub?.isLiveContent ?? false,
    isShorts,
    embeddable: apiV3?.embeddable ?? pub?.embeddable ?? null,
    defaultLanguage: apiV3?.defaultLanguage ?? captionTracks[0]?.lang ?? null,
    oembedWidth: oembed?.width ?? null,
    oembedHeight: oembed?.height ?? null,
    oembedHtml: oembed?.html ?? null,
    thumbnails,
    captionTracks,
    sourcesUsed,
    warnings,
  };
}

function parseCaptionBody(body: string): TranscriptSegment[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{")) {
    try {
      return parseJson3Transcript(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }
  if (trimmed.startsWith("<")) {
    return parseXmlTranscript(trimmed);
  }
  return [];
}

async function fetchSegmentsFromTimedtextUrl(
  url: string,
  userAgent: string = BROWSER_USER_AGENT
): Promise<TranscriptSegment[]> {
  const headers = {
    "User-Agent": userAgent,
    "Accept-Language": "en-US,en;q=0.9",
  };

  // 1. Fetch YouTube's signed baseUrl untouched first (highest reliability)
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    if (res.ok) {
      const segments = parseCaptionBody(await res.text());
      if (segments.length > 0) return segments;
    }
  } catch {
    // Try explicit formats next
  }

  // 2. Fallback: explicitly request json3 or srv3
  for (const fmt of ["json3", "srv3"] as const) {
    try {
      const candidate = new URL(url);
      candidate.searchParams.set("fmt", fmt);
      const res = await fetch(candidate.toString(), {
        headers,
        signal: AbortSignal.timeout(7000),
        cache: "no-store",
      });
      if (res.ok) {
        const segments = parseCaptionBody(await res.text());
        if (segments.length > 0) return segments;
      }
    } catch {
      // Try next format
    }
  }

  return [];
}

function selectCaptionTrack(
  tracks: InternalCaptionTrack[],
  lang?: string,
  kind?: "manual" | "asr"
): InternalCaptionTrack | undefined {
  if (tracks.length === 0) return undefined;
  if (lang) {
    const exact =
      tracks.find((t) => t.lang === lang && (!kind || t.kind === kind)) ??
      tracks.find((t) => t.lang === lang);
    if (exact) return exact;
  }
  return (
    tracks.find((t) => t.kind === "manual" && t.lang.startsWith("en")) ??
    tracks.find((t) => t.kind === "manual") ??
    tracks.find((t) => t.lang.startsWith("en")) ??
    tracks[0]
  );
}

export async function getYouTubeTranscript(params: {
  videoId: string;
  lang?: string;
  kind?: "manual" | "asr";
}): Promise<YouTubeTranscriptResponse> {
  const { videoId, lang, kind } = params;
  if (!isValidYouTubeId(videoId)) {
    throw new Error("INVALID_VIDEO_ID");
  }

  let availableTracks: CaptionTrackInfo[] = [];
  let selected: InternalCaptionTrack | undefined;
  let segments: TranscriptSegment[] = [];

  // Try each Innertube mobile client profile until we obtain non-empty transcript segments
  for (const profile of INNERTUBE_PROFILES) {
    try {
      const pub = await fetchInnertubePlayer(videoId, profile);
      const internalTracks = pub?.captionTracks ?? [];
      if (internalTracks.length === 0) continue;

      if (availableTracks.length === 0) {
        availableTracks = internalTracks.map(
          ({ lang: l, name, vssId, kind: k, isTranslatable }) => ({
            lang: l,
            name,
            vssId,
            kind: k,
            isTranslatable,
          })
        );
      }

      const candidate = selectCaptionTrack(internalTracks, lang, kind);
      if (!candidate) continue;

      const fetched = await fetchSegmentsFromTimedtextUrl(
        candidate.baseUrl,
        candidate.userAgent
      );
      if (fetched.length > 0) {
        selected = candidate;
        segments = fetched;
        break;
      }
      if (!selected) {
        selected = candidate;
      }
    } catch {
      // Try next profile
    }
  }

  // Fallback: try direct public timedtext query if client profiles didn't return segments
  if (segments.length === 0 && (selected?.lang || lang)) {
    const targetLang = selected?.lang ?? lang ?? "";
    const targetKind = selected?.kind ?? kind;
    const directUrl = new URL("https://www.youtube.com/api/timedtext");
    directUrl.searchParams.set("v", videoId);
    directUrl.searchParams.set("lang", targetLang);
    if (targetKind === "asr") directUrl.searchParams.set("kind", "asr");
    segments = await fetchSegmentsFromTimedtextUrl(directUrl.toString());
  }

  const plainText = formatTranscriptToPlainText(segments);
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  return {
    videoId,
    lang: selected?.lang ?? lang ?? "",
    name: selected?.name ?? lang ?? "",
    kind: selected?.kind ?? kind ?? "manual",
    segments,
    plainText,
    wordCount,
    availableTracks,
    warning:
      segments.length === 0
        ? availableTracks.length === 0
          ? "No public subtitles or captions are available for this video."
          : "Subtitle track metadata was found, but YouTube temporarily restricted direct transcript download for this video."
        : undefined,
  };
}

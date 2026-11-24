export const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

export type YouTubeInputSourceType =
  | "video-id"
  | "watch-url"
  | "short-url"
  | "shorts-url"
  | "live-url"
  | "embed-url"
  | "music-url"
  | "thumbnail-url"
  | "iframe-html"
  | "legacy-url";

export interface ParsedYouTubeInput {
  videoId: string;
  sourceType: YouTubeInputSourceType;
  startSeconds: number | null;
  playlistId: string | null;
  canonicalUrl: string;
  shortUrl: string;
}

export type ThumbnailVariant =
  | "maxresdefault"
  | "sddefault"
  | "hqdefault"
  | "mqdefault"
  | "default"
  | "0"
  | "1"
  | "2"
  | "3";

export type ThumbnailFormat = "jpg" | "webp";

export interface ThumbnailAsset {
  id: string;
  variant: ThumbnailVariant;
  format: ThumbnailFormat;
  labelEn: string;
  labelBn: string;
  badge: string;
  width: number;
  height: number;
  aspect: string;
  category: "primary" | "frame";
  url: string;
  proxyDownloadUrl: string;
  available?: boolean;
  sizeBytes?: number | null;
}

export interface VideoChapter {
  title: string;
  startSeconds: number;
  formattedTime: string;
}

export interface CaptionTrackInfo {
  lang: string;
  name: string;
  vssId: string;
  kind: "manual" | "asr";
  isTranslatable: boolean;
}

export interface TranscriptSegment {
  startMs: number;
  durationMs: number;
  text: string;
}

export type DataSourceName =
  | "youtube-data-api"
  | "public-player"
  | "oembed";

export interface YouTubeVideoInfo {
  videoId: string;
  canonicalUrl: string;
  shortUrl: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string | null;
  channelUrl: string | null;
  channelRssUrl: string | null;
  publishDate: string | null;
  uploadDate: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  category: string | null;
  tags: string[];
  hashtags: string[];
  chapters: VideoChapter[];
  isLiveContent: boolean;
  isShorts: boolean;
  embeddable: boolean | null;
  defaultLanguage: string | null;
  oembedWidth: number | null;
  oembedHeight: number | null;
  oembedHtml: string | null;
  thumbnails: ThumbnailAsset[];
  captionTracks: CaptionTrackInfo[];
  sourcesUsed: DataSourceName[];
  warnings: string[];
}

export interface YouTubeTranscriptResponse {
  videoId: string;
  lang: string;
  name: string;
  kind: "manual" | "asr";
  segments: TranscriptSegment[];
  plainText: string;
  wordCount: number;
  availableTracks: CaptionTrackInfo[];
  warning?: string;
}

export interface EmbedOptions {
  videoId: string;
  privacyEnhanced: boolean;
  responsive: boolean;
  aspectRatio: "16:9" | "9:16" | "4:3";
  width: number;
  height: number;
  startSeconds: number;
  autoplay: boolean;
  mute: boolean;
  controls: boolean;
  loop: boolean;
  relZero: boolean;
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "gaming.youtube.com",
  "studio.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
  "i.ytimg.com",
  "i1.ytimg.com",
  "i2.ytimg.com",
  "i3.ytimg.com",
  "i4.ytimg.com",
  "img.youtube.com",
]);

export const ALLOWED_THUMBNAIL_VARIANTS: ReadonlySet<ThumbnailVariant> = new Set([
  "maxresdefault",
  "sddefault",
  "hqdefault",
  "mqdefault",
  "default",
  "0",
  "1",
  "2",
  "3",
]);

export function isValidYouTubeId(id: string): boolean {
  return YOUTUBE_ID_REGEX.test(id);
}

/**
 * Parses YouTube timestamp query values such as "90", "90s", "1m30s", "1h2m3s", or "01:30".
 */
export function parseYouTubeTimestamp(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;

  if (/^\d+$/.test(cleaned)) {
    const val = Number.parseInt(cleaned, 10);
    return Number.isFinite(val) && val >= 0 ? val : null;
  }

  // Colon format: mm:ss or hh:mm:ss
  const colonMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (colonMatch) {
    if (colonMatch[3] !== undefined) {
      const h = Number.parseInt(colonMatch[1], 10);
      const m = Number.parseInt(colonMatch[2], 10);
      const s = Number.parseInt(colonMatch[3], 10);
      return h * 3600 + m * 60 + s;
    }
    const m = Number.parseInt(colonMatch[1], 10);
    const s = Number.parseInt(colonMatch[2], 10);
    return m * 60 + s;
  }

  // HMS format: 1h2m3s, 2m15s, 45s
  const hmsMatch = cleaned.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
    const h = hmsMatch[1] ? Number.parseInt(hmsMatch[1], 10) : 0;
    const m = hmsMatch[2] ? Number.parseInt(hmsMatch[2], 10) : 0;
    const s = hmsMatch[3] ? Number.parseInt(hmsMatch[3], 10) : 0;
    return h * 3600 + m * 60 + s;
  }

  return null;
}

/**
 * Extracts a canonical 11-char YouTube Video ID from virtually any URL, embed HTML,
 * thumbnail URL, Shorts/Live/Music/Mobile link, or raw video ID.
 */
export function parseYouTubeInput(rawInput: string): ParsedYouTubeInput | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // 1. Raw 11-character video ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return {
      videoId: trimmed,
      sourceType: "video-id",
      startSeconds: null,
      playlistId: null,
      canonicalUrl: `https://www.youtube.com/watch?v=${trimmed}`,
      shortUrl: `https://youtu.be/${trimmed}`,
    };
  }

  // 2. Raw <iframe> embed snippet pasted directly
  let candidate = trimmed;
  let fromIframe = false;
  if (/<iframe\b/i.test(trimmed)) {
    const srcMatch = trimmed.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) return null;
    candidate = srcMatch[1].trim();
    fromIframe = true;
  }

  // 3. Handle protocol-less URLs like "youtube.com/watch?v=..." or "youtu.be/..."
  if (!/^https?:\/\//i.test(candidate)) {
    if (candidate.startsWith("//")) {
      candidate = `https:${candidate}`;
    } else if (/^(?:www\.|m\.|music\.|i\d*\.|img\.)?(?:youtube(?:-nocookie)?\.com|youtu\.be|ytimg\.com)\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    } else {
      return null;
    }
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidate);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  const startRaw =
    parsedUrl.searchParams.get("t") ??
    parsedUrl.searchParams.get("start") ??
    parsedUrl.searchParams.get("time_continue");
  const startSeconds = parseYouTubeTimestamp(startRaw);
  const playlistId = parsedUrl.searchParams.get("list") || null;

  let videoId: string | null = null;
  let sourceType: YouTubeInputSourceType = fromIframe ? "iframe-html" : "watch-url";

  if (host === "youtu.be" || host === "www.youtu.be") {
    videoId = segments[0] ?? null;
    sourceType = fromIframe ? "iframe-html" : "short-url";
  } else if (host.endsWith("ytimg.com") || host === "img.youtube.com") {
    // /vi/<id>/maxresdefault.jpg or /vi_webp/<id>/maxresdefault.webp
    if ((segments[0] === "vi" || segments[0] === "vi_webp") && segments[1]) {
      videoId = segments[1];
      sourceType = "thumbnail-url";
    }
  } else {
    const first = segments[0]?.toLowerCase();
    const queryV = parsedUrl.searchParams.get("v");

    if (queryV && YOUTUBE_ID_REGEX.test(queryV)) {
      videoId = queryV;
      sourceType = fromIframe
        ? "iframe-html"
        : host === "music.youtube.com"
          ? "music-url"
          : "watch-url";
    } else if (first === "shorts" && segments[1]) {
      videoId = segments[1];
      sourceType = fromIframe ? "iframe-html" : "shorts-url";
    } else if (first === "live" && segments[1]) {
      videoId = segments[1];
      sourceType = fromIframe ? "iframe-html" : "live-url";
    } else if (first === "embed" && segments[1]) {
      videoId = segments[1];
      sourceType = fromIframe ? "iframe-html" : "embed-url";
    } else if ((first === "v" || first === "e") && segments[1]) {
      videoId = segments[1];
      sourceType = fromIframe ? "iframe-html" : "legacy-url";
    } else if (host === "studio.youtube.com" && first === "video" && segments[1]) {
      videoId = segments[1];
      sourceType = "watch-url";
    }
  }

  if (!videoId || !YOUTUBE_ID_REGEX.test(videoId)) return null;

  return {
    videoId,
    sourceType,
    startSeconds,
    playlistId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    shortUrl: `https://youtu.be/${videoId}`,
  };
}

export function buildThumbnailUrl(
  videoId: string,
  variant: ThumbnailVariant,
  format: ThumbnailFormat = "jpg"
): string {
  if (format === "webp") {
    return `https://i.ytimg.com/vi_webp/${videoId}/${variant}.webp`;
  }
  return `https://i.ytimg.com/vi/${videoId}/${variant}.jpg`;
}

export function buildThumbnailProxyUrl(
  videoId: string,
  variant: ThumbnailVariant,
  format: ThumbnailFormat = "jpg"
): string {
  return `/api/youtube/thumbnail?v=${encodeURIComponent(videoId)}&variant=${encodeURIComponent(variant)}&format=${format}`;
}

export function buildThumbnailAssets(videoId: string): ThumbnailAsset[] {
  const specs: Array<{
    variant: ThumbnailVariant;
    format: ThumbnailFormat;
    labelEn: string;
    labelBn: string;
    badge: string;
    width: number;
    height: number;
    aspect: string;
    category: "primary" | "frame";
  }> = [
    {
      variant: "maxresdefault",
      format: "jpg",
      labelEn: "Max Resolution HD (JPG)",
      labelBn: "সর্বোচ্চ রেজোলিউশন এইচডি (JPG)",
      badge: "HD 1280×720",
      width: 1280,
      height: 720,
      aspect: "16:9",
      category: "primary",
    },
    {
      variant: "maxresdefault",
      format: "webp",
      labelEn: "Max Resolution HD (WebP)",
      labelBn: "সর্বোচ্চ রেজোলিউশন এইচডি (WebP)",
      badge: "WebP 1280×720",
      width: 1280,
      height: 720,
      aspect: "16:9",
      category: "primary",
    },
    {
      variant: "sddefault",
      format: "jpg",
      labelEn: "Standard Definition (SD)",
      labelBn: "স্ট্যান্ডার্ড ডেফিনিশন (SD)",
      badge: "SD 640×480",
      width: 640,
      height: 480,
      aspect: "4:3",
      category: "primary",
    },
    {
      variant: "sddefault",
      format: "webp",
      labelEn: "Standard Definition (WebP)",
      labelBn: "স্ট্যান্ডার্ড ডেফিনিশন (WebP)",
      badge: "WebP 640×480",
      width: 640,
      height: 480,
      aspect: "4:3",
      category: "primary",
    },
    {
      variant: "hqdefault",
      format: "jpg",
      labelEn: "High Quality (HQ)",
      labelBn: "হাই কোয়ালিটি (HQ)",
      badge: "HQ 480×360",
      width: 480,
      height: 360,
      aspect: "4:3",
      category: "primary",
    },
    {
      variant: "hqdefault",
      format: "webp",
      labelEn: "High Quality (WebP)",
      labelBn: "হাই কোয়ালিটি (WebP)",
      badge: "WebP 480×360",
      width: 480,
      height: 360,
      aspect: "4:3",
      category: "primary",
    },
    {
      variant: "mqdefault",
      format: "jpg",
      labelEn: "Medium Quality (MQ)",
      labelBn: "মিডিয়াম কোয়ালিটি (MQ)",
      badge: "MQ 320×180",
      width: 320,
      height: 180,
      aspect: "16:9",
      category: "primary",
    },
    {
      variant: "default",
      format: "jpg",
      labelEn: "Compact Default",
      labelBn: "কম্প্যাক্ট ডিফল্ট",
      badge: "120×90",
      width: 120,
      height: 90,
      aspect: "4:3",
      category: "primary",
    },
    {
      variant: "0",
      format: "jpg",
      labelEn: "Player Cover Frame (0.jpg)",
      labelBn: "প্লেয়ার কভার ফ্রেম (0.jpg)",
      badge: "480×360",
      width: 480,
      height: 360,
      aspect: "4:3",
      category: "frame",
    },
    {
      variant: "1",
      format: "jpg",
      labelEn: "Auto Frame — Start (1.jpg)",
      labelBn: "অটো ফ্রেম — শুরু (1.jpg)",
      badge: "120×90",
      width: 120,
      height: 90,
      aspect: "4:3",
      category: "frame",
    },
    {
      variant: "2",
      format: "jpg",
      labelEn: "Auto Frame — Middle (2.jpg)",
      labelBn: "অটো ফ্রেম — মাঝামাঝি (2.jpg)",
      badge: "120×90",
      width: 120,
      height: 90,
      aspect: "4:3",
      category: "frame",
    },
    {
      variant: "3",
      format: "jpg",
      labelEn: "Auto Frame — End (3.jpg)",
      labelBn: "অটো ফ্রেম — শেষ (3.jpg)",
      badge: "120×90",
      width: 120,
      height: 90,
      aspect: "4:3",
      category: "frame",
    },
  ];

  return specs.map((spec) => ({
    ...spec,
    id: `${spec.variant}-${spec.format}`,
    url: buildThumbnailUrl(videoId, spec.variant, spec.format),
    proxyDownloadUrl: buildThumbnailProxyUrl(videoId, spec.variant, spec.format),
  }));
}

export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/(?:^|\s)(#[\p{L}\p{M}\p{N}_]{2,50})/gu);
  if (!matches) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of matches) {
    const tag = raw.trim();
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

export function formatSecondsToTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/**
 * Extracts YouTube chapters from description lines like:
 * "0:00 Intro", "02:15 - Setup", "[1:05:30] Summary"
 */
export function extractChapters(
  description: string,
  durationSeconds?: number | null
): VideoChapter[] {
  if (!description) return [];
  const lines = description.split(/\r?\n/);
  const chapters: VideoChapter[] = [];
  const seenSeconds = new Set<number>();

  const lineRegex =
    /^\s*[\[(]?(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]?\s*(?:[-–—:|•]\s*)?(.+?)\s*$/;

  for (const line of lines) {
    const match = line.match(lineRegex);
    if (!match) continue;
    const hasHours = match[3] !== undefined;
    const h = hasHours ? Number.parseInt(match[1], 10) : 0;
    const m = hasHours ? Number.parseInt(match[2], 10) : Number.parseInt(match[1], 10);
    const s = hasHours ? Number.parseInt(match[3], 10) : Number.parseInt(match[2], 10);
    if (m >= 60 || s >= 60) continue;
    const startSeconds = h * 3600 + m * 60 + s;
    if (durationSeconds && startSeconds > durationSeconds) continue;
    const title = match[4].trim();
    if (!title || title.length > 140) continue;
    if (seenSeconds.has(startSeconds)) continue;
    seenSeconds.add(startSeconds);
    chapters.push({
      title,
      startSeconds,
      formattedTime: formatSecondsToTimestamp(startSeconds),
    });
  }

  // Only treat as chapters when at least 2 timestamps exist in ascending order
  if (chapters.length < 2) return [];
  chapters.sort((a, b) => a.startSeconds - b.startSeconds);
  return chapters;
}

/**
 * Parses ISO-8601 duration strings returned by YouTube Data API v3 (e.g. "PT1H2M10S").
 */
export function parseIso8601Duration(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const match = iso.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const days = match[1] ? Number.parseInt(match[1], 10) : 0;
  const hours = match[2] ? Number.parseInt(match[2], 10) : 0;
  const minutes = match[3] ? Number.parseInt(match[3], 10) : 0;
  const seconds = match[4] ? Number.parseInt(match[4], 10) : 0;
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10))
    );
}

/**
 * Parses YouTube timedtext JSON3 format into normalized segments.
 */
export function parseJson3Transcript(payload: unknown): TranscriptSegment[] {
  if (!payload || typeof payload !== "object") return [];
  const events = (payload as { events?: unknown }).events;
  if (!Array.isArray(events)) return [];

  const segments: TranscriptSegment[] = [];
  for (const event of events) {
    if (!event || typeof event !== "object") continue;
    const ev = event as {
      tStartMs?: number;
      dDurationMs?: number;
      segs?: Array<{ utf8?: string }>;
    };
    if (!Array.isArray(ev.segs)) continue;
    const rawText = ev.segs
      .map((s) => (typeof s?.utf8 === "string" ? s.utf8 : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!rawText) continue;
    const startMs = typeof ev.tStartMs === "number" && Number.isFinite(ev.tStartMs)
      ? Math.max(0, Math.round(ev.tStartMs))
      : 0;
    const durationMs = typeof ev.dDurationMs === "number" && Number.isFinite(ev.dDurationMs)
      ? Math.max(200, Math.round(ev.dDurationMs))
      : 2000;
    segments.push({
      startMs,
      durationMs,
      text: decodeHtmlEntities(rawText),
    });
  }
  return segments;
}

/**
 * Parses YouTube timedtext XML (both legacy <text start="" dur=""> and srv3 <p t="" d="">),
 * independent of XML attribute ordering.
 */
export function parseXmlTranscript(xml: string): TranscriptSegment[] {
  if (!xml) return [];
  const segments: TranscriptSegment[] = [];

  const readAttr = (attrs: string, name: string): string | null => {
    const m = attrs.match(new RegExp(`\\b${name}="([^"]+)"`, "i"));
    return m ? m[1] : null;
  };

  // Format 1: <text start="1.23" dur="3.45">Hello</text>
  const textTagRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match: RegExpExecArray | null = textTagRegex.exec(xml);
  while (match !== null) {
    const startRaw = readAttr(match[1], "start");
    const durRaw = readAttr(match[1], "dur");
    const startSec = startRaw ? Number.parseFloat(startRaw) : Number.NaN;
    const durSec = durRaw ? Number.parseFloat(durRaw) : 2;
    const clean = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    if (clean && Number.isFinite(startSec)) {
      segments.push({
        startMs: Math.max(0, Math.round(startSec * 1000)),
        durationMs: Math.max(
          200,
          Math.round((Number.isFinite(durSec) ? durSec : 2) * 1000)
        ),
        text: clean,
      });
    }
    match = textTagRegex.exec(xml);
  }

  if (segments.length > 0) return segments;

  // Format 2: <p t="1230" d="3450"><s>Hello</s><s> world</s></p>
  const pTagRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  let pMatch: RegExpExecArray | null = pTagRegex.exec(xml);
  while (pMatch !== null) {
    const tRaw = readAttr(pMatch[1], "t");
    const dRaw = readAttr(pMatch[1], "d");
    const startMs = tRaw ? Number.parseInt(tRaw, 10) : Number.NaN;
    const durationMs = dRaw ? Number.parseInt(dRaw, 10) : 2000;
    const clean = decodeHtmlEntities(pMatch[2].replace(/<[^>]+>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    if (clean && Number.isFinite(startMs)) {
      segments.push({
        startMs: Math.max(0, startMs),
        durationMs: Math.max(200, Number.isFinite(durationMs) ? durationMs : 2000),
        text: clean,
      });
    }
    pMatch = pTagRegex.exec(xml);
  }

  return segments;
}

function formatMsForSubtitle(ms: number, decimalSeparator: "," | "."): string {
  const safe = Math.max(0, Math.round(ms));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const millis = safe % 1000;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const pad3 = (n: number) => String(n).padStart(3, "0");
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}${decimalSeparator}${pad3(millis)}`;
}

export function formatTranscriptToSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, index) => {
      const start = formatMsForSubtitle(seg.startMs, ",");
      const end = formatMsForSubtitle(seg.startMs + seg.durationMs, ",");
      return `${index + 1}\n${start} --> ${end}\n${seg.text}`;
    })
    .join("\n\n");
}

export function formatTranscriptToVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .map((seg) => {
      const start = formatMsForSubtitle(seg.startMs, ".");
      const end = formatMsForSubtitle(seg.startMs + seg.durationMs, ".");
      return `${start} --> ${end}\n${seg.text}`;
    })
    .join("\n\n");
  return `WEBVTT\n\n${body}`;
}

export function formatTranscriptToTimestampedText(
  segments: TranscriptSegment[]
): string {
  return segments
    .map((seg) => `[${formatSecondsToTimestamp(seg.startMs / 1000)}] ${seg.text}`)
    .join("\n");
}

export function formatTranscriptToPlainText(
  segments: TranscriptSegment[]
): string {
  return segments.map((seg) => seg.text).join(" ").replace(/\s+/g, " ").trim();
}

export function buildEmbedUrl(options: EmbedOptions): string {
  const host = options.privacyEnhanced
    ? "https://www.youtube-nocookie.com"
    : "https://www.youtube.com";
  const params = new URLSearchParams();
  if (options.startSeconds > 0) {
    params.set("start", String(Math.floor(options.startSeconds)));
  }
  if (options.autoplay) {
    params.set("autoplay", "1");
  }
  if (options.mute || options.autoplay) {
    params.set("mute", "1");
  }
  if (!options.controls) {
    params.set("controls", "0");
  }
  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", options.videoId);
  }
  if (options.relZero) {
    params.set("rel", "0");
  }
  const query = params.toString();
  return `${host}/embed/${options.videoId}${query ? `?${query}` : ""}`;
}

export function buildEmbedHtml(options: EmbedOptions, title = "YouTube video player"): string {
  const src = buildEmbedUrl(options);
  const safeTitle = title.replace(/"/g, "&quot;");
  const allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

  if (!options.responsive) {
    return `<iframe width="${options.width}" height="${options.height}" src="${src}" title="${safeTitle}" frameborder="0" allow="${allow}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }

  const paddingBottom =
    options.aspectRatio === "9:16"
      ? "177.78%"
      : options.aspectRatio === "4:3"
        ? "75%"
        : "56.25%";

  return `<div style="position:relative;width:100%;padding-bottom:${paddingBottom};height:0;overflow:hidden;border-radius:12px;">\n  <iframe src="${src}" title="${safeTitle}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="${allow}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>\n</div>`;
}

export function buildPublicEndpoints(videoId: string, channelId: string | null) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return {
    watchUrl,
    shortUrl: `https://youtu.be/${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    nocookieEmbedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    oembedJsonUrl: `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    oembedXmlUrl: `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=xml`,
    channelRssUrl: channelId
      ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      : null,
    maxResThumbUrl: buildThumbnailUrl(videoId, "maxresdefault", "jpg"),
    maxResWebpUrl: buildThumbnailUrl(videoId, "maxresdefault", "webp"),
  };
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatCompactNumber(
  value: number | null | undefined,
  locale: "en" | "bn" = "en"
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
      notation: value >= 10_000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}

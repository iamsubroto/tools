"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  AlertCircle,
  Captions,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Clock,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileJson,
  FileText,
  Globe,
  Hash,
  History,
  Image as ImageIcon,
  Info,
  ListVideo,
  Play,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Tag,
  ThumbsUp,
  X,
} from "lucide-react";
import {
  buildEmbedHtml,
  buildEmbedUrl,
  buildPublicEndpoints,
  formatBytes,
  formatCompactNumber,
  formatSecondsToTimestamp,
  formatTranscriptToPlainText,
  formatTranscriptToSrt,
  formatTranscriptToTimestampedText,
  formatTranscriptToVtt,
  parseYouTubeInput,
  parseYouTubeTimestamp,
  type CaptionTrackInfo,
  type EmbedOptions,
  type ThumbnailAsset,
  type YouTubeInputSourceType,
  type YouTubeTranscriptResponse,
  type YouTubeVideoInfo,
} from "@/lib/youtube";
import { formatSouthAsianNumber, toBanglaDigits } from "@/lib/formatters";
import { useLanguage } from "@/i18n/LanguageContext";

type WorkspaceTab = "overview" | "thumbnails" | "transcript" | "embed";
type ThumbFilter = "all" | "jpg" | "webp" | "frame";

interface HistoryEntry {
  videoId: string;
  title: string;
  channelName: string;
}

const SAMPLE_VIDEOS: Array<{
  id: string;
  labelEn: string;
  labelBn: string;
}> = [
  {
    id: "jNQXAC9IVRw",
    labelEn: "Me at the zoo (First YT Video)",
    labelBn: "প্রথম ইউটিউব ভিডিও",
  },
  {
    id: "aqz-KE-bpKQ",
    labelEn: "Big Buck Bunny 4K",
    labelBn: "বিগ বাক বানি ৪কে",
  },
  {
    id: "dQw4w9WgXcQ",
    labelEn: "Classic Music Video",
    labelBn: "ক্লাসিক মিউজিক ভিডিও",
  },
];

const HISTORY_KEY = "toolsbd_yt_history_v1";
const HISTORY_EVENT = "toolsbd-yt-history-change";
const EMPTY_HISTORY: HistoryEntry[] = [];
let cachedRawHistory: string | null = null;
let cachedParsedHistory: HistoryEntry[] = EMPTY_HISTORY;

function subscribeHistory(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(HISTORY_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(HISTORY_EVENT, callback);
  };
}

function getHistorySnapshot(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (raw === cachedRawHistory) return cachedParsedHistory;
    cachedRawHistory = raw;
    if (!raw) {
      cachedParsedHistory = EMPTY_HISTORY;
      return cachedParsedHistory;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedParsedHistory = EMPTY_HISTORY;
      return cachedParsedHistory;
    }
    cachedParsedHistory = parsed
      .filter(
        (item): item is HistoryEntry =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as HistoryEntry).videoId === "string" &&
          typeof (item as HistoryEntry).title === "string"
      )
      .slice(0, 6);
    return cachedParsedHistory;
  } catch {
    return EMPTY_HISTORY;
  }
}

function getServerHistorySnapshot(): HistoryEntry[] {
  return EMPTY_HISTORY;
}

function pushHistory(entry: HistoryEntry): void {
  try {
    const current = getHistorySnapshot().filter((h) => h.videoId !== entry.videoId);
    const next = [entry, ...current].slice(0, 6);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    // Ignore private-mode storage restrictions
  }
}

function clearHistoryStorage(): void {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    // Ignore
  }
}

const SOURCE_LABELS: Record<
  YouTubeInputSourceType,
  { en: string; bn: string }
> = {
  "video-id": { en: "Video ID", bn: "ভিডিও আইডি" },
  "watch-url": { en: "Watch URL", bn: "ওয়াচ লিংক" },
  "short-url": { en: "youtu.be Link", bn: "শর্ট লিংক" },
  "shorts-url": { en: "YouTube Shorts", bn: "ইউটিউব শর্টস" },
  "live-url": { en: "Live Stream URL", bn: "লাইভ লিংক" },
  "embed-url": { en: "Embed URL", bn: "এমবেড লিংক" },
  "music-url": { en: "YouTube Music", bn: "ইউটিউব মিউজিক" },
  "thumbnail-url": { en: "Thumbnail URL", bn: "থাম্বনেইল লিংক" },
  "iframe-html": { en: "Embed HTML", bn: "এমবেড কোড" },
  "legacy-url": { en: "Legacy URL", bn: "লিগ্যাসি লিংক" },
};

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900";
const ghostBtn =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white";
const primaryBtn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400";

function triggerTextDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatIsoDate(iso: string | null, locale: "en" | "bn"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

export function YouTubeResourceClient() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const t = useCallback((en: string, bn: string) => (isBn ? bn : en), [isBn]);
  const num = useCallback(
    (v: number) => formatSouthAsianNumber(v, { locale }),
    [locale]
  );

  const inputId = useId();
  const transcriptSearchId = useId();
  const playerSectionRef = useRef<HTMLDivElement | null>(null);
  const initFetchedRef = useRef(false);

  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot
  );

  const [rawInput, setRawInput] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);

  // Interactive preview player state
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerStartSeconds, setPlayerStartSeconds] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);

  // Metadata UI state
  const [descExpanded, setDescExpanded] = useState(false);
  const [thumbFilter, setThumbFilter] = useState<ThumbFilter>("all");

  // Transcript state
  const [transcript, setTranscript] = useState<YouTubeTranscriptResponse | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [selectedTrackKey, setSelectedTrackKey] = useState<string>("");
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [showTimestamps, setShowTimestamps] = useState(true);

  // Embed builder state
  const [embedPrivacy, setEmbedPrivacy] = useState(true);
  const [embedResponsive, setEmbedResponsive] = useState(true);
  const [embedAspect, setEmbedAspect] = useState<"16:9" | "9:16" | "4:3">("16:9");
  const [embedWidth, setEmbedWidth] = useState(560);
  const [embedHeight, setEmbedHeight] = useState(315);
  const [embedStartInput, setEmbedStartInput] = useState("");
  const [embedControls, setEmbedControls] = useState(true);
  const [embedAutoplay, setEmbedAutoplay] = useState(false);
  const [embedMute, setEmbedMute] = useState(false);
  const [embedLoop, setEmbedLoop] = useState(false);
  const [embedRelZero, setEmbedRelZero] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  }, []);

  const copyText = useCallback(
    async (key: string, value: string) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        flashCopied(key);
      } catch {
        // Clipboard permission denied
      }
    },
    [flashCopied]
  );

  const parsedLive = useMemo(() => parseYouTubeInput(rawInput), [rawInput]);

  const fetchTranscript = useCallback(
    async (videoId: string, track?: CaptionTrackInfo) => {
      setTranscriptLoading(true);
      setTranscriptError(null);
      try {
        const params = new URLSearchParams({ v: videoId });
        if (track) {
          params.set("lang", track.lang);
          params.set("kind", track.kind);
        }
        const res = await fetch(`/api/youtube/transcript?${params.toString()}`);
        const data = (await res.json()) as YouTubeTranscriptResponse & {
          error?: string;
        };
        if (!res.ok) {
          setTranscript(null);
          setTranscriptError(
            data.error ||
              t(
                "Could not load subtitles for this video.",
                "এই ভিডিওর সাবটাইটেল লোড করা যায়নি।"
              )
          );
          return;
        }
        setTranscript(data);
        if (data.lang) {
          setSelectedTrackKey(`${data.lang}:${data.kind}`);
        }
      } catch {
        setTranscript(null);
        setTranscriptError(
          t(
            "Network error while fetching subtitles.",
            "সাবটাইটেল আনার সময় নেটওয়ার্ক ত্রুটি হয়েছে।"
          )
        );
      } finally {
        setTranscriptLoading(false);
      }
    },
    [t]
  );

  const runExtraction = useCallback(
    async (targetInput: string, updateUrlParam = true) => {
      const parsed = parseYouTubeInput(targetInput);
      if (!parsed) {
        setError(
          t(
            "Please enter a valid YouTube link, Shorts URL, embed code, or 11-character Video ID.",
            "অনুগ্রহ করে একটি সঠিক ইউটিউব লিংক, শর্টস লিংক, এমবেড কোড বা ১১-অক্ষরের ভিডিও আইডি দিন।"
          )
        );
        return;
      }

      setLoading(true);
      setError(null);
      setTranscript(null);
      setTranscriptError(null);
      setSelectedTrackKey("");
      setTranscriptQuery("");
      setDescExpanded(false);
      setShowPlayer(false);
      setPlayerStartSeconds(parsed.startSeconds ?? 0);
      setEmbedStartInput(parsed.startSeconds ? String(parsed.startSeconds) : "");

      try {
        const res = await fetch(
          `/api/youtube/info?v=${encodeURIComponent(parsed.videoId)}`
        );
        const data = (await res.json()) as YouTubeVideoInfo & { error?: string };

        if (!res.ok) {
          setVideoInfo(null);
          setError(
            data.error ||
              t(
                "Could not fetch video information. Verify the video is public.",
                "ভিডিওর তথ্য পাওয়া যায়নি। ভিডিওটি পাবলিক আছে কিনা যাচাই করুন।"
              )
          );
          return;
        }

        setVideoInfo(data);
        setEmbedAspect(data.isShorts ? "9:16" : "16:9");
        setActiveTab("overview");

        pushHistory({
          videoId: data.videoId,
          title: data.title,
          channelName: data.channelName,
        });

        if (updateUrlParam && typeof window !== "undefined") {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set("v", data.videoId);
          window.history.replaceState({}, "", nextUrl.toString());
        }
      } catch {
        setVideoInfo(null);
        setError(
          t(
            "Network error while contacting the server. Please try again.",
            "সার্ভারে সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // Auto-load when opening a shared link with ?v=<videoId>
  useEffect(() => {
    if (initFetchedRef.current) return;
    initFetchedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const initialV = params.get("v")?.trim();
    if (!initialV) return;
    const parsed = parseYouTubeInput(initialV);
    if (!parsed) return;
    // Defer to microtask/async fetch so state updates occur asynchronously
    void Promise.resolve().then(() => {
      setRawInput(parsed.canonicalUrl);
      return runExtraction(parsed.videoId, false);
    });
  }, [runExtraction]);

  const handleTabSwitch = (nextTab: WorkspaceTab) => {
    setActiveTab(nextTab);
    if (
      nextTab === "transcript" &&
      videoInfo &&
      !transcript &&
      !transcriptLoading &&
      !transcriptError
    ) {
      void fetchTranscript(videoInfo.videoId, videoInfo.captionTracks[0]);
    }
  };

  const handleSeekTo = (seconds: number) => {
    setPlayerStartSeconds(Math.max(0, Math.floor(seconds)));
    setShowPlayer(true);
    setPlayerKey((k) => k + 1);
    window.setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 60);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return;
      setRawInput(text);
      setError(null);
      if (parseYouTubeInput(text)) {
        void runExtraction(text);
      }
    } catch {
      setError(
        t(
          "Clipboard access was blocked by the browser. Please paste directly using Ctrl+V.",
          "ব্রাউজার ক্লিপবোর্ড অ্যাক্সেস দেয়নি। অনুগ্রহ করে সরাসরি Ctrl+V দিয়ে পেস্ট করুন।"
        )
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runExtraction(rawInput);
  };

  const bestThumbnail: ThumbnailAsset | null = useMemo(() => {
    if (!videoInfo) return null;
    const primaryJpg = videoInfo.thumbnails.filter(
      (th) => th.category === "primary" && th.format === "jpg"
    );
    return (
      primaryJpg.find((th) => th.available === true) ??
      primaryJpg.find((th) => th.available !== false) ??
      videoInfo.thumbnails[0] ??
      null
    );
  }, [videoInfo]);

  const availableThumbnailCount = useMemo(() => {
    if (!videoInfo) return 0;
    return videoInfo.thumbnails.filter((th) => th.available !== false).length;
  }, [videoInfo]);

  const filteredThumbnails = useMemo(() => {
    if (!videoInfo) return [];
    return videoInfo.thumbnails.filter((th) => {
      if (thumbFilter === "jpg") return th.format === "jpg" && th.category === "primary";
      if (thumbFilter === "webp") return th.format === "webp";
      if (thumbFilter === "frame") return th.category === "frame";
      return true;
    });
  }, [videoInfo, thumbFilter]);

  const filteredSegments = useMemo(() => {
    if (!transcript) return [];
    const q = transcriptQuery.trim().toLowerCase();
    if (!q) return transcript.segments;
    return transcript.segments.filter((seg) => seg.text.toLowerCase().includes(q));
  }, [transcript, transcriptQuery]);

  const embedOptions: EmbedOptions | null = useMemo(() => {
    if (!videoInfo) return null;
    const startSec = parseYouTubeTimestamp(embedStartInput) ?? 0;
    return {
      videoId: videoInfo.videoId,
      privacyEnhanced: embedPrivacy,
      responsive: embedResponsive,
      aspectRatio: embedAspect,
      width: Math.max(200, Math.min(1920, embedWidth || 560)),
      height: Math.max(150, Math.min(1080, embedHeight || 315)),
      startSeconds: startSec,
      autoplay: embedAutoplay,
      mute: embedMute,
      controls: embedControls,
      loop: embedLoop,
      relZero: embedRelZero,
    };
  }, [
    videoInfo,
    embedPrivacy,
    embedResponsive,
    embedAspect,
    embedWidth,
    embedHeight,
    embedStartInput,
    embedAutoplay,
    embedMute,
    embedControls,
    embedLoop,
    embedRelZero,
  ]);

  const embedHtml = useMemo(
    () => (embedOptions && videoInfo ? buildEmbedHtml(embedOptions, videoInfo.title) : ""),
    [embedOptions, videoInfo]
  );

  const publicEndpoints = useMemo(
    () =>
      videoInfo
        ? buildPublicEndpoints(videoInfo.videoId, videoInfo.channelId)
        : null,
    [videoInfo]
  );

  const copyAllMetadata = () => {
    if (!videoInfo) return;
    const lines = [
      `Title: ${videoInfo.title}`,
      `Video ID: ${videoInfo.videoId}`,
      `URL: ${videoInfo.canonicalUrl}`,
      videoInfo.channelName ? `Channel: ${videoInfo.channelName}` : null,
      videoInfo.channelUrl ? `Channel URL: ${videoInfo.channelUrl}` : null,
      videoInfo.publishDate ? `Published: ${videoInfo.publishDate}` : null,
      videoInfo.durationSeconds !== null
        ? `Duration: ${formatSecondsToTimestamp(videoInfo.durationSeconds)}`
        : null,
      videoInfo.viewCount !== null ? `Views: ${videoInfo.viewCount.toLocaleString("en-US")}` : null,
      videoInfo.category ? `Category: ${videoInfo.category}` : null,
      videoInfo.tags.length > 0 ? `Tags: ${videoInfo.tags.join(", ")}` : null,
      videoInfo.hashtags.length > 0 ? `Hashtags: ${videoInfo.hashtags.join(" ")}` : null,
      bestThumbnail ? `Best Thumbnail: ${bestThumbnail.url}` : null,
      videoInfo.description ? `\nDescription:\n${videoInfo.description}` : null,
    ].filter(Boolean);
    void copyText("copy-all", lines.join("\n"));
  };

  const handleShareToolUrl = () => {
    if (!videoInfo || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("v", videoInfo.videoId);
    void copyText("share-url", url.toString());
  };

  const handleExportJson = () => {
    if (!videoInfo) return;
    const payload = {
      ...videoInfo,
      transcript: transcript
        ? {
            lang: transcript.lang,
            name: transcript.name,
            kind: transcript.kind,
            wordCount: transcript.wordCount,
            segmentsCount: transcript.segments.length,
            plainText: transcript.plainText,
          }
        : undefined,
    };
    triggerTextDownload(
      `youtube-${videoInfo.videoId}-resources.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
  };

  const titleLength = videoInfo?.title.length ?? 0;
  const titleSeoStatus =
    titleLength === 0
      ? "neutral"
      : titleLength <= 70
        ? "optimal"
        : titleLength <= 100
          ? "long"
          : "over";

  return (
    <div className="space-y-6">
      {/* ── Hero Input Bar ────────────────────────────────────────── */}
      <section className={`${card} p-5 sm:p-6`}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={inputId}
              className="text-sm font-semibold text-slate-900 dark:text-white"
            >
              {t(
                "Paste any YouTube URL, Shorts, Live, Embed Code, or 11-char Video ID",
                "যেকোনো ইউটিউব লিংক, শর্টস, লাইভ, এমবেড কোড বা ১১-অক্ষরের ভিডিও আইডি পেস্ট করুন"
              )}
            </label>
            {parsedLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {isBn
                  ? SOURCE_LABELS[parsedLive.sourceType].bn
                  : SOURCE_LABELS[parsedLive.sourceType].en}
                <span className="font-mono text-[11px] opacity-80">
                  · {parsedLive.videoId}
                </span>
                {parsedLive.startSeconds !== null && (
                  <span className="tabular-nums opacity-80">
                    · @{formatSecondsToTimestamp(parsedLive.startSeconds)}
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id={inputId}
                type="text"
                value={rawInput}
                onChange={(e) => {
                  setRawInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t(
                  "https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ",
                  "https://www.youtube.com/watch?v=dQw4w9WgXcQ অথবা dQw4w9WgXcQ"
                )}
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {rawInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawInput("");
                      setError(null);
                    }}
                    aria-label={t("Clear input", "ইনপুট মুছুন")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  title={t("Paste from clipboard", "ক্লিপবোর্ড থেকে পেস্ট করুন")}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden xs:inline">{t("Paste", "পেস্ট")}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !rawInput.trim()}
              className={`${primaryBtn} h-12 shrink-0 px-6 text-sm`}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {loading
                ? t("Extracting…", "তথ্য আনা হচ্ছে…")
                : t("Extract Resources", "রিসোর্স বের করুন")}
            </button>
          </div>

          {/* Sample Chips + Recent History */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {t("Try a sample:", "নমুনা দেখুন:")}
              </span>
              {SAMPLE_VIDEOS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    const sampleUrl = `https://www.youtube.com/watch?v=${sample.id}`;
                    setRawInput(sampleUrl);
                    void runExtraction(sampleUrl);
                  }}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                >
                  <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  {isBn ? sample.labelBn : sample.labelEn}
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("Recent:", "সাম্প্রতিক:")}
                </span>
                {history.slice(0, 3).map((item) => (
                  <button
                    key={item.videoId}
                    type="button"
                    onClick={() => {
                      const url = `https://www.youtube.com/watch?v=${item.videoId}`;
                      setRawInput(url);
                      void runExtraction(url);
                    }}
                    title={item.title}
                    className="max-w-[160px] truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                  >
                    {item.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearHistoryStorage}
                  className="px-1.5 py-1 text-[11px] font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  {t("Clear", "মুছুন")}
                </button>
              </div>
            )}
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}
      </section>

      {/* ── Loading Skeleton ──────────────────────────────────────── */}
      {loading && (
        <div
          aria-live="polite"
          aria-busy="true"
          className={`${card} animate-pulse p-6`}
        >
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="aspect-video w-full rounded-xl bg-slate-200 md:w-72 dark:bg-slate-800" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="flex gap-2 pt-2">
                <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty Feature Highlights (before first search) ────────── */}
      {!loading && !videoInfo && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ImageIcon,
              titleEn: "All Thumbnail Versions",
              titleBn: "সব রেজোলিউশনের থাম্বনেইল",
              descEn:
                "MaxRes 1280×720, SD, HQ, MQ, WebP & 3 auto storyboard frames with live size checks and 1-click downloads.",
              descBn:
                "১২৮০×৭২০ এইচডি, এসডি, এইচকিউ, ওয়েবপি ও ভিডিও ফ্রেম—১ ক্লিকে ডাউনলোড ও লিংক কপি।",
            },
            {
              icon: FileText,
              titleEn: "Metadata, Tags & Chapters",
              titleBn: "মেটাডেটা, ট্যাগ ও চ্যাপ্টার",
              descEn:
                "Copy full title (with SEO counter), description, hidden keyword tags, hashtags, chapters, and channel stats.",
              descBn:
                "টাইটেল, সম্পূর্ণ বিবরণ, ট্যাগ, হ্যাশট্যাগ, চ্যাপ্টার ও চ্যানেলের তথ্য এক ক্লিকে কপি করুন।",
            },
            {
              icon: Captions,
              titleEn: "Subtitles & Transcripts",
              titleBn: "সাবটাইটেল ও ট্রান্সক্রিপ্ট",
              descEn:
                "Switch subtitle languages, search inside transcripts, click timestamps to jump, and export .SRT, .VTT, or .TXT.",
              descBn:
                "ভাষা নির্বাচন করে ট্রান্সক্রিপ্ট খুঁজুন এবং .SRT, .VTT বা .TXT ফরম্যাটে ডাউনলোড করুন।",
            },
            {
              icon: Code2,
              titleEn: "Embed Builder & Public APIs",
              titleBn: "এমবেড কোড ও পাবলিক এপিআই",
              descEn:
                "Privacy-enhanced responsive iframe generator, Markdown/HTML snippets, RSS feed URL, and raw JSON export.",
              descBn:
                "রেসপনসিভ এমবেড কোড, মার্কডাউন লিংক, চ্যানেল RSS ফিড ও সম্পূর্ণ JSON এক্সপোর্ট।",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.titleEn} className={`${card} p-5`}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-3.5 text-[15px] font-bold text-slate-900 dark:text-white">
                  {isBn ? item.titleBn : item.titleEn}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {isBn ? item.descBn : item.descEn}
                </p>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Active Video Workspace ────────────────────────────────── */}
      {!loading && videoInfo && (
        <div className="space-y-6">
          {/* Compact Video Summary Banner */}
          <section className={`${card} overflow-hidden`}>
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
              {/* Thumbnail Preview Card */}
              <div className="space-y-2.5">
                <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                  {bestThumbnail && (
                    <Image
                      src={bestThumbnail.url}
                      alt={videoInfo.title}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 300px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPlayer((prev) => !prev)}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/25 transition-colors hover:bg-slate-950/40"
                    aria-label={
                      showPlayer
                        ? t("Hide video preview", "ভিডিও প্রিভিউ লুকান")
                        : t("Play video preview", "ভিডিও প্রিভিউ চালান")
                    }
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform group-hover:scale-105">
                      <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                    </span>
                  </button>
                  {videoInfo.durationSeconds !== null && (
                    <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/85 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
                      {formatSecondsToTimestamp(videoInfo.durationSeconds)}
                    </span>
                  )}
                  {videoInfo.isShorts && (
                    <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      Shorts
                    </span>
                  )}
                  {videoInfo.isLiveContent && (
                    <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      Live
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => void copyText("video-id", videoInfo.videoId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {copiedKey === "video-id" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    ID: {videoInfo.videoId}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlayer((prev) => !prev)}
                    className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {showPlayer
                      ? t("Hide player", "প্লেয়ার লুকান")
                      : t("Open preview player", "প্রিভিউ প্লেয়ার")}
                  </button>
                </div>
              </div>

              {/* Video Identity, Stats & Quick Actions */}
              <div className="min-w-0 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 sm:text-xl dark:text-white">
                      {videoInfo.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => void copyText("banner-title", videoInfo.title)}
                      title={t("Copy title", "টাইটেল কপি করুন")}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      {copiedKey === "banner-title" ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {videoInfo.channelName && (
                      videoInfo.channelUrl ? (
                        <a
                          href={videoInfo.channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-400"
                        >
                          {videoInfo.channelName}
                          <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {videoInfo.channelName}
                        </span>
                      )
                    )}
                    {videoInfo.publishDate && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{formatIsoDate(videoInfo.publishDate, locale)}</span>
                      </>
                    )}
                    {videoInfo.category && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {videoInfo.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Compact KPI Pills */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("Views", "ভিউ")}
                    </div>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatCompactNumber(videoInfo.viewCount, locale)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("Duration", "সময়কাল")}
                    </div>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {videoInfo.durationSeconds !== null
                        ? formatSecondsToTimestamp(videoInfo.durationSeconds)
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("Tags", "ট্যাগ")}
                    </div>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {num(videoInfo.tags.length)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {videoInfo.likeCount !== null ? (
                        <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Captions className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {videoInfo.likeCount !== null
                        ? t("Likes", "লাইক")
                        : t("Subtitles", "সাবটাইটেল")}
                    </div>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {videoInfo.likeCount !== null
                        ? formatCompactNumber(videoInfo.likeCount, locale)
                        : num(videoInfo.captionTracks.length)}
                    </p>
                  </div>
                </div>

                {/* Quick Action Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {bestThumbnail && (
                    <a
                      href={bestThumbnail.proxyDownloadUrl}
                      download
                      className={primaryBtn}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {t("Download Best Thumbnail", "সেরা থাম্বনেইল ডাউনলোড")}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={copyAllMetadata}
                    className={ghostBtn}
                  >
                    {copiedKey === "copy-all" ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedKey === "copy-all"
                      ? t("Copied all", "সব কপি হয়েছে")
                      : t("Copy all info", "সব তথ্য কপি")}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className={ghostBtn}
                  >
                    <FileJson className="h-4 w-4" aria-hidden="true" />
                    {t("Export JSON", "JSON ডাউনলোড")}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareToolUrl}
                    className={ghostBtn}
                  >
                    {copiedKey === "share-url" ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    {copiedKey === "share-url"
                      ? t("Link copied", "লিংক কপি হয়েছে")
                      : t("Share", "শেয়ার")}
                  </button>
                  <a
                    href={videoInfo.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ghostBtn}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    {t("YouTube", "ইউটিউব")}
                  </a>
                </div>

                {/* Transparent Source Pill & Warnings */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{t("Data sources:", "তথ্যের উৎস:")}</span>
                  {videoInfo.sourcesUsed.map((src) => (
                    <span
                      key={src}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                      {src === "youtube-data-api"
                        ? "YouTube Data API v3"
                        : src === "public-player"
                          ? "Public Player Metadata"
                          : "Official oEmbed"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Expandable Interactive Privacy-Enhanced Player */}
            {showPlayer && (
              <div
                ref={playerSectionRef}
                className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Play className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    {t(
                      "Privacy-enhanced preview (youtube-nocookie.com)",
                      "প্রাইভেসি-সুরক্ষিত প্রিভিউ (youtube-nocookie.com)"
                    )}
                    {playerStartSeconds > 0 && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                        @{formatSecondsToTimestamp(playerStartSeconds)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPlayer(false)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("Close", "বন্ধ করুন")}
                  </button>
                </div>
                <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm dark:border-slate-800">
                  <div className="relative aspect-video w-full">
                    <iframe
                      key={`${videoInfo.videoId}-${playerKey}`}
                      src={buildEmbedUrl({
                        videoId: videoInfo.videoId,
                        privacyEnhanced: true,
                        responsive: true,
                        aspectRatio: "16:9",
                        width: 560,
                        height: 315,
                        startSeconds: playerStartSeconds,
                        autoplay: playerStartSeconds > 0,
                        mute: false,
                        controls: true,
                        loop: false,
                        relZero: true,
                      })}
                      title={videoInfo.title}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}

            {videoInfo.warnings.length > 0 && (
              <div className="border-t border-amber-200 bg-amber-50/70 px-5 py-3 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{videoInfo.warnings.join(" ")}</p>
                </div>
              </div>
            )}
          </section>

          {/* ── Creator Studio Workspace Tab Navigation ──────────────── */}
          <div
            role="tablist"
            aria-label={t("YouTube resource sections", "ইউটিউব রিসোর্স বিভাগ")}
            className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900"
          >
            {(
              [
                {
                  id: "overview" as const,
                  icon: FileText,
                  labelEn: "Overview & Metadata",
                  labelBn: "ওভারভিউ ও মেটাডেটা",
                  badge: videoInfo.tags.length > 0 ? num(videoInfo.tags.length) : null,
                },
                {
                  id: "thumbnails" as const,
                  icon: ImageIcon,
                  labelEn: "Thumbnails",
                  labelBn: "থাম্বনেইল",
                  badge: num(availableThumbnailCount),
                },
                {
                  id: "transcript" as const,
                  icon: Captions,
                  labelEn: "Subtitles & Transcript",
                  labelBn: "সাবটাইটেল ও ট্রান্সক্রিপ্ট",
                  badge:
                    videoInfo.captionTracks.length > 0
                      ? num(videoInfo.captionTracks.length)
                      : null,
                },
                {
                  id: "embed" as const,
                  icon: Code2,
                  labelEn: "Embed & Public APIs",
                  labelBn: "এমবেড ও পাবলিক এপিআই",
                  badge: null,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors ${
                    active
                      ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{isBn ? tab.labelBn : tab.labelEn}</span>
                  {tab.badge !== null && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                        active
                          ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TAB 1: OVERVIEW & METADATA ────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              <div className="space-y-6">
                {/* Title & SEO Length Card */}
                <div className={`${card} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t("Video Title", "ভিডিওর শিরোনাম (Title)")}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                          titleSeoStatus === "optimal"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        }`}
                      >
                        {isBn
                          ? `${toBanglaDigits(titleLength)} / ১০০ অক্ষর`
                          : `${titleLength} / 100 chars`}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyText("meta-title", videoInfo.title)}
                        className={ghostBtn}
                      >
                        {copiedKey === "meta-title" ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedKey === "meta-title"
                          ? t("Copied", "কপি হয়েছে")
                          : t("Copy", "কপি")}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-[15px] font-medium leading-relaxed text-slate-900 select-all dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100">
                    {videoInfo.title}
                  </p>
                </div>

                {/* Full Description Card */}
                <div className={`${card} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {t("Full Description", "সম্পূর্ণ বিবরণ (Description)")}
                      </h3>
                      <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {videoInfo.description
                          ? isBn
                            ? `${toBanglaDigits(videoInfo.description.length)} অক্ষর · ${toBanglaDigits(videoInfo.description.split(/\s+/).filter(Boolean).length)} শব্দ`
                            : `${videoInfo.description.length.toLocaleString("en-US")} chars · ${videoInfo.description.split(/\s+/).filter(Boolean).length.toLocaleString("en-US")} words`
                          : t("No description available", "কোনো বিবরণ পাওয়া যায়নি")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!videoInfo.description}
                      onClick={() => void copyText("meta-desc", videoInfo.description)}
                      className={ghostBtn}
                    >
                      {copiedKey === "meta-desc" ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedKey === "meta-desc"
                        ? t("Copied", "কপি হয়েছে")
                        : t("Copy description", "বিবরণ কপি")}
                    </button>
                  </div>

                  {videoInfo.description ? (
                    <div className="mt-3">
                      <div
                        className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 ${
                          !descExpanded && videoInfo.description.length > 520
                            ? "max-h-64"
                            : ""
                        }`}
                      >
                        {videoInfo.description}
                      </div>
                      {videoInfo.description.length > 520 && (
                        <button
                          type="button"
                          onClick={() => setDescExpanded((prev) => !prev)}
                          className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {descExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              {t("Show less", "সংক্ষিপ্ত করুন")}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              {t("Expand full description", "সম্পূর্ণ বিবরণ দেখুন")}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      {t(
                        "This video has an empty description or YouTube did not expose it publicly.",
                        "এই ভিডিওর কোনো বিবরণ নেই অথবা ইউটিউব পাবলিকভাবে তা দেয়নি।"
                      )}
                    </p>
                  )}
                </div>

                {/* Tags & Hashtags Card */}
                <div className={`${card} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {t("Keywords, Tags & Hashtags", "কীওয়ার্ড, ট্যাগ ও হ্যাশট্যাগ")}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "Click any single tag chip to copy it, or copy all comma-separated tags.",
                          "যেকোনো ট্যাগে ক্লিক করে কপি করুন অথবা সব ট্যাগ একসাথে কপি করুন।"
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {videoInfo.tags.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            void copyText("all-tags", videoInfo.tags.join(", "))
                          }
                          className={ghostBtn}
                        >
                          {copiedKey === "all-tags" ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copiedKey === "all-tags"
                            ? t("Tags copied", "ট্যাগ কপি হয়েছে")
                            : t("Copy all tags", "সব ট্যাগ কপি")}
                        </button>
                      )}
                      {videoInfo.hashtags.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            void copyText("all-hashtags", videoInfo.hashtags.join(" "))
                          }
                          className={ghostBtn}
                        >
                          {copiedKey === "all-hashtags" ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Hash className="h-4 w-4" />
                          )}
                          {copiedKey === "all-hashtags"
                            ? t("Hashtags copied", "হ্যাশট্যাগ কপি")
                            : t("Copy hashtags", "হ্যাশট্যাগ কপি")}
                        </button>
                      )}
                    </div>
                  </div>

                  {videoInfo.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {videoInfo.tags.map((tag) => {
                        const key = `tag-${tag}`;
                        const isCopied = copiedKey === key;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => void copyText(key, tag)}
                            className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                              isCopied
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Tag className="h-3 w-3 text-slate-400" />
                            )}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      {t(
                        "No public keyword tags were set by the uploader on this video.",
                        "আপলোডার এই ভিডিওতে কোনো পাবলিক ট্যাগ যুক্ত করেননি।"
                      )}
                    </p>
                  )}

                  {videoInfo.hashtags.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t("Extracted Hashtags", "শনাক্তকৃত হ্যাশট্যাগ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {videoInfo.hashtags.map((ht) => (
                          <button
                            key={ht}
                            type="button"
                            onClick={() => void copyText(`ht-${ht}`, ht)}
                            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
                          >
                            {copiedKey === `ht-${ht}` && (
                              <Check className="h-3 w-3 text-emerald-600" />
                            )}
                            {ht}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar: Chapters + Technical Details */}
              <aside className="space-y-6">
                {videoInfo.chapters.length > 0 && (
                  <div className={`${card} p-5`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                        <ListVideo className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        {t("Chapters", "চ্যাপ্টার")} ({num(videoInfo.chapters.length)})
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            "chapters",
                            videoInfo.chapters
                              .map((c) => `${c.formattedTime} ${c.title}`)
                              .join("\n")
                          )
                        }
                        className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {copiedKey === "chapters"
                          ? t("Copied", "কপি হয়েছে")
                          : t("Copy all", "কপি")}
                      </button>
                    </div>
                    <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
                      {videoInfo.chapters.map((ch) => (
                        <li key={`${ch.startSeconds}-${ch.title}`}>
                          <button
                            type="button"
                            onClick={() => handleSeekTo(ch.startSeconds)}
                            className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          >
                            <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                              {ch.formattedTime}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200">
                              {ch.title}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`${card} p-5`}>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t("Video & Channel Specs", "ভিডিও ও চ্যানেলের বিবরণ")}
                  </h3>
                  <dl className="mt-3 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                    {[
                      {
                        label: t("Video ID", "ভিডিও আইডি"),
                        value: videoInfo.videoId,
                        mono: true,
                      },
                      {
                        label: t("Channel ID", "চ্যানেল আইডি"),
                        value: videoInfo.channelId ?? "—",
                        mono: true,
                      },
                      {
                        label: t("Published", "প্রকাশের তারিখ"),
                        value: formatIsoDate(videoInfo.publishDate, locale),
                      },
                      ...(videoInfo.commentCount !== null
                        ? [
                            {
                              label: t("Comments", "মন্তব্য"),
                              value: formatCompactNumber(videoInfo.commentCount, locale),
                            },
                          ]
                        : []),
                      {
                        label: t("Duration", "সময়কাল"),
                        value:
                          videoInfo.durationSeconds !== null
                            ? `${formatSecondsToTimestamp(videoInfo.durationSeconds)} (${videoInfo.durationSeconds}s)`
                            : "—",
                      },
                      {
                        label: t("Category", "ক্যাটাগরি"),
                        value: videoInfo.category ?? "—",
                      },
                      {
                        label: t("Embeddable", "এমবেড যোগ্য"),
                        value:
                          videoInfo.embeddable === null
                            ? "—"
                            : videoInfo.embeddable
                              ? t("Yes", "হ্যাঁ")
                              : t("Restricted", "সীমাবদ্ধ"),
                      },
                      {
                        label: t("Default Language", "মূল ভাষা"),
                        value: videoInfo.defaultLanguage ?? "—",
                      },
                      {
                        label: t("oEmbed Ratio", "ওএমবেড অনুপাত"),
                        value:
                          videoInfo.oembedWidth && videoInfo.oembedHeight
                            ? `${videoInfo.oembedWidth} × ${videoInfo.oembedHeight}`
                            : "—",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <dt className="text-slate-500 dark:text-slate-400">
                          {row.label}
                        </dt>
                        <dd
                          className={`truncate text-right font-semibold tabular-nums text-slate-900 dark:text-white ${
                            row.mono ? "font-mono text-[11px]" : ""
                          }`}
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </aside>
            </div>
          )}

          {/* ── TAB 2: THUMBNAILS & VIDEO FRAMES ──────────────────────── */}
          {activeTab === "thumbnails" && (
            <div className="space-y-6">
              {/* Spotlight Best Available Thumbnail */}
              {bestThumbnail && (
                <div className={`${card} p-5 sm:p-6`}>
                  <div className="grid gap-5 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:items-center">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                      <Image
                        src={bestThumbnail.url}
                        alt={videoInfo.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 440px"
                        className="object-cover"
                      />
                      <span className="absolute left-3 top-3 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                        {t("Best Quality Available", "সর্বোচ্চ মানের থাম্বনেইল")}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {isBn ? bestThumbnail.labelBn : bestThumbnail.labelEn}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                          {bestThumbnail.width} × {bestThumbnail.height} px ·{" "}
                          {bestThumbnail.aspect} ·{" "}
                          {bestThumbnail.format.toUpperCase()}
                          {bestThumbnail.sizeBytes
                            ? ` · ${formatBytes(bestThumbnail.sizeBytes)}`
                            : ""}
                        </p>
                      </div>
                      <p className="break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        {bestThumbnail.url}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={bestThumbnail.proxyDownloadUrl}
                          download
                          className={primaryBtn}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          {t("Download Image", "ছবি ডাউনলোড করুন")}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            void copyText("best-thumb-url", bestThumbnail.url)
                          }
                          className={ghostBtn}
                        >
                          {copiedKey === "best-thumb-url" ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copiedKey === "best-thumb-url"
                            ? t("URL copied", "লিংক কপি হয়েছে")
                            : t("Copy CDN URL", "লিংক কপি")}
                        </button>
                        <a
                          href={bestThumbnail.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={ghostBtn}
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          {t("Open full size", "পূর্ণ সাইজ দেখুন")}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "all" as const, en: "All Assets", bn: "সব ফরম্যাট" },
                      { id: "jpg" as const, en: "JPG Resolutions", bn: "JPG সাইজ" },
                      { id: "webp" as const, en: "WebP (Lighter)", bn: "WebP ফরম্যাট" },
                      { id: "frame" as const, en: "Storyboard Frames", bn: "ভিডিও ফ্রেম" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setThumbFilter(f.id)}
                      className={`min-h-9 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        thumbFilter === f.id
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {isBn ? f.bn : f.en}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {isBn
                    ? `${toBanglaDigits(filteredThumbnails.length)}টি ভার্সন দেখানো হচ্ছে`
                    : `Showing ${filteredThumbnails.length} thumbnail assets`}
                </p>
              </div>

              {/* All Resolutions Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredThumbnails.map((asset) => {
                  const unavailable = asset.available === false;
                  const copyId = `thumb-${asset.id}`;
                  return (
                    <div
                      key={asset.id}
                      className={`${card} flex flex-col overflow-hidden ${
                        unavailable ? "opacity-65" : ""
                      }`}
                    >
                      <div className="relative aspect-video w-full bg-slate-950">
                        {!unavailable ? (
                          <Image
                            src={asset.url}
                            alt={`${videoInfo.title} — ${asset.labelEn}`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100 p-4 text-center text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                            <ImageIcon className="h-6 w-6 opacity-40" aria-hidden="true" />
                            <span>
                              {t(
                                "Not generated by YouTube for this video",
                                "এই ভিডিওর জন্য ইউটিউবে এই সাইজটি নেই"
                              )}
                            </span>
                          </div>
                        )}
                        <span className="absolute left-2.5 top-2.5 rounded-md bg-slate-950/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                          {asset.badge}
                        </span>
                        {asset.sizeBytes ? (
                          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-slate-950/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-100">
                            {formatBytes(asset.sizeBytes)}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {isBn ? asset.labelBn : asset.labelEn}
                            </h4>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                unavailable
                                  ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              }`}
                            >
                              {unavailable
                                ? t("Unavailable", "নেই")
                                : t("Ready", "প্রস্তুত")}
                            </span>
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {asset.variant}.{asset.format}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={unavailable ? undefined : asset.proxyDownloadUrl}
                            download={!unavailable}
                            aria-disabled={unavailable}
                            className={`flex-1 ${
                              unavailable
                                ? "pointer-events-none inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/50"
                                : "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950"
                            }`}
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("Download", "ডাউনলোড")}
                          </a>
                          <button
                            type="button"
                            disabled={unavailable}
                            onClick={() => void copyText(copyId, asset.url)}
                            title={t("Copy direct URL", "লিংক কপি করুন")}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                          >
                            {copiedKey === copyId ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <a
                            href={unavailable ? undefined : asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={unavailable}
                            title={t("Open in new tab", "নতুন ট্যাবে খুলুন")}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white ${
                              unavailable ? "pointer-events-none opacity-40" : ""
                            }`}
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 3: SUBTITLES & TRANSCRIPT ─────────────────────────── */}
          {activeTab === "transcript" && (
            <div className={`${card} p-5 sm:p-6`}>
              {/* Top Controls: Track Selector + Reload */}
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t("Subtitles & Searchable Transcript", "সাবটাইটেল ও ট্রান্সক্রিপ্ট")}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "Click any timestamp line to seek the preview player, or export as SRT, VTT, or plain TXT.",
                      "যেকোনো টাইমস্ট্যাম্পে ক্লিক করে ভিডিওর সেই অংশে যান অথবা SRT, VTT বা TXT ডাউনলোড করুন।"
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(transcript?.availableTracks ?? videoInfo.captionTracks).length > 0 && (
                    <select
                      aria-label={t("Subtitle language", "সাবটাইটেল ভাষা")}
                      value={selectedTrackKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTrackKey(val);
                        const tracks =
                          transcript?.availableTracks ?? videoInfo.captionTracks;
                        const found = tracks.find(
                          (tr) => `${tr.lang}:${tr.kind}` === val
                        );
                        if (found) {
                          void fetchTranscript(videoInfo.videoId, found);
                        }
                      }}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {(transcript?.availableTracks ?? videoInfo.captionTracks).map(
                        (track) => (
                          <option
                            key={`${track.lang}:${track.kind}:${track.vssId}`}
                            value={`${track.lang}:${track.kind}`}
                          >
                            {track.name} ({track.lang})
                            {track.kind === "asr" ? " — Auto" : ""}
                          </option>
                        )
                      )}
                    </select>
                  )}

                  <button
                    type="button"
                    disabled={transcriptLoading}
                    onClick={() => {
                      const tracks =
                        transcript?.availableTracks ?? videoInfo.captionTracks;
                      const current = tracks.find(
                        (tr) => `${tr.lang}:${tr.kind}` === selectedTrackKey
                      );
                      void fetchTranscript(videoInfo.videoId, current);
                    }}
                    className={ghostBtn}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${transcriptLoading ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    />
                    {t("Refresh", "রিফ্রেশ")}
                  </button>
                </div>
              </div>

              {transcriptLoading && (
                <div className="space-y-3 py-8">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                    />
                  ))}
                </div>
              )}

              {!transcriptLoading && transcriptError && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{transcriptError}</p>
                </div>
              )}

              {!transcriptLoading &&
                !transcriptError &&
                transcript &&
                transcript.segments.length === 0 && (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
                    <Captions
                      className="mx-auto h-8 w-8 text-slate-400"
                      aria-hidden="true"
                    />
                    <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">
                      {t("No transcript lines available", "কোনো সাবটাইটেল লাইন পাওয়া যায়নি")}
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {transcript.warning ||
                        t(
                          "This video either does not have public captions enabled or YouTube restricted direct caption access.",
                          "এই ভিডিওতে পাবলিক সাবটাইটেল চালু নেই অথবা ইউটিউব সরাসরি অ্যাক্সেস সীমিত করেছে।"
                        )}
                    </p>
                  </div>
                )}

              {!transcriptLoading &&
                transcript &&
                transcript.segments.length > 0 && (
                  <div className="mt-5 space-y-4">
                    {/* Search + Export Toolbar */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="relative flex-1 sm:max-w-sm">
                        <Search
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id={transcriptSearchId}
                          type="search"
                          value={transcriptQuery}
                          onChange={(e) => setTranscriptQuery(e.target.value)}
                          placeholder={t(
                            "Search inside transcript…",
                            "ট্রান্সক্রিপ্টের ভেতর খুঁজুন…"
                          )}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowTimestamps((prev) => !prev)}
                          className={ghostBtn}
                        >
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {showTimestamps
                            ? t("Hide timestamps", "সময় লুকান")
                            : t("Show timestamps", "সময় দেখান")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void copyText(
                              "tr-plain",
                              formatTranscriptToPlainText(filteredSegments)
                            )
                          }
                          className={ghostBtn}
                        >
                          {copiedKey === "tr-plain" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copiedKey === "tr-plain"
                            ? t("Copied", "কপি হয়েছে")
                            : t("Copy text", "টেক্সট কপি")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void copyText(
                              "tr-ts",
                              formatTranscriptToTimestampedText(filteredSegments)
                            )
                          }
                          className={ghostBtn}
                        >
                          {copiedKey === "tr-ts" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copiedKey === "tr-ts"
                            ? t("Copied", "কপি হয়েছে")
                            : t("With time", "সময়সহ কপি")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerTextDownload(
                              `youtube-${videoInfo.videoId}-${transcript.lang || "sub"}.srt`,
                              formatTranscriptToSrt(transcript.segments),
                              "application/x-subrip;charset=utf-8"
                            )
                          }
                          className={primaryBtn}
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          .SRT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerTextDownload(
                              `youtube-${videoInfo.videoId}-${transcript.lang || "sub"}.vtt`,
                              formatTranscriptToVtt(transcript.segments),
                              "text/vtt;charset=utf-8"
                            )
                          }
                          className={ghostBtn}
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          .VTT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerTextDownload(
                              `youtube-${videoInfo.videoId}-${transcript.lang || "sub"}.txt`,
                              showTimestamps
                                ? formatTranscriptToTimestampedText(transcript.segments)
                                : formatTranscriptToPlainText(transcript.segments),
                              "text/plain;charset=utf-8"
                            )
                          }
                          className={ghostBtn}
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          .TXT
                        </button>
                      </div>
                    </div>

                    {/* Stats Line */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      <span>
                        {isBn
                          ? `${toBanglaDigits(filteredSegments.length)} / ${toBanglaDigits(transcript.segments.length)} লাইন`
                          : `${filteredSegments.length.toLocaleString("en-US")} of ${transcript.segments.length.toLocaleString("en-US")} lines`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {isBn
                          ? `${toBanglaDigits(transcript.wordCount)} শব্দ`
                          : `${transcript.wordCount.toLocaleString("en-US")} words`}
                      </span>
                      {transcript.kind === "asr" && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {t("Auto-generated captions", "অটো-জেনারেটেড ক্যাপশন")}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Transcript Lines */}
                    <div className="max-h-[460px] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/50">
                      {filteredSegments.map((seg, idx) => (
                        <div
                          key={`${seg.startMs}-${idx}`}
                          className="flex items-start gap-3 px-4 py-2.5 text-[13.5px] leading-relaxed transition-colors hover:bg-white dark:hover:bg-slate-900"
                        >
                          {showTimestamps && (
                            <button
                              type="button"
                              onClick={() => handleSeekTo(seg.startMs / 1000)}
                              title={t(
                                "Jump preview player to this timestamp",
                                "ভিডিওর এই সময়ে যান"
                              )}
                              className="mt-0.5 shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300"
                            >
                              {formatSecondsToTimestamp(seg.startMs / 1000)}
                            </button>
                          )}
                          <p className="text-slate-700 dark:text-slate-200">
                            {seg.text}
                          </p>
                        </div>
                      ))}
                      {filteredSegments.length === 0 && (
                        <p className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "No lines match your search filter.",
                            "আপনার সার্চের সাথে কোনো লাইন মেলেনি।"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* ── TAB 4: EMBED BUILDER & PUBLIC APIS ────────────────────── */}
          {activeTab === "embed" && publicEndpoints && (
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              {/* Interactive Responsive Embed Builder */}
              <div className={`${card} space-y-5 p-5 sm:p-6`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t("Responsive Embed Code Builder", "রেসপনসিভ এমবেড কোড বিল্ডার")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t(
                        "Customize clean HTML iframe code for WordPress, Notion, or web apps.",
                        "ওয়েবসাইট বা ব্লগের জন্য কাস্টম এমবেড কোড তৈরি করুন।"
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyText("embed-html", embedHtml)}
                    className={primaryBtn}
                  >
                    {copiedKey === "embed-html" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedKey === "embed-html"
                      ? t("Copied", "কপি হয়েছে")
                      : t("Copy HTML", "HTML কপি")}
                  </button>
                </div>

                {/* Controls Grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={embedPrivacy}
                      onChange={(e) => setEmbedPrivacy(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    {t("Privacy mode (nocookie)", "প্রাইভেসি মোড (nocookie)")}
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={embedResponsive}
                      onChange={(e) => setEmbedResponsive(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    {t("Responsive container", "রেসপনসিভ কন্টেইনার")}
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={embedControls}
                      onChange={(e) => setEmbedControls(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    {t("Show player controls", "প্লেয়ার কন্ট্রোল দেখান")}
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={embedRelZero}
                      onChange={(e) => setEmbedRelZero(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    {t("Same-channel related (rel=0)", "নিজ চ্যানেলের সাজেস্টেড")}
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={embedAutoplay}
                      onChange={(e) => {
                        setEmbedAutoplay(e.target.checked);
                        if (e.target.checked) setEmbedMute(true);
                      }}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    {t("Autoplay (muted)", "অটোপ্লে (মিউট)")}
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={embedLoop}
                      onChange={(e) => setEmbedLoop(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    {t("Loop video", "ভিডিও লুপ করুন")}
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t("Start time (e.g. 90 or 1:30)", "শুরুর সময় (যেমন 90 বা 1:30)")}
                    </label>
                    <input
                      type="text"
                      value={embedStartInput}
                      onChange={(e) => setEmbedStartInput(e.target.value)}
                      placeholder="0:00"
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-950"
                    />
                  </div>

                  {embedResponsive ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {t("Aspect ratio", "অনুপাত (Aspect Ratio)")}
                      </label>
                      <select
                        value={embedAspect}
                        onChange={(e) =>
                          setEmbedAspect(e.target.value as "16:9" | "9:16" | "4:3")
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="16:9">16:9 — Standard HD</option>
                        <option value="9:16">9:16 — Shorts / Vertical</option>
                        <option value="4:3">4:3 — Classic</option>
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {t("Width (px)", "প্রস্থ")}
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={embedWidth}
                          onChange={(e) => setEmbedWidth(Number(e.target.value))}
                          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs tabular-nums dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {t("Height (px)", "উচ্চতা")}
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={embedHeight}
                          onChange={(e) => setEmbedHeight(Number(e.target.value))}
                          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs tabular-nums dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11.5px] leading-relaxed text-emerald-300 dark:border-slate-800">
                  <code>{embedHtml}</code>
                </pre>
              </div>

              {/* Public YouTube Endpoints, Share Snippets & Raw JSON */}
              <div className="space-y-6">
                <div className={`${card} p-5 sm:p-6`}>
                  <h3 className="inline-flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    <Globe className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    {t(
                      "Public YouTube URLs & Open Endpoints",
                      "পাবলিক ইউটিউব লিংক ও ওপেন এপিআই"
                    )}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "Direct links to publicly accessible YouTube APIs, feeds, and creator snippets.",
                      "ইউটিউবের উন্মুক্ত oEmbed এপিআই, চ্যানেল RSS ফিড এবং মার্কডাউন স্নিপেট।"
                    )}
                  </p>

                  <div className="mt-4 space-y-2.5">
                    {(
                      [
                        {
                          key: "ep-watch",
                          label: t("Canonical Watch URL", "মূল ওয়াচ লিংক"),
                          value: publicEndpoints.watchUrl,
                          external: true,
                        },
                        {
                          key: "ep-short",
                          label: t("Short Share Link (youtu.be)", "শর্ট লিংক (youtu.be)"),
                          value:
                            embedOptions && embedOptions.startSeconds > 0
                              ? `${publicEndpoints.shortUrl}?t=${embedOptions.startSeconds}`
                              : publicEndpoints.shortUrl,
                          external: true,
                        },
                        {
                          key: "ep-oembed",
                          label: t("Official oEmbed JSON API", "অফিসিয়াল oEmbed JSON এপিআই"),
                          value: publicEndpoints.oembedJsonUrl,
                          external: true,
                        },
                        ...(publicEndpoints.channelRssUrl
                          ? [
                              {
                                key: "ep-rss",
                                label: t("Channel Atom / RSS Feed XML", "চ্যানেল RSS ফিড XML"),
                                value: publicEndpoints.channelRssUrl,
                                external: true,
                              },
                            ]
                          : []),
                        {
                          key: "ep-md",
                          label: t("Markdown Thumbnail Card", "মার্কডাউন থাম্বনেইল কার্ড"),
                          value: `[![${videoInfo.title}](${bestThumbnail?.url ?? publicEndpoints.maxResThumbUrl})](${publicEndpoints.watchUrl})`,
                          external: false,
                        },
                        {
                          key: "ep-html",
                          label: t("HTML Linked Thumbnail", "HTML থাম্বনেইল লিংক"),
                          value: `<a href="${publicEndpoints.watchUrl}" target="_blank" rel="noopener noreferrer"><img src="${bestThumbnail?.url ?? publicEndpoints.maxResThumbUrl}" alt="${videoInfo.title.replace(/"/g, "&quot;")}" /></a>`,
                          external: false,
                        },
                      ] as const
                    ).map((item) => (
                      <div
                        key={item.key}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {item.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void copyText(item.key, item.value)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
                            >
                              {copiedKey === item.key ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedKey === item.key
                                ? t("Copied", "কপি")
                                : t("Copy", "কপি")}
                            </button>
                            {item.external && (
                              <a
                                href={item.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t("Open endpoint", "লিংক খুলুন")}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw JSON Developer Inspector */}
                <div className={`${card} p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRawJson((prev) => !prev)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
                    >
                      <FileJson className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      {t("Raw JSON Payload", "সম্পূর্ণ JSON ডেটা")}
                      {showRawJson ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void copyText("raw-json", JSON.stringify(videoInfo, null, 2))
                        }
                        className={ghostBtn}
                      >
                        {copiedKey === "raw-json" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedKey === "raw-json"
                          ? t("Copied", "কপি হয়েছে")
                          : t("Copy JSON", "JSON কপি")}
                      </button>
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className={ghostBtn}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        .JSON
                      </button>
                    </div>
                  </div>
                  {showRawJson && (
                    <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200 dark:border-slate-800">
                      <code>{JSON.stringify(videoInfo, null, 2)}</code>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

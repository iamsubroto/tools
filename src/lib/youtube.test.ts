import { describe, expect, it } from "vitest";
import {
  buildEmbedHtml,
  buildEmbedUrl,
  buildPublicEndpoints,
  buildThumbnailAssets,
  extractChapters,
  extractHashtags,
  formatSecondsToTimestamp,
  formatTranscriptToPlainText,
  formatTranscriptToSrt,
  formatTranscriptToTimestampedText,
  formatTranscriptToVtt,
  parseIso8601Duration,
  parseJson3Transcript,
  parseXmlTranscript,
  parseYouTubeInput,
  parseYouTubeTimestamp,
} from "./youtube";

const SAMPLE_ID = "dQw4w9WgXcQ";

describe("parseYouTubeInput", () => {
  it("parses raw 11-character video ID", () => {
    const res = parseYouTubeInput(SAMPLE_ID);
    expect(res).toMatchObject({
      videoId: SAMPLE_ID,
      sourceType: "video-id",
      startSeconds: null,
      canonicalUrl: `https://www.youtube.com/watch?v=${SAMPLE_ID}`,
      shortUrl: `https://youtu.be/${SAMPLE_ID}`,
    });
  });

  it("parses standard watch URL with timestamp and playlist", () => {
    const res = parseYouTubeInput(
      `https://www.youtube.com/watch?v=${SAMPLE_ID}&t=1m30s&list=PL12345`
    );
    expect(res).toMatchObject({
      videoId: SAMPLE_ID,
      sourceType: "watch-url",
      startSeconds: 90,
      playlistId: "PL12345",
    });
  });

  it("parses youtu.be short URL without protocol", () => {
    const res = parseYouTubeInput(`youtu.be/${SAMPLE_ID}?si=abc&t=42`);
    expect(res).toMatchObject({
      videoId: SAMPLE_ID,
      sourceType: "short-url",
      startSeconds: 42,
    });
  });

  it("parses YouTube Shorts, Live, Embed, Music, and No-Cookie URLs", () => {
    expect(parseYouTubeInput(`https://www.youtube.com/shorts/${SAMPLE_ID}`)?.sourceType).toBe(
      "shorts-url"
    );
    expect(parseYouTubeInput(`https://www.youtube.com/live/${SAMPLE_ID}`)?.sourceType).toBe(
      "live-url"
    );
    expect(
      parseYouTubeInput(`https://www.youtube-nocookie.com/embed/${SAMPLE_ID}?start=15`)
    ).toMatchObject({
      videoId: SAMPLE_ID,
      sourceType: "embed-url",
      startSeconds: 15,
    });
    expect(
      parseYouTubeInput(`https://music.youtube.com/watch?v=${SAMPLE_ID}`)?.sourceType
    ).toBe("music-url");
  });

  it("parses thumbnail CDN URLs and pasted iframe HTML", () => {
    expect(
      parseYouTubeInput(`https://i.ytimg.com/vi/${SAMPLE_ID}/maxresdefault.jpg`)
    ).toMatchObject({
      videoId: SAMPLE_ID,
      sourceType: "thumbnail-url",
    });

    expect(
      parseYouTubeInput(
        `<iframe width="560" height="315" src="https://www.youtube.com/embed/${SAMPLE_ID}?start=65" allowfullscreen></iframe>`
      )
    ).toMatchObject({
      videoId: SAMPLE_ID,
      sourceType: "iframe-html",
      startSeconds: 65,
    });
  });

  it("rejects non-YouTube URLs and malformed IDs", () => {
    expect(parseYouTubeInput("")).toBeNull();
    expect(parseYouTubeInput("not-a-valid-id")).toBeNull();
    expect(parseYouTubeInput("https://vimeo.com/123456789")).toBeNull();
    expect(parseYouTubeInput("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});

describe("timestamps, chapters, hashtags & duration", () => {
  it("parses various timestamp formats", () => {
    expect(parseYouTubeTimestamp("45")).toBe(45);
    expect(parseYouTubeTimestamp("1m30s")).toBe(90);
    expect(parseYouTubeTimestamp("1h2m3s")).toBe(3723);
    expect(parseYouTubeTimestamp("02:15")).toBe(135);
    expect(parseYouTubeTimestamp("1:05:10")).toBe(3910);
    expect(parseYouTubeTimestamp("bad")).toBeNull();
  });

  it("parses ISO 8601 duration strings", () => {
    expect(parseIso8601Duration("PT3M33S")).toBe(213);
    expect(parseIso8601Duration("PT1H0M5S")).toBe(3605);
    expect(parseIso8601Duration("PT45S")).toBe(45);
    expect(parseIso8601Duration("invalid")).toBeNull();
  });

  it("extracts hashtags without duplicates", () => {
    const desc = "Check out #NextJS, #Bangladesh and #nextjs tutorials #বাংলাদেশ";
    expect(extractHashtags(desc)).toEqual(["#NextJS", "#Bangladesh", "#বাংলাদেশ"]);
  });

  it("extracts sorted chapters from description", () => {
    const desc = [
      "Chapters:",
      "0:00 Introduction",
      "02:15 - Setup & API",
      "[10:30] Deployment Tips",
    ].join("\n");
    expect(extractChapters(desc, 900)).toEqual([
      { title: "Introduction", startSeconds: 0, formattedTime: "0:00" },
      { title: "Setup & API", startSeconds: 135, formattedTime: "2:15" },
      { title: "Deployment Tips", startSeconds: 630, formattedTime: "10:30" },
    ]);
  });

  it("formats seconds into clean timestamps", () => {
    expect(formatSecondsToTimestamp(5)).toBe("0:05");
    expect(formatSecondsToTimestamp(125)).toBe("2:05");
    expect(formatSecondsToTimestamp(3661)).toBe("1:01:01");
  });
});

describe("transcript parsing and subtitle exports", () => {
  it("parses JSON3 caption events and decodes HTML entities", () => {
    const segs = parseJson3Transcript({
      events: [
        { tStartMs: 1200, dDurationMs: 2500, segs: [{ utf8: "Hello &amp; welcome!" }] },
        { tStartMs: 4000, dDurationMs: 1800, segs: [{ utf8: "It&#39;s working." }] },
      ],
    });
    expect(segs).toEqual([
      { startMs: 1200, durationMs: 2500, text: "Hello & welcome!" },
      { startMs: 4000, durationMs: 1800, text: "It's working." },
    ]);
  });

  it("parses legacy XML and srv3 XML captions", () => {
    const legacy = `<transcript><text start="1.5" dur="2.5">Line &quot;one&quot;</text></transcript>`;
    expect(parseXmlTranscript(legacy)).toEqual([
      { startMs: 1500, durationMs: 2500, text: 'Line "one"' },
    ]);

    const srv3 = `<timedtext format="3"><body><p d="1500" t="3000" w="1"><s ac="0">Second</s><s t="200"> line</s></p></body></timedtext>`;
    expect(parseXmlTranscript(srv3)).toEqual([
      { startMs: 3000, durationMs: 1500, text: "Second line" },
    ]);
  });

  it("exports valid SRT, VTT, timestamped, and plain text", () => {
    const segments = [
      { startMs: 1500, durationMs: 2500, text: "First subtitle" },
      { startMs: 65000, durationMs: 3000, text: "Second subtitle" },
    ];
    expect(formatTranscriptToSrt(segments)).toContain(
      "1\n00:00:01,500 --> 00:00:04,000\nFirst subtitle"
    );
    expect(formatTranscriptToVtt(segments)).toContain(
      "WEBVTT\n\n00:00:01.500 --> 00:00:04.000\nFirst subtitle"
    );
    expect(formatTranscriptToTimestampedText(segments)).toBe(
      "[0:01] First subtitle\n[1:05] Second subtitle"
    );
    expect(formatTranscriptToPlainText(segments)).toBe("First subtitle Second subtitle");
  });
});

describe("thumbnails, embed & public endpoints", () => {
  it("builds complete thumbnail catalog with JPG, WebP, and storyboard frames", () => {
    const assets = buildThumbnailAssets(SAMPLE_ID);
    expect(assets.length).toBeGreaterThanOrEqual(10);
    expect(assets[0].url).toBe(`https://i.ytimg.com/vi/${SAMPLE_ID}/maxresdefault.jpg`);
    expect(assets.some((a) => a.format === "webp")).toBe(true);
    expect(assets.some((a) => a.category === "frame")).toBe(true);
  });

  it("builds privacy-enhanced embed URL and responsive HTML", () => {
    const opts = {
      videoId: SAMPLE_ID,
      privacyEnhanced: true,
      responsive: true,
      aspectRatio: "16:9" as const,
      width: 560,
      height: 315,
      startSeconds: 30,
      autoplay: false,
      mute: false,
      controls: true,
      loop: false,
      relZero: true,
    };
    const url = buildEmbedUrl(opts);
    expect(url).toBe(
      `https://www.youtube-nocookie.com/embed/${SAMPLE_ID}?start=30&rel=0`
    );
    const html = buildEmbedHtml(opts, "Demo Video");
    expect(html).toContain("padding-bottom:56.25%");
    expect(html).toContain(url);
  });

  it("builds public endpoints including channel RSS when channelId exists", () => {
    const links = buildPublicEndpoints(SAMPLE_ID, "UCuAXFkgsw1L7xaCfnd5JJOw");
    expect(links.channelRssUrl).toBe(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCuAXFkgsw1L7xaCfnd5JJOw"
    );
    expect(links.oembedJsonUrl).toContain("youtube.com/oembed");
  });
});

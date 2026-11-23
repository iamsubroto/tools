import type { CalculatorResultBase, SmartInsight } from "./types";
import { toBanglaDigits } from "@/lib/formatters";

export interface WordCounterResult extends CalculatorResultBase {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  containsUnicodeSmsChars: boolean;
  smsSegments: number;
  smsLimitPerSegment: number;
}

/**
 * Basic GSM-7 check: if any character is outside ASCII printable range (e.g. Bangla Unicode),
 * telecom operators switch SMS encoding to UCS-2 (70 chars single / 67 chars multi-part).
 */
function hasNonGsmChars(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}

export function analyzeText(text: string): WordCounterResult {
  const safe = text ?? "";
  const trimmed = safe.trim();

  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = safe.length;
  const charactersNoSpaces = safe.replace(/\s/g, "").length;

  // Match English (. ! ?) and Bangla Dari (।) sentence terminators
  const sentenceMatches = trimmed
    ? trimmed.match(/[^.!?।]+[.!?।]+/g)
    : null;
  const sentences = sentenceMatches
    ? sentenceMatches.length
    : trimmed
      ? 1
      : 0;

  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    : 0;
  const lines = safe.length > 0 ? safe.split(/\r?\n/).length : 0;

  const readingTimeMinutes = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
  const speakingTimeMinutes = words > 0 ? Math.max(1, Math.ceil(words / 130)) : 0;

  const containsUnicodeSmsChars = hasNonGsmChars(safe);
  let smsSegments = 0;
  let smsLimitPerSegment = containsUnicodeSmsChars ? 70 : 160;

  if (characters > 0) {
    if (containsUnicodeSmsChars) {
      if (characters <= 70) {
        smsSegments = 1;
        smsLimitPerSegment = 70;
      } else {
        smsSegments = Math.ceil(characters / 67);
        smsLimitPerSegment = 67;
      }
    } else {
      if (characters <= 160) {
        smsSegments = 1;
        smsLimitPerSegment = 160;
      } else {
        smsSegments = Math.ceil(characters / 153);
        smsLimitPerSegment = 153;
      }
    }
  }

  const smartInsights: SmartInsight[] = [];
  if (characters > 0 && containsUnicodeSmsChars) {
    smartInsights.push({
      id: "bangla-sms-info",
      tone: "info",
      titleEn: "Bangla / Unicode SMS Encoding Detected",
      titleBn: "বাংলা / ইউনিকোড এসএমএস হিসাব",
      bodyEn: `Because your text contains Bangla or non-ASCII characters, mobile operators count 70 characters for 1 SMS (67 per part for multi-part). This message uses ${smsSegments} SMS segment(s).`,
      bodyBn: `বাংলা বা ইউনিকোড অক্ষর থাকায় মোবাইল অপারেটর ১টি এসএমএস-এ ৭০ অক্ষর (একাধিক অংশে প্রতিটিতে ৬৭ অক্ষর) ধরে হিসাব করে। এই লেখাটি পাঠাতে ${toBanglaDigits(smsSegments)}টি এসএমএস লাগবে।`,
    });
  }

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes,
    speakingTimeMinutes,
    containsUnicodeSmsChars,
    smsSegments,
    smsLimitPerSegment,
    smartInsights,
  };
}

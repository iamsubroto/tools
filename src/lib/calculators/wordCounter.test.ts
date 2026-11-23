import { describe, expect, it } from "vitest";
import { analyzeText } from "./wordCounter";

describe("analyzeText", () => {
  it("handles empty and whitespace-only strings cleanly", () => {
    const empty = analyzeText("");
    expect(empty.words).toBe(0);
    expect(empty.characters).toBe(0);
    expect(empty.sentences).toBe(0);
    expect(empty.paragraphs).toBe(0);
    expect(empty.smsSegments).toBe(0);

    const spaces = analyzeText("   \n\n  ");
    expect(spaces.words).toBe(0);
    expect(spaces.charactersNoSpaces).toBe(0);
    expect(spaces.paragraphs).toBe(0);
  });

  it("counts English words, sentences, paragraphs, and GSM-7 SMS segments accurately", () => {
    const sample =
      "Hello Bangladesh. Welcome to Tools BD!\n\nThis is paragraph two.";
    const res = analyzeText(sample);
    expect(res.words).toBe(10);
    expect(res.sentences).toBe(3);
    expect(res.paragraphs).toBe(2);
    expect(res.containsUnicodeSmsChars).toBe(false);
    expect(res.smsSegments).toBe(1);
    expect(res.readingTimeMinutes).toBe(1);
  });

  it("detects Bangla Dari (।) sentences and UCS-2 (70/67) SMS segmentation", () => {
    const bangla =
      "বাংলাদেশ একটি সুন্দর দেশ। আমরা সবাই বাংলায় লিখি। টুলস বিডি সবার জন্য ফ্রি।";
    const res = analyzeText(bangla);
    expect(res.words).toBe(13);
    expect(res.sentences).toBe(3);
    expect(res.containsUnicodeSmsChars).toBe(true);
    // >70 chars -> 2 UCS-2 segments
    expect(res.smsSegments).toBe(Math.ceil(bangla.length / 67));
  });
});

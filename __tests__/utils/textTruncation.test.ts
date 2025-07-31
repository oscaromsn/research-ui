import { describe, expect, test } from "vitest";
import {
  smartTruncate,
  truncateForBrief,
  truncateForReasoning,
  truncateForSummary,
  truncateForTitle,
} from "@/lib/utils/textTruncation";

describe("smartTruncate", () => {
  test("returns original text when shorter than maxLength", () => {
    const text = "Short text";
    const result = smartTruncate(text, 50);
    expect(result).toBe("Short text");
  });

  test("returns original text when exactly at maxLength", () => {
    const text = "Exactly fifty characters long text here is good";
    const result = smartTruncate(text, 47);
    expect(result).toBe(text);
  });

  test("truncates at word boundary and adds ellipsis", () => {
    const text = "This is a very long piece of text that should be truncated";
    const result = smartTruncate(text, 30);
    expect(result).toBe("This is a very long piece...");
    expect(result.length).toBeLessThanOrEqual(30);
  });

  test("handles text without spaces by truncating at maxLength", () => {
    const text = "verylongtextwithoutspaces";
    const result = smartTruncate(text, 10);
    expect(result).toBe("verylon...");
    expect(result.length).toBe(10);
  });

  test("handles very short maxLength", () => {
    const text = "test";
    const result = smartTruncate(text, 2);
    expect(result).toBe("te");
  });

  test("handles empty text", () => {
    const result = smartTruncate("", 10);
    expect(result).toBe("");
  });

  test("handles null/undefined text gracefully", () => {
    // @ts-expect-error Testing null input handling
    const result1 = smartTruncate(null, 10);
    // @ts-expect-error Testing undefined input handling
    const result2 = smartTruncate(undefined, 10);
    expect(result1).toBe(null);
    expect(result2).toBe(undefined);
  });

  test("finds last space within range", () => {
    const text = "One two three four five six seven eight nine ten";
    const result = smartTruncate(text, 20);
    expect(result).toBe("One two three...");
    expect(result.length).toBeLessThanOrEqual(20);
  });

  test("does not truncate mid-word when space exists", () => {
    const text = "Word boundary test here";
    const result = smartTruncate(text, 15);
    expect(result).toBe("Word...");
    expect(result).not.toContain("boundar...");
  });

  test("preserves single spaces at boundaries", () => {
    const text = "A B C D E F G H I J K L M N";
    const result = smartTruncate(text, 10);
    expect(result).toBe("A B C D...");
  });

  test("handles text starting with space", () => {
    const text = " Leading space text here";
    const result = smartTruncate(text, 15);
    expect(result).toBe(" Leading...");
  });
});

describe("predefined truncation functions", () => {
  test("truncateForSummary uses 300 character limit", () => {
    const longText = "A".repeat(400);
    const result = truncateForSummary(longText);
    expect(result.length).toBeLessThanOrEqual(300);
    expect(result.endsWith("...")).toBe(true);
  });

  test("truncateForTitle uses 70 character limit", () => {
    const longTitle =
      "This is a very long title that should be truncated at word boundaries for display purposes";
    const result = truncateForTitle(longTitle);
    expect(result.length).toBeLessThanOrEqual(70);
    expect(result.endsWith("...")).toBe(true);
  });

  test("truncateForBrief uses 50 character limit", () => {
    const longBrief =
      "This is a brief description that is too long for display";
    const result = truncateForBrief(longBrief);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith("...")).toBe(true);
  });

  test("truncateForReasoning uses 500 character limit", () => {
    const longReasoning = "R".repeat(600);
    const result = truncateForReasoning(longReasoning);
    expect(result.length).toBeLessThanOrEqual(500);
    expect(result.endsWith("...")).toBe(true);
  });

  test("predefined functions do not truncate short text", () => {
    const shortText = "Short";
    expect(truncateForSummary(shortText)).toBe("Short");
    expect(truncateForTitle(shortText)).toBe("Short");
    expect(truncateForBrief(shortText)).toBe("Short");
    expect(truncateForReasoning(shortText)).toBe("Short");
  });
});

describe("real-world scenarios", () => {
  test("handles legal document summaries", () => {
    const legalSummary =
      "This case establishes the principle that contract interpretation must consider the entire agreement context, including surrounding circumstances and the parties' apparent intentions. The court held that ambiguous terms should be construed against the drafter, particularly in adhesion contracts where one party had superior bargaining power.";
    const result = truncateForSummary(legalSummary);
    expect(result.length).toBeLessThanOrEqual(300);
    if (result.includes("...")) {
      expect(result.endsWith("...")).toBe(true);
      // Should not cut mid-word
      const withoutEllipsis = result.slice(0, -3);
      expect(withoutEllipsis.endsWith(" ")).toBe(false); // Should end at a word boundary
    }
  });

  test("handles document titles with legal citations", () => {
    const title =
      "Smith v. Johnson, 123 F.3d 456 (9th Cir. 2023) - Contract Interpretation and Ambiguity Resolution Standards";
    const result = truncateForTitle(title);
    expect(result.length).toBeLessThanOrEqual(70);
    if (result.includes("...")) {
      expect(result.endsWith("...")).toBe(true);
    }
  });

  test("handles error messages", () => {
    const errorMsg =
      "Analysis failed due to document parsing error: Unable to extract text content from PDF format";
    const result = truncateForBrief(errorMsg);
    expect(result.length).toBeLessThanOrEqual(50);
    if (result.includes("...")) {
      expect(result.endsWith("...")).toBe(true);
    }
  });

  test("handles reasoning summaries", () => {
    const reasoning =
      "The analysis begins by examining the legal question in the context of established precedent. First, we identify the relevant statutory framework and applicable case law. Second, we analyze how courts have interpreted similar fact patterns in previous decisions. Third, we consider any distinguishing factors that might affect the outcome. Fourth, we evaluate the strength of competing arguments and potential counterarguments. Finally, we synthesize the findings to provide a comprehensive assessment of the legal position.";
    const result = truncateForReasoning(reasoning);
    expect(result.length).toBeLessThanOrEqual(500);
    if (result.includes("...")) {
      expect(result.endsWith("...")).toBe(true);
    }
  });
});

describe("edge cases and robustness", () => {
  test("handles text with only spaces", () => {
    const spacesOnly = "     ";
    const result = smartTruncate(spacesOnly, 3);
    expect(result).toBe("   ");
  });

  test("handles text with multiple consecutive spaces", () => {
    const text = "Word1    Word2    Word3";
    const result = smartTruncate(text, 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  test("handles unicode characters", () => {
    const unicode = "Café résumé naïve 你好 🚀";
    const result = smartTruncate(unicode, 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  test("handles very long words", () => {
    const longWord =
      "pneumonoultramicroscopicsilicovolcanoconiosisextraordinaire";
    const result = smartTruncate(longWord, 20);
    expect(result).toBe("pneumonoultramicr...");
    expect(result.length).toBe(20);
  });

  test("handles text with newlines and tabs", () => {
    const textWithWhitespace = "Line 1\nLine 2\tTabbed content here";
    const result = smartTruncate(textWithWhitespace, 15);
    expect(result.length).toBeLessThanOrEqual(15);
  });
});

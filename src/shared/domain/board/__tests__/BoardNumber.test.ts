import { describe, expect, it } from "@jest/globals";

import { BOARD_NUMBER_MAX_LENGTH, normalizeBoardNumber } from "../BoardNumber";

describe("normalizeBoardNumber", () => {
  it("removes leading zeros for purely numeric inputs", () => {
    expect(normalizeBoardNumber("00123")).toBe("123");
    expect(normalizeBoardNumber("000")).toBe("0");
  });

  it("keeps hyphenated segments as-is", () => {
    expect(normalizeBoardNumber("01-2")).toBe("01-2");
  });

  it("returns null for nullish or empty inputs", () => {
    expect(normalizeBoardNumber(null)).toBeNull();
    expect(normalizeBoardNumber(undefined)).toBeNull();
    expect(normalizeBoardNumber("")).toBeNull();
    expect(normalizeBoardNumber("   ")).toBeNull();
  });

  it("normalizes surrounding whitespace and full-width hyphens", () => {
    expect(normalizeBoardNumber("  12-3  ")).toBe("12-3");
    expect(normalizeBoardNumber("01－2")).toBe("01-2");
  });

  it("allows zero segments around hyphens", () => {
    expect(normalizeBoardNumber("0-0")).toBe("0-0");
    expect(normalizeBoardNumber("00-00")).toBe("00-00");
  });

  it("throws for invalid formats", () => {
    expect(() => normalizeBoardNumber("abc")).toThrow();
    expect(() => normalizeBoardNumber("1-2-3")).toThrow();
  });

  it("enforces maximum length", () => {
    const tooLong = "1".repeat(BOARD_NUMBER_MAX_LENGTH + 1);
    expect(() => normalizeBoardNumber(tooLong)).toThrow();
  });

  it("accepts numeric inputs", () => {
    expect(normalizeBoardNumber(123)).toBe("123");
    expect(normalizeBoardNumber(1)).toBe("1");
    expect(normalizeBoardNumber(0)).toBe("0");
  });
});

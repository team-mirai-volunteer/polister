import { describe, expect, it } from "@jest/globals";

import { normalizeBoardNumber } from "../BoardNumber";

describe("normalizeBoardNumber", () => {
  it("removes leading zeros for purely numeric inputs", () => {
    expect(normalizeBoardNumber("00123")).toBe("123");
    expect(normalizeBoardNumber("000")).toBe("0");
  });

  it("keeps hyphenated segments as-is", () => {
    expect(normalizeBoardNumber("01-2")).toBe("01-2");
  });
});

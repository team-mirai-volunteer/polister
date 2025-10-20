import { sanitizeLimit } from "../sanitizeLimit";

describe("sanitizeLimit", () => {
  it("accepts positive integers", () => {
    expect(sanitizeLimit(10)).toBe(10);
  });

  it("floors positive decimals", () => {
    expect(sanitizeLimit(7.9)).toBe(7);
  });

  it("clamps by max when provided", () => {
    expect(sanitizeLimit(120, { max: 50 })).toBe(50);
  });

  it("ignores non-positive numbers", () => {
    expect(sanitizeLimit(0)).toBeUndefined();
    expect(sanitizeLimit(-5)).toBeUndefined();
  });

  it("rejects NaN and Infinity", () => {
    expect(sanitizeLimit(NaN)).toBeUndefined();
    expect(sanitizeLimit(Infinity)).toBeUndefined();
  });

  it("accepts numeric strings", () => {
    expect(sanitizeLimit("25")).toBe(25);
    expect(sanitizeLimit(" 42.8 ")).toBe(42);
  });

  it("applies max to numeric strings", () => {
    expect(sanitizeLimit("200", { max: 150 })).toBe(150);
  });

  it("rejects invalid strings", () => {
    expect(sanitizeLimit("abc")).toBeUndefined();
    expect(sanitizeLimit(" ")).toBeUndefined();
  });
});

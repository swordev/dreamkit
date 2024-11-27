import { s } from "../../src/index.js";
import { describe, expect, it } from "vitest";

describe("custom.test", () => {
  it("with assert as function and refine", () => {
    const httpsUrlType = s
      .custom((value) => typeof value === "string")
      .refine((value) => value.startsWith("https://"));
    expect(httpsUrlType.test("https://example.com")).toBe(true);
    expect(httpsUrlType.test("example.com")).toBe(false);
  });
  it("with assert as options and refine", () => {
    const httpsUrlType = s
      .custom({
        assert: (value) => typeof value === "string",
      })
      .refine((value) => value.startsWith("https://"));
    expect(httpsUrlType.test("https://example.com")).toBe(true);
    expect(httpsUrlType.test("example.com")).toBe(false);
  });
  it("with instanceof", () => {
    const arrayBuffer = s.custom((value) => value instanceof ArrayBuffer);
    expect(arrayBuffer.test(new ArrayBuffer(8))).toBe(true);
    expect(arrayBuffer.test(null)).toBe(false);
  });
  it("with instanceof and nullable", () => {
    const arrayBuffer = s
      .custom((value) => value instanceof ArrayBuffer)
      .nullable();
    expect(arrayBuffer.test(new ArrayBuffer(8))).toBe(true);
    expect(arrayBuffer.test(null)).toBe(true);
  });
});

import { ObjectType, s } from "../../src/index.js";
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
        test: (value) => typeof value === "string",
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
  it("without assert", () => {
    const special = s.custom<{ value: string }>();
    expect(special.test(1)).toBe(true);
  });

  it("with type", () => {
    const derived = s.custom(
      s.object({
        id: s.string(),
        name: s.string(),
      }),
    );
    expect(derived.test({ id: "1", name: "test" })).toBe(true);
    expect(derived.test({ id: 1, name: "test" })).toBe(false);
    expect(derived.options.test).toBeInstanceOf(ObjectType);
    expect(derived.toJsonSchema()).toEqual({
      type: ["object"],
      required: ["id", "name"],
      additionalProperties: false,
      properties: {
        id: { type: ["string"] },
        name: { type: ["string"] },
      },
    });
  });
});

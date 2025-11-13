import { InferType, MinimalStringType, s } from "../../src/index.js";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("MinimalStringType", () => {
  it("infer type", () => {
    expectTypeOf<InferType<MinimalStringType>>().toEqualTypeOf<string>();
    expectTypeOf<
      InferType<MinimalStringType<{ nullable: true }>>
    >().toEqualTypeOf<string | null>();
  });
});

describe("string.type", () => {
  it("return type", () => {
    expect(s.string().kind).toBe("string");
  });
});

describe("string.title", () => {
  it("return title", () => {
    expect(s.string().title("test").options.title);
  });
});

describe("string.test", () => {
  it("test string values", () => {
    const $ = s.string();
    expect($.test("")).toBeTruthy();
  });
  it("test with min option", () => {
    const $ = s.string().min(2);
    expect($.test("")).toBeFalsy();
    expect($.test("a")).toBeFalsy();
    expect($.test("ab")).toBeTruthy();
  });
  it("test with nullable option", () => {
    const $ = s.string().nullable();
    expect($.options.nullable).toBe(true);
    expect($.test("")).toBeTruthy();
    expect($.test(null)).toBeTruthy();
    expect($.test(undefined)).toBeFalsy();
  });
  it("test with optional option", () => {
    const $ = s.string().optional();
    expect($.test("")).toBeTruthy();
    expect($.test(undefined)).toBeTruthy();
    expect($.test(null)).toBeFalsy();
  });
  it("test with max option", () => {
    const $ = s.string().max(3);
    expect($.test("")).toBeTruthy();
    expect($.test("a")).toBeTruthy();
    expect($.test("ab")).toBeTruthy();
    expect($.test("abc")).toBeTruthy();
    expect($.test("abcd")).toBeFalsy();
  });
  it("test non string values", () => {
    const string = s.string();
    expect(string.test(true)).toBeFalsy();
    expect(string.test(false)).toBeFalsy();
    expect(string.test(1)).toBeFalsy();
    expect(string.test(null)).toBeFalsy();
    expect(string.test(undefined)).toBeFalsy();
    expect(string.test([])).toBeFalsy();
    expect(string.test({})).toBeFalsy();
    expect(string.test(new String())).toBeFalsy();
  });
  it("test with refine", () => {
    const upperType = s
      .string()
      .refine((value) => value.toUpperCase() === value);
    expect(upperType.test("aa")).toBe(false);
    expect(upperType.test("AA")).toBe(true);
    expect(upperType.test("1")).toBe(true);
  });
});

import { s } from "../../src/index.js";
import { describe, expect, it } from "vitest";

describe("number.test", () => {
  it("test min option", () => {
    expect(s.number().min(1).test(-1)).toBeFalsy();
    expect(s.number().min(1).test(0)).toBeFalsy();
    expect(s.number().min(1).test(1)).toBeTruthy();
    expect(s.number().min(1).test(10)).toBeTruthy();
  });
  it("test max option", () => {
    expect(s.number().max(9).test(-1)).toBeTruthy();
    expect(s.number().max(9).test(0)).toBeTruthy();
    expect(s.number().max(9).test(9)).toBeTruthy();
    expect(s.number().max(9).test(10)).toBeFalsy();
  });
  it("test integer option", () => {
    expect(s.number().integer().test(-1)).toBeTruthy();
    expect(s.number().integer().test(0)).toBeTruthy();
    expect(s.number().integer().test(5)).toBeTruthy();
    expect(s.number().integer().test(5.1)).toBeFalsy();
    expect(s.number().integer().test(0.01)).toBeFalsy();
    expect(s.number().integer().test(-1.3)).toBeFalsy();
  });
  it("test non numbers ", () => {
    expect(s.number().test(true)).toBeFalsy();
    expect(s.number().test(false)).toBeFalsy();
    expect(s.number().test("6")).toBeFalsy();
    expect(s.number().test({})).toBeFalsy();
    expect(s.number().test([])).toBeFalsy();
    expect(s.number().test(null)).toBeFalsy();
  });
});

describe("number.cast", () => {
  it("return number", () => {
    expect(s.number().cast("123")).toBe(123);
    expect(s.number().cast("1.5")).toBe(1.5);
    expect(s.number().cast("+1.5")).toBe(1.5);
    expect(s.number().cast("-3")).toBe(-3);
    expect(s.number().cast("-0")).toBe(0);
  });
});

describe("number.regex", () => {
  it("return number regex", () => {
    expect(s.number().regex()).toStrictEqual(/^\-?\d+(?:\.\d+)?$/);
  });
  it("return integer regex", () => {
    expect(s.number().integer().regex()).toStrictEqual(/^\-?\d+$/);
  });
  it("return unsigned integer regex", () => {
    expect(s.number().integer().min(0).regex()).toStrictEqual(/^\d+$/);
  });
  it("return negative integer regex", () => {
    expect(s.number().integer().min(-5).max(-1).regex()).toStrictEqual(
      /^\-\d+$/,
    );
  });
});

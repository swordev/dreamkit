import { s } from "../../src/index.js";
import { describe, expect, it } from "vitest";

describe("bool.test", () => {
  it("test bool", () => {
    expect(s.bool().test(true)).toBeTruthy();
    expect(s.bool().test(false)).toBeTruthy();
  });
  it("test non booleans ", () => {
    expect(s.number().test("6")).toBeFalsy();
    expect(s.number().test({})).toBeFalsy();
    expect(s.number().test([])).toBeFalsy();
    expect(s.number().test(null)).toBeFalsy();
  });
});

describe("bool.cast", () => {
  it("return boolean", () => {
    expect(s.bool().cast("true")).toBe(true);
    expect(s.bool().cast("false")).toBe(false);
    expect(s.bool().cast("0")).toBe(false);
    expect(s.bool().cast("1")).toBe(true);
  });
  it("return the input", () => {
    expect(s.bool().cast("TRUE")).toBe("TRUE");
    expect(s.bool().cast("False")).toBe("False");
    expect(s.bool().cast("00")).toBe("00");
    expect(s.bool().cast(false)).toBe(false);
    expect(s.bool().cast(true)).toBe(true);
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

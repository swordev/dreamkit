import { isPlainObject } from "../lib/object";
import * as module from "./module";
import { describe, expect, it } from "vitest";

describe("isPlainObject", () => {
  it("with plain object", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ x: 1 })).toBe(true);
  });

  it("with module", () => {
    expect(isPlainObject(module)).toBe(true);
  });

  it("with null prototype", () => {
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it("with falsy values", () => {
    class A {
      public value = 1;
    }
    expect(isPlainObject(new A())).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(() => {})).toBe(false);
    expect(isPlainObject(1)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(false)).toBe(false);
    expect(isPlainObject("")).toBe(false);
    expect(isPlainObject("string")).toBe(false);
    expect(isPlainObject(1n)).toBe(false);
  });
});

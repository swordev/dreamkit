import { isPlainObject, sortByDeps } from "../lib/object";
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

describe("sortByDeps", () => {
  it("throw error by circular dep", () => {
    expect(() =>
      sortByDeps([
        { value: "a", deps: ["b"] },
        { value: "b", deps: ["a"] },
      ]),
    ).toThrowError();
  });

  it("throw error by missing dep", () => {
    expect(() =>
      sortByDeps([{ value: "a" }, { value: "b", deps: ["x"] }]),
    ).toThrowError();
  });

  it("sort by deps", () => {
    expect(
      sortByDeps([
        {
          value: "a",
          deps: ["b", "c"],
        },
        {
          value: "b",
        },
        {
          value: "c",
        },
      ]).map((v) => v.value),
    ).toEqual(["b", "c", "a"]);
  });

  it("sort by deps and priority", () => {
    expect(
      sortByDeps([
        {
          value: "http",
          priority: -1,
        },
        {
          value: "migrator",
          deps: ["db"],
        },
        {
          value: "db",
        },
        {
          value: "logger",
          priority: 1,
        },
      ]).map((v) => v.value),
    ).toEqual(["logger", "db", "migrator", "http"]);

    expect(
      sortByDeps([
        {
          value: "a",
          priority: -1,
        },
        {
          value: "b",
          priority: 1,
        },
      ]).map((v) => v.value),
    ).toEqual(["b", "a"]);
  });
});

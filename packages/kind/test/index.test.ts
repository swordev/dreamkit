import { kind } from "../lib/index.js";
import { getKind, getKinds, is, kindOf, kindTag } from "./../src";
import { describe, expect, it } from "vitest";

class A {
  protected static [kindTag] = "@dreamkit/kind/A";
}
class B extends A {
  protected static [kindTag] = "@dreamkit/kind/B";
}
class C extends B {
  protected static [kindTag] = "@dreamkit/kind/C";
}

describe("getKinds", () => {
  it("return all tags", () => {
    expect(getKinds(A)).toEqual(["@dreamkit/kind/A"]);
    expect(getKinds(B)).toEqual(["@dreamkit/kind/A", "@dreamkit/kind/B"]);
    expect(getKinds(C)).toEqual([
      "@dreamkit/kind/A",
      "@dreamkit/kind/B",
      "@dreamkit/kind/C",
    ]);
  });
});

describe("getKinds", () => {
  it("return last tag", () => {
    expect(getKind(A)).toEqual("@dreamkit/kind/A");
    expect(getKind(B)).toEqual("@dreamkit/kind/B");
    expect(getKind(C)).toEqual("@dreamkit/kind/C");
  });
});

describe("kindOf", () => {
  it("check instances", () => {
    expect(kindOf(new A(), A)).toBe(true);
    expect(kindOf(new B(), A)).toBe(true);
    expect(kindOf(new C(), A)).toBe(true);

    expect(kindOf(new A(), B)).toBe(false);
    expect(kindOf(new B(), B)).toBe(true);
    expect(kindOf(new C(), B)).toBe(true);

    expect(kindOf(new A(), C)).toBe(false);
    expect(kindOf(new B(), C)).toBe(false);
    expect(kindOf(new C(), C)).toBe(true);
  });
});

describe("is", () => {
  it("check constructors", () => {
    expect(is(A, A)).toBe(true);
    expect(is(A, A)).toBe(true);
    expect(is(B, A)).toBe(true);
    expect(is(C, A)).toBe(true);

    expect(is(A, B)).toBe(false);
    expect(is(B, B)).toBe(true);
    expect(is(C, B)).toBe(true);

    expect(is(A, C)).toBe(false);
    expect(is(B, C)).toBe(false);
    expect(is(C, C)).toBe(true);
  });
  it("check constructors with tags", () => {
    expect(is(A, "@dreamkit/kind/A")).toBe(true);
    expect(is(A, "@dreamkit/kind/A")).toBe(true);
    expect(is(B, "@dreamkit/kind/A")).toBe(true);
    expect(is(C, "@dreamkit/kind/A")).toBe(true);

    expect(is(A, "@dreamkit/kind/B")).toBe(false);
    expect(is(B, "@dreamkit/kind/B")).toBe(true);
    expect(is(C, "@dreamkit/kind/B")).toBe(true);

    expect(is(A, "@dreamkit/kind/C")).toBe(false);
    expect(is(B, "@dreamkit/kind/C")).toBe(false);
    expect(is(C, "@dreamkit/kind/C")).toBe(true);
  });
});

describe("kind", () => {
  class A {
    static {
      kind(this, "a");
    }
  }
  it("return all tags", () => {
    expect(getKinds(A)).toEqual(["a"]);
    kind(A, "b");
    expect(getKinds(A)).toEqual(["a", "b"]);
  });
});

import { IocRegistry } from "../src/registry.js";
import { kind } from "@dreamkit/kind";
import { describe, expect, it } from "vitest";

describe("IocRegistry", () => {
  it("set two keys", () => {
    const map = new IocRegistry();
    class A {}
    class B {}
    const a = {};
    const b = {};
    map.set(A, a);
    map.set(B, b);
    expect(map.size).toBe(2);
    expect(map.get(A)).toBe(a);
    expect(map.get(B)).toBe(b);
  });
  it("override the key", () => {
    const map = new IocRegistry();
    class A {}
    const a = {};
    const b = {};
    map.set(A, a);
    map.set(A, b);
    expect(map.size).toBe(1);
    expect(map.get(A)).toBe(b);
    expect(map.get(A)).toBe(b);
  });
  it("set two keys using an inherited class", () => {
    const map = new IocRegistry();
    class A1 {}
    class A2 extends A1 {}
    map.set(A1, {});
    map.set(A2, {});
    expect(map.size).toBe(2);
  });
  it("set two keys using the kind", () => {
    const map = new IocRegistry();
    class A1 {
      static {
        kind(this, "A");
      }
    }
    class A2 extends A1 {
      static {
        kind(this, "A2");
      }
    }
    map.set(A1, {});
    map.set(A2, {});
    expect(map.size).toBe(2);
  });
  it("override they key using the kind", () => {
    const map = new IocRegistry();
    class A1 {
      static {
        kind(this, "A");
      }
    }
    class A2 extends A1 {}
    map.set(A1, {});
    map.set(A2, {});
    expect(map.size).toBe(1);
  });
});

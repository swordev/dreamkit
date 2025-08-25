import { KindMap } from "../../src/utils/kind.js";
import { kind } from "@dreamkit/kind";
import { describe, expect, it } from "vitest";

describe("KindMap", () => {
  class A {
    static {
      kind(this, "a");
    }
  }

  class B {
    static {
      kind(this, "B");
    }
  }

  class B2 {
    static {
      kind(this, "B");
    }
  }
  it("use the kind value internally", () => {
    const map = new KindMap<any, number>();

    map.set(A, 1);
    map.set(B, 2);

    expect(map.get(A)).toBe(1);

    // B, B2 = 2

    expect(map.get(B)).toBe(2);
    expect(map.get(B2)).toBe(2);

    expect([...map.keys()].length).toBe(2);

    // B, B2 = 3

    map.set(B2, 3);
    expect([...map.keys()].length).toBe(2);

    expect(map.get(B)).toBe(3);
    expect(map.get(B2)).toBe(3);

    // B, B2 = undefined

    map.delete(B2);

    expect([...map.keys()].length).toBe(1);
    expect(map.get(B)).toBe(undefined);
    expect(map.get(B2)).toBe(undefined);
  });
});

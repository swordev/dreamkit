import { InferType, s } from "../../src/index.js";
import { describe, expectTypeOf, it } from "vitest";

describe("any.def", () => {
  it("parses optional option", () => {
    const o1 = s.object({ a: s.any() });
    const o2 = s.object({ a: s.any().optional() });
    expectTypeOf<InferType<typeof o1>>().toEqualTypeOf<{ a: any }>();
    expectTypeOf<InferType<typeof o2>>().toEqualTypeOf<{ a?: any }>();
  });
});

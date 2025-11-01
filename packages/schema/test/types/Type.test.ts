import { s } from "../../src/index.js";
import { describe, expect, it } from "vitest";

describe("type.meta", () => {
  it("save meta data", () => {
    const t = s.string().meta({ info: "data" }).min(1).max(5);
    expect(t.options.meta).toEqual({ info: "data" });
  });
  it("merge meta data", () => {
    const t = s.string().meta({ info: "data" }).meta({ info2: "data" });
    expect(t.options.meta).toEqual({ info: "data", info2: "data" });
  });
  it("remove meta data", () => {
    const t = s.string().meta({ info: "data" }).meta(undefined);
    expect(t.options.meta).toEqual(undefined);
  });
});

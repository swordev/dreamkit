import { s } from "../../src/index.js";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, it, expectTypeOf } from "vitest";

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

describe("type.description", () => {
  it("save description", () => {
    const t = s.string().description("User name").min(1).max(5);
    expect(t.options.description).toEqual("User name");
  });
  it("remove description", () => {
    const t = s.string().description("User name").description(undefined);
    expect(t.options.description).toEqual(undefined);
  });
});

describe("type.standard.validate", () => {
  const o = s.object({
    a: s.string(),
    b: s.bool(),
  });
  it("returns no errors", async () => {
    const value = { a: "", b: true };
    expect(await o["~standard"].validate(value)).toEqual({
      value,
      issues: [],
    });
  });
  it("returns errors", async () => {
    const value = { a: "", b: "" };
    expect(await o["~standard"].validate(value)).toEqual({
      value,
      issues: [{ message: "", path: ["b"] }],
    });
  });
  it("returns custom message", async () => {
    const password = s.string().refine((input) => {
      if (input.length < 8) return [{ path: [], message: "Invalid password" }];
      return true;
    });
    const value = "1234567";
    expect(await password["~standard"].validate(value)).toEqual({
      value,
      issues: [{ path: [], message: "Invalid password" }],
    });
  });
});

describe("type.standard.inferOutput", () => {
  it("infer nullable", async () => {
    const $ = s.string().nullable();
    expectTypeOf<StandardSchemaV1.InferOutput<typeof $>>().toEqualTypeOf<
      string | null
    >();
  });
  it("infer nullish", async () => {
    const $ = s.string().nullish();
    expectTypeOf<StandardSchemaV1.InferOutput<typeof $>>().toEqualTypeOf<
      string | null | undefined
    >();
  });
});

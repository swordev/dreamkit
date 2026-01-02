import "./override.ts";
import { s } from "@dreamkit/schema";
import { describe, expect, it } from "vitest";

describe("override", () => {
  it("add uuid", () => {
    s.uuid = function () {
      return this.string().refine((val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          val,
        ),
      );
    };
    expect(s.uuid().test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(s.uuid().test("not-a-uuid")).toBe(false);
    expect(s.uuid().nullable().test(null)).toBe(true);
  });
});

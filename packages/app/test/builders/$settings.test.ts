import { $settings } from "../../src/index.js";
import { s } from "@dreamkit/schema";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("$settings", ({}) => {
  it("with defaults", () => {
    const AppSettings = $settings
      .name("app")
      .optional()
      .params({
        name: s.string(),
        port: s.number().optional(),
      })
      .defaults((input) => ({
        ...input,
        port: input.port ?? 80,
      }))
      .create();

    const app = new AppSettings({ name: "my-app" });
    expect(app.params).toEqual({ name: "my-app", port: 80 });
    expectTypeOf<typeof app.params>().toEqualTypeOf<{
      name: string;
      port: number;
    }>();
  });
  it("with generate", () => {
    const AppSettings = $settings
      .name("app")
      .optional()
      .params({
        name: s.string(),
        key: s.string(),
      })
      .generate((input) => ({
        ...(!input.key && { key: "abc" }),
      }))
      .create();

    const params = AppSettings.options.generate!({ name: "my-app" });

    expect(params).toEqual({ key: "abc" });
  });
});

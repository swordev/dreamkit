import { createAction } from "../../src/primitives/createAction.js";
import { $api } from "@dreamkit/app";
import { s } from "@dreamkit/schema";
import { describe, it, expect } from "vitest";

describe("createAction", () => {
  it("pass title prop", () => {
    const title = "Title";
    const api = $api.title(title).create(() => {});
    expect(createAction(api).title).toStrictEqual(title);
    expect(createAction(api).with(() => {}).title).toStrictEqual(title);
  });
  it("pass params prop", () => {
    const params = { name: s.string() };
    const api = $api.params(params).create(() => {});
    expect(createAction(api).params).toStrictEqual(params);
    expect(createAction(api).with(() => ({ name: "" })).params).toStrictEqual(
      params,
    );
  });
});

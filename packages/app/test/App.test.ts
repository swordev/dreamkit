import { App, EJSON } from "../src/index.js";
import { errorSerializer } from "../src/presets/index.js";
import { describe, expect, it } from "vitest";

describe("App.add", () => {
  it("add/remove serializer", async () => {
    const app = new App();
    await app.add([errorSerializer]);
    expect(app.context.resolve(EJSON).serializers.length).toBe(1);
    await app.remove([app.getObjectId(errorSerializer)]);
    expect(app.context.resolve(EJSON).serializers.length).toBe(0);
  });
});

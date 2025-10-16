import { App, errorSerializer } from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("App.add", () => {
  it("add serializer", async () => {
    const app = new App();
    expect(app.serializers.size).toBe(0);
    await app.add([errorSerializer]);
    expect(app.serializers.size).toBe(1);
  });
});

import { $func } from "./../src/$func.ts";
import { context } from "@dreamkit/ioc";
import { describe, expect, it } from "vitest";

describe("$func", () => {
  class Data {
    constructor(readonly value: number) {}
  }
  async function fetchValue() {
    return 1;
  }
  it("create sync function", () => {
    const func = $func.create(() => 1);
    expect(func()).toBe(1);
  });
  it("create async function", async () => {
    const func = $func.create(async () => 1);
    await expect(func()).resolves.toBe(1);
  });
  it("create sync function with async factory", async () => {
    const ctx = context.fork().register(Data, {
      async useFactory() {
        return new Data(await fetchValue());
      },
    });

    const fetch = $func.self({ Data }).create(function () {
      return this.data.value;
    });

    expect(() => ctx.resolve(fetch)).toThrowError();
    expect(
      fetch.bind({
        data: new Data(1),
      })(),
    ).toBe(1);

    const resolvedFunc = await ctx.resolveAsync(fetch);
    expect(resolvedFunc()).toBe(1);
  });

  it("create async function with async factory", async () => {
    const ctx = context.fork().register(Data, {
      async useFactory() {
        return new Data(await fetchValue());
      },
    });

    const fetch = $func.self({ Data }).create(async function () {
      return this.data.value;
    });

    expect(() => ctx.resolve(fetch)).toThrowError();
    expect(
      await fetch.bind({
        data: new Data(1),
      })(),
    ).toBe(1);

    const resolvedFunc = await ctx.resolveAsync(fetch);
    await expect(resolvedFunc()).resolves.toBe(1);
  });
});

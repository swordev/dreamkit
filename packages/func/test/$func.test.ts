import { $func } from "./../src/$func.ts";
import { context } from "@dreamkit/ioc";
import { s } from "@dreamkit/schema";
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
  it("create with object param", async () => {
    const params = { value: s.number() };
    const func = $func.params(params).create((o) => o.value * 2);
    expect(func.params.value).toBe(params.value);
    // @ts-expect-error
    expect(() => func({ value: "2" })).toThrowError();
    expect(func({ value: 2 })).toBe(4);
  });
  it("create with number param", async () => {
    const params = s.number();
    const func = $func.params(params).create((value) => value * 2);
    expect(func.$options.params).toBe(params);
    expect(func.params).toBe(params);
    // @ts-expect-error
    expect(() => func("2")).toThrowError();
    expect(func(2)).toBe(4);
  });
  it("create with custom param", async () => {
    const params = s.custom<{ value: number }>();
    const func = $func.params(params).create((o) => o.value * 2);
    expect(func.$options.params).toBe(params);
    expect(func.params).toBe(params);
    // @ts-expect-error
    expect(func("2")).toBe(NaN);
    expect(func({ value: 2 })).toBe(4);
  });
});

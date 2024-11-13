import { IocClass } from "../src/class.js";
import { context } from "../src/context.js";
import { IocFunc } from "../src/func.js";
import { iocParam } from "../src/params.js";
import { describe, expect, it } from "vitest";

describe("IocFunc", () => {
  it("bind params", () => {
    class A {
      constructor(readonly value: number) {}
    }
    const func = IocFunc({ A })(function () {
      return this.a.value;
    });
    expect(func.bind({ a: new A(3) })()).toBe(3);
  });
  it("resolve a function", () => {
    class A {
      constructor(readonly value: number) {}
    }
    const func = IocFunc({ A })(function () {
      return this.a.value;
    });

    const ctx = context.fork().register(A, {
      value: new A(2),
    });

    ctx.resolve(func);
  });
  it("resolve a function with a class", () => {
    const ctx = context.fork();
    class A {
      constructor(readonly value: number) {}
    }
    const func = IocFunc({ A })(function () {
      return this.a.value;
    });

    class B extends IocClass({ func }) {
      callFunc() {
        return this.func();
      }
    }

    ctx.register(A, {
      value: new A(2),
    });

    expect(ctx.resolve(B).callFunc()).toBe(2);
  });

  it("resolve with custom registry", () => {
    class TestContext {
      constructor(readonly value: number) {}
    }
    const func = IocFunc({
      TestContext: iocParam(TestContext).optional(),
    })(function () {
      return this.testContext?.value;
    });

    const func1 = IocFunc({ func })(function () {
      return this.func();
    });

    const func2 = IocFunc({ func }, [
      [TestContext, { value: new TestContext(2) }],
    ])(function () {
      return this.func();
    });

    const $func1 = context.resolve(func1);
    const $func2 = context.resolve(func2);

    expect($func1()).toBe(undefined);
    expect($func2()).toBe(2);
  });
});

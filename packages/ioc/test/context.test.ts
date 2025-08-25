import { IocClass, IocContext, IocFunc, context } from "../src/index.js";
import { kind, kindOf } from "@dreamkit/kind";
import { describe, expect, it } from "vitest";

describe("IocContext", () => {
  it("instanceof IocContext", () => {
    expect(kindOf(context, IocContext)).toBeTruthy();
  });
});

describe("IocContext.fork", () => {
  it("fork the instance", () => {
    const ctx = context.fork();
    ctx.register(class A {}, {
      value: 1,
    });
    expect(ctx.registry.size).toBe(1);
    expect(context.registry.size).toBe(0);
  });
});

describe("IocContext.register", () => {
  it("use factory with parent discrimination", () => {
    const ctx = context.fork();

    class Data {
      constructor(readonly value: number) {}
    }
    {
    }

    const func2 = IocFunc({ Data })(function () {
      return this.data.value;
    });
    const func1 = IocFunc({ func2, Data })(function () {
      return [this.data.value, this.func2()];
    });
    ctx.register(Data, {
      useFactory(context, key, parent) {
        if (parent === func1) {
          return new Data(1);
        } else {
          return new Data(2);
        }
      },
    });

    expect(ctx.resolve(func1)()).toEqual([1, 2]);
  });
});
describe("IocContext.registerSelf", () => {
  it("return self context", () => {
    const $context = context.fork();
    expect($context.registerSelf().resolve(IocContext)).toBe($context);
  });
});

describe("IocContext.resolve", () => {
  it("return undefined", () => {
    expect(context.resolve(IocContext, { optional: true })).toBeUndefined();
  });
  it("throw error", () => {
    const ctx = context.fork();
    class A {}
    expect(() => context.resolve(A)).toThrowError();
    ctx.register(A, {
      value: new A(),
    });
    class B {}
    expect(() => context.resolve(B)).toThrowError();
  });
  it("resolve to value", () => {
    const ctx = context.fork();
    class A {}
    class B {}
    ctx.register(A, {
      value: 1,
    });
    ctx.register(B, {
      value: 2,
    });
    expect(ctx.resolve(A)).toBe(1);
    expect(ctx.resolve(B)).toBe(2);
  });
  it("resolve to value using key class", () => {
    class A {
      static {
        kind(this, "key");
      }
    }
    class B {
      static {
        kind(this, "key");
      }
    }
    context.register(A, {
      value: 1,
    });
    expect(context.resolve(A)).toBe(1);
    expect(context.resolve(B)).toBe(1);
  });
  it("resolve using class", () => {
    const ctx = context.fork();
    class A extends IocClass({}) {
      get() {
        return 1;
      }
    }
    class B {
      get() {
        return 2;
      }
    }
    class C extends IocClass({ A }) {
      get() {
        return 3;
      }
    }
    ctx.register(B, { useClass: C });

    const b = ctx.resolve(B) as C;
    expect(b.get()).toBe(3);
    expect(b.a.get()).toBe(1);
  });
  it("resolve using singleton", () => {
    const ctx = context.fork();
    class CounterBase {
      value = 0;
    }
    class Counter extends IocClass(CounterBase, {}) {}
    ctx.register(CounterBase, { useClass: Counter, singleton: true });
    expect(++ctx.resolve(CounterBase).value).toBe(1);
    expect(++ctx.resolve(CounterBase).value).toBe(2);
  });
  it("override IocClass", () => {
    class CounterBase {
      value = 0;
    }
    class Counter extends IocClass(CounterBase, {}) {}

    const ctx = context.fork();
    expect(ctx.resolve(Counter).value).toBe(0);
    const counter = new Counter();
    counter.value = 1;
    ctx.register(Counter, { value: counter });
    expect(ctx.resolve(Counter).value).toBe(1);
  });

  it("avoid recursion", () => {
    class Counter extends IocClass({}) {}

    expect(
      context
        .fork()
        .register(Counter, {
          value: new Counter(),
          onlyIf: (ctx) => !!ctx.resolve(Counter),
        })
        .resolve(Counter),
    ).toBeInstanceOf(Counter);

    expect(
      context
        .fork()
        .register(Counter, {
          value: new Counter(),
          useFactory: (ctx) => ctx.resolve(Counter),
        })
        .resolve(Counter),
    ).toBeInstanceOf(Counter);

    expect(
      context
        .fork()
        .register(Counter, {
          useClass: Counter,
        })
        .resolve(Counter),
    ).toBeInstanceOf(Counter);
  });
});

describe("IocContext.resolveParams", () => {
  it("resolve a class", () => {
    const ctx = context.fork();
    class A {}
    ctx.register(A, {
      value: 1,
    });
    const params = ctx.resolveParams({
      A,
    });
    expect(Object.keys(params).join()).toBe("a");
    expect(params.a).toBe(1);
  });
});

describe("IocContext.registerFallback", () => {
  it("replace the value", () => {
    expect(
      context
        .fork()
        .registerFallback({
          value: false,
        })
        .resolve(class {}),
    ).toBe(false);
  });
  it("replace ioc class", () => {
    class UserSession extends IocClass({}) {}
    expect(
      context
        .fork({ onResolveIocObject: () => false })
        .registerFallback({
          value: false,
        })
        .resolve(UserSession),
    ).toBe(false);
  });
});

describe("IocContext.register", () => {
  class A {
    static {
      kind(this, "A");
    }
  }
  class A2 extends A {}
  it("use the kind of class", () => {
    const ctx = context.fork();
    const config = { value: new A() };
    ctx.register(A, config);
    expect(ctx.registry.get(A)).toBe(config);
    expect(ctx.registry.get(A2)).toBe(config);
  });
  it("override using the kind of class", () => {
    const ctx = context.fork();
    const config1 = { value: new A() };
    const config2 = { value: new A() };
    ctx.register(A, config1);
    expect(ctx.registry.size).toBe(1);
    expect(ctx.registry.get(A)).toBe(config1);
    ctx.register(A2, config2);
    expect(ctx.registry.size).toBe(1);
    expect(ctx.registry.get(A)).toBe(config2);
  });
});

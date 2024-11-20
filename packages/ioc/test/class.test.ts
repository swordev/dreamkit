import { createIocClass, IocClass } from "../src/class.js";
import { context } from "../src/context.js";
import { iocParam } from "../src/params.js";
import { kind } from "@dreamkit/kind";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("IocClass", () => {
  it("resolve a class", () => {
    const ctx = context.fork();

    class A {}
    ctx.register(A, {
      value: 1,
    });

    class Obj extends IocClass({
      A,
    }) {}

    expect(ctx.resolve(Obj).a).toBe(1);
  });

  it("without params", () => {
    class A extends IocClass() {
      method() {
        return 1;
      }
    }
    expect(new A().method()).toBe(1);
    // @ts-expect-error
    new A({});
  });
  it("with params", () => {
    class Settings {
      constructor(readonly data: string) {}
    }
    class A extends IocClass({ Settings }) {
      method() {
        return this.settings.data;
      }
    }
    expect(
      new A({
        settings: new Settings("text"),
      }).method(),
    ).toBe("text");
    // @ts-expect-error
    new A({});
  });
  it("with abstract constructor", () => {
    abstract class A1 {
      abstract run(): boolean;
    }
    // @ts-expect-error
    class A2 extends IocClass(A1) {}
    class A3 extends IocClass(A1) {
      run(): boolean {
        return true;
      }
    }
    expect(new A3().run()).toBe(true);
  });
  it("with constructor", () => {
    abstract class A1 {
      run1() {
        return true;
      }
    }
    class A2 extends IocClass(A1) {
      run2() {
        return this.run1();
      }
    }
    expect(new A2().run2()).toBe(true);
  });
  it("with three constructors", () => {
    abstract class A1 {
      run1() {
        return true;
      }
    }
    class A2 extends IocClass(A1) {
      run2() {
        return this.run1();
      }
    }
    class A3 extends IocClass(A2) {
      run3() {
        return this.run2();
      }
    }
    expect(new A3().run3()).toBe(true);
  });

  it("with two constructors and params", () => {
    class Settings {
      constructor(readonly data: number) {}
    }
    class A2 extends IocClass({ Settings }) {}
    expect(new A2({ settings: new Settings(1) }).settings.data).toBe(1);
    expect(A2.$ioc.params.Settings).toBe(Settings);

    class A3 extends IocClass(A2, { settings: new Settings(2) }) {}
    expect(new A3().settings.data).toBe(2);
    // @ts-expect-error
    expect(A3.$ioc.params.Settings).toBe(undefined);

    // @ts-expect-error
    class A4 extends IocClass(A2, { newSettings: new Settings(3) }) {}
  });

  it("with optional parameter", () => {
    class Settings {
      constructor(readonly data: number) {}
    }
    class A2 extends IocClass({
      Settings: iocParam(Settings).optional(),
    }) {}
    expect(A2.$ioc.params.Settings.optional).toBeTruthy();
    const a2 = new A2({ settings: new Settings(1) });
    expectTypeOf(a2.settings).toEqualTypeOf<Settings | undefined>();
    expect(a2.settings?.data).toBe(1);
    const a3 = new A2({});
    expect(a3.settings).toBeUndefined();
  });
  it("with plainObject", () => {
    class Options {
      readonly debug!: boolean;
    }
    class App1 extends IocClass({ Options }) {}
    const app1 = new App1({ options: { debug: true } });
    expect(app1.options.debug).toBe(true);

    class App2 extends IocClass(App1, {
      options: { debug: false },
    }) {}
    const app2 = new App2();
    expect(app2.options.debug).toBe(false);
  });

  it("resolves with configurable", () => {
    class Internal extends IocClass() {
      static {
        kind(this, "Internal");
      }
      method() {
        return 1;
      }
    }
    class External extends IocClass() {
      static {
        kind(this, "External");
      }
      method() {
        return 2;
      }
    }
    class CustomInternal extends IocClass() {
      static {
        kind(this, "CustomInternal");
      }
      method() {
        return 3;
      }
    }

    class App extends IocClass({ Internal, External }) {
      test() {}
    }

    class Test extends IocClass({
      App: iocParam(App).configurable({
        internal: true,
      }),
    }) {
      run() {
        const app = this.app({ internal: new CustomInternal() });
        return {
          internal: app.internal.method(),
          external: app.external.method(),
        };
      }
    }

    expect(context.resolve(Test).run()).toEqual({
      internal: 3,
      external: 2,
    });
  });
});

describe("createIocClass", () => {
  it("merge params", () => {
    class Data {
      value = 1;
    }
    class Handler extends IocClass({ data1: Data }) {}
    const HandlerClass = createIocClass(Handler);
    class Handler2 extends HandlerClass({ data2: Data }) {}
    expect(Handler2.$ioc.params.data1).toBe(Data);
    expect(Handler2.$ioc.params.data2).toBe(Data);
  });
});

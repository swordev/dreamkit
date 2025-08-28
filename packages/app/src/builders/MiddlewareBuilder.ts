import { createIocClass, IocClass, IocParamsUserConfig } from "@dreamkit/ioc";
import { createKind } from "@dreamkit/kind";
import type { Constructor, Merge } from "@dreamkit/utils/ts.js";

export const [kindMiddleware, isMiddleware] = createKind<MiddlewareConstructor>(
  "@dreamkit/app/middleware",
);

export type MiddlewareSelf = IocParamsUserConfig | undefined;
export type MiddlewareData<TSelf extends MiddlewareSelf = MiddlewareSelf> = {
  self?: TSelf;
};

export type MiddlewareOptions<T extends MiddlewareData = MiddlewareData> = T & {
  static?: Record<string, any>;
};

export type MergeMiddlewareData<
  D1 extends MiddlewareData,
  D2 extends Partial<MiddlewareData>,
> = Merge<MiddlewareData, D1, D2>;

export abstract class Middleware {
  static {
    kindMiddleware(this);
  }
  abstract onRequest(): any;
}

export type MiddlewareConstructor = Constructor<Middleware>;

const MiddlewareClass = createIocClass(Middleware);

export class MiddlewareBuilder<T extends MiddlewareData = {}> {
  readonly data: T;
  readonly options: MiddlewareOptions<T>;
  constructor(options: MiddlewareOptions<T> = {} as any) {
    const $this = this;
    this.options = options;
    this.data = {
      get self() {
        return $this.options.self;
      },
    } as T;
  }
  protected clone(next: Partial<MiddlewareOptions>): this {
    const prev = this.options;
    return new MiddlewareBuilder({
      ...prev,
      ...next,
    }) as this;
  }
  self<TSelf extends MiddlewareSelf>(
    value: TSelf,
  ): MiddlewareBuilder<MergeMiddlewareData<T, { self: TSelf }>> {
    return this.clone({ self: value }) as any;
  }
  create(): IocClass<T["self"] & {}, Middleware> {
    const Class = MiddlewareClass(this.options.self || {}) as any;
    if (this.options.static) Object.assign(Class, this.options.static);
    return Class;
  }
}

import { createIocClass } from "@dreamkit/ioc";
import { createKind } from "@dreamkit/kind";
import { Constructor } from "@dreamkit/utils/ts.js";

export const [kindMiddleware, isMiddleware] = createKind<MiddlewareConstructor>(
  "@dreamkit/app/middleware",
);

export type MiddlewareConstructor = Constructor<Middleware>;
export abstract class Middleware {
  static {
    kindMiddleware(this);
  }
  abstract onRequest(): any;
}

export const MiddlewareClass = createIocClass(Middleware);

import { FuncOptions } from "../types.js";
import { context, IocContext } from "@dreamkit/ioc";
import { kindOf } from "@dreamkit/kind";
import { ObjectType, ObjectTypeProps, s } from "@dreamkit/schema";

export function cloneFuncOptions(prev: FuncOptions, next: FuncOptions) {
  return {
    ...prev,
    ...next,
    params:
      "params" in next
        ? next.params === undefined || kindOf(next.params, ObjectType)
          ? next.params
          : (s.object(next.params as any as ObjectTypeProps) as any)
        : prev.params,
    self: {
      ...prev.self,
      ...next.self,
    },
    register: [...(prev.register || []), ...(next.register || [])],
  };
}

export function resolveFuncSelf(options: FuncOptions, input: { self: any }) {
  const selfContext = options.self
    ? kindOf(input.self, IocContext)
      ? input.self
      : input.self === globalThis
        ? context
        : undefined
    : undefined;

  const self = selfContext
    ? selfContext.resolveParams(options.self as any)
    : input.self;

  return self;
}

export function resolveFuncParams(
  options: FuncOptions,
  input: { params?: unknown },
) {
  const params: any = options.params
    ? (options.params as any as ObjectType).safeParse(input.params as any)
    : input.params;
  return params;
}

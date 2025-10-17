import { FuncOptions } from "../types.js";
import { ObjectTypeProps, s, Type } from "@dreamkit/schema";
import { isPlainObject } from "@dreamkit/utils/object.js";

export function cloneFuncOptions(
  prev: FuncOptions,
  next: FuncOptions,
): FuncOptions {
  return {
    ...prev,
    ...next,
    params:
      "params" in next
        ? isPlainObject(next.params)
          ? s.object(next.params as ObjectTypeProps)
          : next.params
        : prev.params,
    self: {
      ...prev.self,
      ...next.self,
    },
    register: [...(prev.register || []), ...(next.register || [])],
  };
}

export function resolveFuncParams(
  options: FuncOptions,
  input: { params?: unknown },
): any {
  return options.params
    ? (options.params as Type).safeParse(input.params)
    : input.params;
}

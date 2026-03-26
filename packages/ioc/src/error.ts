import type { IocRegistryKey } from "./registry.js";

export class IocError extends Error {}

export function createKeyError(input: IocRegistryKey, path?: string[]) {
  const type =
    typeof input === "symbol"
      ? `Symbol '${input.toString()}'`
      : typeof input === "function"
        ? Function.prototype.toString.call(input).startsWith("class")
          ? `Class '${input.name}'`
          : `Function '${input.name}'`
        : `Object '${input}'`;
  const trace = path?.length ? ` (${path?.join(".")})` : "";
  return new IocError(`${type} is not registered${trace}`);
}

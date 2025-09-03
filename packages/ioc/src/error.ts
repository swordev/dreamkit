import type { IocRegistryKey } from "./registry.js";

export class IocError extends Error {}

export function createKeyError(input: IocRegistryKey) {
  if (typeof input === "symbol") {
    return new IocError(`Symbol is not registered: ${input.toString()}`);
  } else if (typeof input === "function") {
    return new IocError(`Class is not registered: ${input.name}`);
  } else {
    return new IocError(`Unknown object is not registered: ${input}`);
  }
}

import { IocError } from "../error.js";

export function ensureSync<T>(value: T, path?: string[]): T {
  if (value instanceof Promise) {
    const trace = path?.length ? ` (${path?.join(".")})` : "";
    throw new IocError(`Synchronous resolutions can't return promises${trace}`);
  }
  return value;
}

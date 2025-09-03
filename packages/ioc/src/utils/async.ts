import { IocError } from "../error.js";

export function ensureSync<T>(value: T): T {
  if (value instanceof Promise)
    throw new IocError("Synchronous resolutions can't return promises");
  return value;
}

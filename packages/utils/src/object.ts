import type { Obj } from "./ts.js";

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return !proto || !Object.getPrototypeOf(proto);
}

export function isEmptyObject(input: Record<string, unknown>) {
  for (const _ in input) return false;
  return true;
}

export function checkSomeObjectProp(orPattern: Obj, subject: Obj): boolean {
  if (isEmptyObject(orPattern)) return true;
  for (const key in orPattern)
    if (orPattern[key] === (subject[key] || false)) return true;
  return false;
}

export function merge(object: Obj, patch: Obj): Obj {
  for (const key in patch) {
    const value = patch[key];
    if (isPlainObject(object[key]) && isPlainObject(value)) {
      merge(object[key], value);
    } else if (value === undefined) {
      delete object[key];
    } else {
      object[key] = value;
    }
  }
  return object;
}

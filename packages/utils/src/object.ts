import type { Obj } from "./ts.js";

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

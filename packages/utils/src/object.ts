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

export function sortByDeps<
  T extends { value: any; deps?: any[]; priority?: number },
>(items: T[]): T[] {
  const sorted: T[] = [];
  const remaining = [...items];

  while (remaining.length > 0) {
    const ready = remaining.filter((item) =>
      (item.deps || []).every((dep) => sorted.some((s) => s.value === dep)),
    );

    if (!ready.length)
      throw new Error("Circular dependency or missing deps", {
        cause: { remaining },
      });

    const next = ready.reduce((best, current) =>
      (current.priority ?? 0) > (best.priority ?? 0) ? current : best,
    );

    sorted.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }

  return sorted;
}

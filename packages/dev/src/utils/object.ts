export type Obj = Record<string, any>;

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    !!value &&
    !!(value = Object.getPrototypeOf(value)) &&
    !Object.getPrototypeOf(value)
  );
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

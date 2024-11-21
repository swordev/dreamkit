export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    !!value &&
    !!(value = Object.getPrototypeOf(value)) &&
    !Object.getPrototypeOf(value)
  );
}

export function typeOf(value: unknown) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const constructorName = value?.constructor?.name;
  const typeOf = typeof value;
  if (typeOf === "object" && constructorName !== "Object")
    return constructorName;
  return typeOf;
}

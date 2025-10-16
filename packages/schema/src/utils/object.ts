export function typeOf(value: unknown) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const constructorName = value?.constructor?.name;
  const typeOf = typeof value;
  if (typeOf === "object" && constructorName !== "Object")
    return constructorName;
  return typeOf;
}

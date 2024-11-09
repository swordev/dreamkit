export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    !!value &&
    !!(value = Object.getPrototypeOf(value)) &&
    !Object.getPrototypeOf(value)
  );
}

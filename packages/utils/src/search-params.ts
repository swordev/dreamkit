export function createJsonSearchParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const name in input) {
    const value = input[name];
    if (value !== undefined)
      params.set(
        name,
        typeof value === "object" && value ? JSON.stringify(value) : `${value}`,
      );
  }
  return params;
}

export function createSearchParamsRecord(
  search: string,
): Record<string, unknown> {
  const object = new URLSearchParams(search);
  const params: Record<string, unknown> = {};
  object.forEach((value, name) => {
    params[name] = value;
  });
  return params;
}

export function prettySearchParams(path: string) {
  return path
    .replaceAll("%24", "$")
    .replaceAll("%7B", "{")
    .replaceAll("%3A", ":")
    .replaceAll("%2C", ",")
    .replaceAll("%7D", "}")
    .replaceAll("%5B", "[")
    .replaceAll("%5D", "]");
}

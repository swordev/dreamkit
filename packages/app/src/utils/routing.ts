export function extractPathParams(
  path: string,
): { spread: boolean; name: string; key: string }[] {
  return [...path.matchAll(/([:\*])(\w+)/g)].map((match) => ({
    key: match[0],
    spread: match[1] === "*",
    name: match[2],
  }));
}

export function createRouteUrl(
  path: string,
  params: Record<string, any> = {},
  base = globalThis.location?.origin ?? "http://localhost",
) {
  const paramNames = extractPathParams(path);
  for (const param of paramNames)
    path = path.replaceAll(param.key, params[param.name]);

  const url = new URL(path, base);

  for (const name in params)
    if (!paramNames.find((param) => param.name === name))
      url.searchParams.set(name, params[name]);

  return url;
}

export function createRouteHref(
  path: string,
  params: Record<string, any> = {},
) {
  const url = createRouteUrl(path, params);
  return url.pathname + url.search;
}
